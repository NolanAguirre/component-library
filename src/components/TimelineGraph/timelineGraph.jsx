import { useEffect, useRef, useState, Children, cloneElement, isValidElement } from 'react'
import Canvas, { CanvasSurface, CanvasMinimap, CanvasControls } from '../Canvas/canvas'
import './styles.css'

const DRAG_THRESHOLD = 3
const WORLD_WIDTH = 2000
const LANE_HEIGHT = 120
const TICK_TARGET = 8
const TICK_LIMIT = 200
const FRAME_WIDTH = 2
const OVERVIEW_OUTLINE_WIDTH = 1.5
/* World px either side of a lane axis that accepts a click; matches the pad on
   .timeline-graph__axis::before so the crosshair marks exactly what is hittable */
const AXIS_HIT = 6

const clamp = (value, low, high) => Math.min(high, Math.max(low, value))

const formatTick = (value) => {
  if (!Number.isFinite(value)) return ''
  if (Number.isInteger(value)) return String(value)
  return String(Math.round(value * 100) / 100)
}

const niceStep = (raw) => {
  if (!(raw > 0)) return 1
  const base = Math.pow(10, Math.floor(Math.log10(raw)))
  const fraction = raw / base
  if (fraction <= 1) return base
  if (fraction <= 2) return 2 * base
  if (fraction <= 5) return 5 * base
  return 10 * base
}

const allPoints = (lanes) => lanes.flatMap((lane) => (
  (lane.points || []).map((point) => ({ ...point, laneId: lane.id }))
))

const earliestPoint = (lane) => (lane.points || []).reduce((earliest, point) => (
  earliest == null || Number(point.start) < Number(earliest.start) ? point : earliest
), null)

const curve = (from, to) => {
  const mid = (from.x + to.x) / 2
  return `M ${from.x} ${from.y} C ${mid} ${from.y}, ${mid} ${to.y}, ${to.x} ${to.y}`
}

const laneOfPoint = (lanes, pointId) => lanes.find((lane) => (
  (lane.points || []).some((point) => point.id === pointId)
))

const linkCurve = (positions, link) => {
  if (!link?.sourceId || !link.targetId) return null
  const from = positions.get(link.sourceId)
  const to = positions.get(link.targetId)
  if (!from || !to) return null
  const x = link.mode === 'start' ? from.xStart : from.xEnd
  return curve({ x, y: from.y }, { x: to.xStart >= x ? to.xStart : to.xEnd, y: to.y })
}

const geometry = (lanes, edges, toWorldX, laneCenterY, link) => {
  const positions = new Map()
  lanes.forEach((lane, laneIndex) => {
    (lane.points || []).forEach((point) => {
      positions.set(point.id, {
        xStart: toWorldX(Number(point.start)),
        xEnd: toWorldX(Number(point.end)),
        y: laneCenterY(laneIndex)
      })
    })
  })

  const forks = lanes.map((lane) => {
    if (!lane.branchFrom?.pointId) return null
    const from = positions.get(lane.branchFrom.pointId)
    const target = earliestPoint(lane)
    const to = target ? positions.get(target.id) : null
    if (!from || !to) return null
    return {
      id: `fork-${lane.id}`,
      path: curve({ x: from.xEnd, y: from.y }, { x: to.xStart, y: to.y })
    }
  }).filter(Boolean)

  const merges = edges.map((edge) => {
    const from = positions.get(edge.sourcePointId)
    const to = positions.get(edge.targetPointId)
    if (!from || !to) return null
    return {
      id: `merge-${edge.id}`,
      path: curve({ x: from.xEnd, y: from.y }, { x: to.xStart, y: to.y })
    }
  }).filter(Boolean)

  return { forks, merges, link: linkCurve(positions, link) }
}

/**
 * TimelineGraphOverview — flat lane bands and point rectangles for the minimap.
 *
 * Uses the same world coordinates as the surface, so the overview is the same
 * layout math at minimap scale. No handles, labels, or buttons. Points keep
 * their lane colour; the selected one is marked with a white outline whose
 * width is divided by the minimap scale so it stays one hairline on screen.
 */
export const TimelineGraphOverview = ({
  minimap = {},
  lanes = [],
  worldWidth = WORLD_WIDTH,
  laneHeight = LANE_HEIGHT,
  toWorldX = () => 0,
  laneCenterY = () => 0,
  selectedId,
  activeLaneId
}) => {
  const scale = minimap.scale || 1

  return (
    <div className="timeline-graph__overview">
      {lanes.map((lane, laneIndex) => (
        <div
          key={lane.id}
          className={[
            'timeline-graph__band',
            lane.main ? 'timeline-graph__band--main' : '',
            lane.id === activeLaneId ? 'timeline-graph__band--active' : ''
          ].filter(Boolean).join(' ')}
          style={{
            top: `${laneIndex * laneHeight}px`,
            width: `${worldWidth}px`,
            height: `${laneHeight}px`
          }}
        />
      ))}
      {lanes.flatMap((lane, laneIndex) => (lane.points || []).map((point) => {
        const left = toWorldX(Number(point.start))
        const right = toWorldX(Number(point.end))
        const isSelected = selectedId === point.id

        return (
          <div
            key={point.id}
            className={[
              'timeline-graph__overview-point',
              lane.main ? 'timeline-graph__overview-point--main' : '',
              isSelected ? 'timeline-graph__overview-point--selected' : ''
            ].filter(Boolean).join(' ')}
            style={{
              left: `${left}px`,
              width: `${Math.max(right - left, laneHeight * 0.08)}px`,
              top: `${laneCenterY(laneIndex)}px`,
              height: `${laneHeight * 0.3}px`,
              outlineWidth: isSelected ? `${OVERVIEW_OUTLINE_WIDTH / scale}px` : undefined,
              '--timeline-graph-lane-color': lane.color || undefined
            }}
          />
        )
      }))}
    </div>
  )
}

/**
 * TimelineGraphStage — the label gutter, the world surface, and the ruler.
 *
 * The gutter tracks lanes vertically by translating with the camera while its
 * rows only grow with zoom, so labels stay legible at any scale. The ruler picks
 * a 1/2/5 step from the visible value span instead of a fixed tick count.
 *
 * Receives canvas:{ camera, viewport, height, ... } from CanvasDisplay.
 */
export const TimelineGraphStage = ({
  canvas = {},
  lanes = [],
  edges = [],
  worldWidth = WORLD_WIDTH,
  laneHeight = LANE_HEIGHT,
  selectedId,
  activeLaneId,
  hoveredId,
  draggingId,
  dragMode,
  connectId,
  linkSourceId,
  linkMode,
  toWorldX = () => 0,
  valueAt = () => 0,
  laneCenterY = () => 0,
  hover = () => {},
  startDrag = () => {},
  selectLane = () => {}
}) => {
  const {
    camera = { x: 0, y: 0, zoom: 1 },
    viewport = { width: 0, height: 0 },
    height = '26rem'
  } = canvas
  const worldHeight = Math.max(lanes.length, 1) * laneHeight
  const activeIndex = lanes.findIndex((lane) => lane.id === activeLaneId)
  const { forks, merges, link } = geometry(lanes, edges, toWorldX, laneCenterY, {
    sourceId: linkSourceId,
    targetId: connectId,
    mode: linkMode
  })

  const firstVisible = valueAt(camera.x)
  const lastVisible = valueAt(camera.x + viewport.width / camera.zoom)
  const step = niceStep((lastVisible - firstVisible) / TICK_TARGET)
  const firstTick = Math.ceil(firstVisible / step) * step
  const tickCount = clamp(Math.floor((lastVisible - firstTick) / step) + 1, 0, TICK_LIMIT)
  const ticks = Array.from({ length: tickCount }, (_, index) => {
    const value = firstTick + index * step
    return { value, position: (toWorldX(value) - camera.x) * camera.zoom }
  })

  return (
    <div className="timeline-graph__stage">
      <div className="timeline-graph__gutter" style={{ height }}>
        <div
          className="timeline-graph__gutter-inner"
          style={{ transform: `translateY(${-camera.y * camera.zoom}px)` }}
        >
          {lanes.map((lane) => (
            <button
              key={lane.id}
              type="button"
              className={[
                'timeline-graph__label',
                lane.main ? 'timeline-graph__label--main' : '',
                lane.id === activeLaneId ? 'timeline-graph__label--active' : ''
              ].filter(Boolean).join(' ')}
              style={{ height: `${laneHeight * camera.zoom}px` }}
              aria-pressed={lane.id === activeLaneId}
              title={lane.label}
              onClick={() => selectLane(lane.id)}
            >
              {lane.label}
            </button>
          ))}
        </div>
      </div>
      <div
        className={[
          'timeline-graph__lanes',
          draggingId && dragMode === 'move' ? 'timeline-graph__lanes--moving' : '',
          draggingId && (dragMode === 'start' || dragMode === 'end') ? 'timeline-graph__lanes--resizing' : '',
          linkSourceId ? 'timeline-graph__lanes--linking' : ''
        ].filter(Boolean).join(' ')}
      >
        <CanvasSurface canvas={canvas}>
          {lanes.map((lane, laneIndex) => (
            <div
              key={`band-${lane.id}`}
              className={[
                'timeline-graph__band',
                lane.main ? 'timeline-graph__band--main' : ''
              ].filter(Boolean).join(' ')}
              style={{
                top: `${laneIndex * laneHeight}px`,
                width: `${worldWidth}px`,
                height: `${laneHeight}px`
              }}
            />
          ))}
          {activeIndex >= 0 && (
            <div
              className="timeline-graph__active"
              style={{
                top: `${activeIndex * laneHeight}px`,
                width: `${worldWidth}px`,
                height: `${laneHeight}px`,
                borderWidth: `${FRAME_WIDTH / camera.zoom}px`
              }}
            />
          )}
          <svg
            className="timeline-graph__edges"
            width={worldWidth}
            height={worldHeight}
            viewBox={`0 0 ${worldWidth} ${worldHeight}`}
          >
            {forks.map((fork) => (
              <path
                key={fork.id}
                className="timeline-graph__edge timeline-graph__edge--fork"
                d={fork.path}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {merges.map((merge) => (
              <path
                key={merge.id}
                className="timeline-graph__edge timeline-graph__edge--merge"
                d={merge.path}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {link && (
              <path
                className="timeline-graph__edge timeline-graph__edge--link"
                d={link}
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>
          {lanes.map((lane, laneIndex) => (
            <div
              key={`axis-${lane.id}`}
              className={[
                'timeline-graph__axis',
                lane.main ? 'timeline-graph__axis--main' : ''
              ].filter(Boolean).join(' ')}
              style={{
                top: `${laneCenterY(laneIndex)}px`,
                width: `${worldWidth}px`,
                '--timeline-graph-lane-color': lane.color || undefined
              }}
            />
          ))}
          {lanes.flatMap((lane, laneIndex) => (lane.points || []).map((point) => {
            const isSelected = selectedId === point.id
            const isHovered = hoveredId === point.id
            const isDragging = draggingId === point.id
            const isConnect = connectId === point.id
            const isLinkSource = linkSourceId === point.id
            const className = [
              'timeline-graph__point',
              lane.main ? 'timeline-graph__point--main' : '',
              isSelected ? 'timeline-graph__point--selected' : '',
              isHovered ? 'timeline-graph__point--hovered' : '',
              isDragging ? 'timeline-graph__point--dragging' : '',
              isConnect ? 'timeline-graph__point--connect' : '',
              isLinkSource ? 'timeline-graph__point--link-source' : ''
            ].filter(Boolean).join(' ')
            const left = toWorldX(Number(point.start))
            const right = toWorldX(Number(point.end))

            return (
              <button
                key={point.id}
                type="button"
                data-point-id={point.id}
                className={className}
                style={{
                  left: `${left}px`,
                  width: `${Math.max(right - left, 0)}px`,
                  top: `${laneCenterY(laneIndex)}px`,
                  '--timeline-graph-lane-color': lane.color || undefined
                }}
                aria-pressed={isSelected}
                aria-label={point.label || `Point from ${point.start} to ${point.end}`}
                title={point.label}
                onPointerDown={(event) => startDrag(point.id, event)}
                onPointerEnter={() => hover(point.id)}
                onPointerLeave={() => hover(null)}
              >
                <span
                  className={[
                    'timeline-graph__point-handle',
                    'timeline-graph__point-handle--start',
                    isLinkSource && linkMode === 'start' ? 'timeline-graph__point-handle--armed' : ''
                  ].filter(Boolean).join(' ')}
                  data-handle="start"
                />
                <span
                  className={[
                    'timeline-graph__point-handle',
                    'timeline-graph__point-handle--end',
                    isLinkSource && linkMode === 'end' ? 'timeline-graph__point-handle--armed' : ''
                  ].filter(Boolean).join(' ')}
                  data-handle="end"
                />
              </button>
            )
          }))}
        </CanvasSurface>
        <div className="timeline-graph__ruler">
          {ticks.map((tick) => (
            <div
              key={tick.value}
              className="timeline-graph__tick"
              style={{ left: `${tick.position}px` }}
            >
              <span className="timeline-graph__tick-mark" />
              <span className="timeline-graph__tick-label">{formatTick(tick.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * TimelineGraphDisplay — pure display controller.
 *
 * Mounts a Canvas over a fixed world: one horizontal lane per plot line, an SVG
 * layer of fork and merge edges behind the lanes, and absolutely positioned span
 * bars, all in world px. A minimap always shows the whole picture. Camera, hover,
 * drag, and connect state are supplied by withTimelineGraph.
 *
 * Props:
 *   lanes       {Array}    — [{ id, label, main, color, branchFrom: { laneId, pointId },
 *                            points: [{ id, start, end, label }] }]
 *                            color paints that lane's axis line, its points, and
 *                            its minimap points; omit it to keep the stylesheet
 *                            defaults. Points fade when unselected rather than
 *                            changing hue, so the lane colour always reads
 *   edges       {Array}    — [{ id, sourcePointId, targetPointId }] merge edges
 *   min/max     {number}   — data value bounds mapped across the world width
 *   worldWidth  {number}   — world px the value span is stretched across
 *   laneHeight  {number}   — world px per lane
 *   height      {string}   — CSS height of the canvas viewport
 *   selectedId  {string}   — currently selected point id
 *   activeLaneId {string}  — lane framed as the active one
 *   hoveredId   {string}   — currently hovered point id
 *   draggingId  {string}   — currently dragged point id
 *   dragMode    {string}   — 'move' | 'start' | 'end' for the active drag
 *   connectId   {string}   — point the current drag or link would merge into
 *   linkSourceId {string}  — point whose node was clicked to start a link
 *   linkMode    {string}   — 'start' | 'end' node the link is anchored to
 *   toWorldX    {function} — maps a value to a world x
 *   valueAt     {function} — maps a world x back to a value
 *   laneCenterY {function} — maps a lane index to its world center y
 *   select      {function} — select(id)
 *   selectLane  {function} — selectLane(laneId) from a click on the lane label
 *   hover       {function} — hover(id|null)
 *   startDrag   {function} — startDrag(id, event)
 *   canvasClick {function} — click on a lane axis line: adds a point
 *   cameraChange {function} — mirrors the live camera for drag math
 */
export const TimelineGraphDisplay = ({
  lanes = [],
  edges = [],
  min = 0,
  max = 1000,
  worldWidth = WORLD_WIDTH,
  laneHeight = LANE_HEIGHT,
  height = '26rem',
  selectedId,
  activeLaneId,
  hoveredId,
  draggingId,
  dragMode,
  connectId,
  linkSourceId,
  linkMode,
  toWorldX = () => 0,
  valueAt = () => 0,
  laneCenterY = () => 0,
  select = () => {},
  selectLane = () => {},
  hover = () => {},
  startDrag = () => {},
  canvasClick = () => {},
  cameraChange = () => {},
  children
}) => {
  const worldHeight = Math.max(lanes.length, 1) * laneHeight

  const timelineGraph = {
    lanes,
    edges,
    min,
    max,
    selectedId,
    activeLaneId,
    hoveredId,
    draggingId,
    dragMode,
    connectId,
    linkSourceId,
    linkMode,
    toWorldX,
    valueAt,
    laneCenterY,
    select,
    selectLane,
    hover,
    startDrag
  }

  const enhanced = Children.map(children, (child) => {
    if (!isValidElement(child)) return child
    return cloneElement(child, { timelineGraph })
  })

  return (
    <div className="timeline-graph">
      <Canvas
        world={{ width: worldWidth, height: worldHeight }}
        height={height}
        click={canvasClick}
        change={cameraChange}
      >
        <TimelineGraphStage
          lanes={lanes}
          edges={edges}
          worldWidth={worldWidth}
          laneHeight={laneHeight}
          selectedId={selectedId}
          activeLaneId={activeLaneId}
          hoveredId={hoveredId}
          draggingId={draggingId}
          dragMode={dragMode}
          connectId={connectId}
          linkSourceId={linkSourceId}
          linkMode={linkMode}
          toWorldX={toWorldX}
          valueAt={valueAt}
          laneCenterY={laneCenterY}
          hover={hover}
          startDrag={startDrag}
          selectLane={selectLane}
        />
        <CanvasControls />
        <CanvasMinimap>
          <TimelineGraphOverview
            lanes={lanes}
            worldWidth={worldWidth}
            laneHeight={laneHeight}
            toWorldX={toWorldX}
            laneCenterY={laneCenterY}
            selectedId={selectedId}
            activeLaneId={activeLaneId}
          />
        </CanvasMinimap>
      </Canvas>
      {enhanced}
    </div>
  )
}

export const withTimelineGraph = (WrappedComponent) => {
  const TimelineGraphState = ({
    lanes = [],
    edges = [],
    min = 0,
    max = 1000,
    worldWidth = WORLD_WIDTH,
    laneHeight = LANE_HEIGHT,
    selectedId,
    select = () => {},
    move = () => {},
    connect = () => {},
    addPoint = () => {},
    ...props
  }) => {
    const cameraRef = useRef({ x: 0, y: 0, zoom: 1 })
    const moveRef = useRef(move)
    const connectRef = useRef(connect)
    const addPointRef = useRef(addPoint)
    const [hoveredId, setHoveredId] = useState(null)
    const [pending, setPending] = useState(null)
    const [draggingId, setDraggingId] = useState(null)
    const [dragSpan, setDragSpan] = useState(null)
    const [connectId, setConnectId] = useState(null)
    const [link, setLink] = useState(null)
    const linkRef = useRef(link)

    moveRef.current = move
    connectRef.current = connect
    addPointRef.current = addPoint
    linkRef.current = link

    const span = max - min || 1

    const toWorldX = (value) => ((Number(value) - min) / span) * worldWidth
    const valueAt = (worldX) => min + (worldX / worldWidth) * span
    const laneCenterY = (index) => (index + 0.5) * laneHeight

    const deltaFromClientX = (clientX, startX) => {
      const zoom = cameraRef.current.zoom || 1
      const worldDelta = (clientX - startX) / zoom
      return (worldDelta / worldWidth) * span
    }

    const spanFromClientX = (clientX) => {
      const delta = deltaFromClientX(clientX, pending.startX)
      if (pending.mode === 'start') {
        return {
          start: clamp(pending.startStart + delta, min, pending.startEnd),
          end: pending.startEnd
        }
      }
      if (pending.mode === 'end') {
        return {
          start: pending.startStart,
          end: clamp(pending.startEnd + delta, pending.startStart, max)
        }
      }
      const width = pending.startEnd - pending.startStart
      const start = clamp(pending.startStart + delta, min, max - width)
      return { start, end: start + width }
    }

    const mergeable = (sourceId, targetId) => {
      if (!sourceId || !targetId || sourceId === targetId) return false
      const sourceLane = laneOfPoint(lanes, sourceId)
      const targetLane = laneOfPoint(lanes, targetId)
      return Boolean(sourceLane && targetLane && sourceLane.id !== targetLane.id)
    }

    const nodeClick = (id, mode) => {
      const current = linkRef.current
      if (!current) {
        setLink({ pointId: id, mode })
        return
      }
      setLink(null)
      if (!mergeable(current.pointId, id)) return
      connectRef.current(current.pointId, id)
    }

    const startDrag = (id, event) => {
      event.preventDefault()
      event.stopPropagation()
      select(id)
      const point = allPoints(lanes).find((candidate) => candidate.id === id)
      setPending({
        id,
        startX: event.clientX,
        startStart: Number(point?.start),
        startEnd: Number(point?.end),
        mode: event.target?.dataset?.handle || 'move'
      })
    }

    useEffect(() => {
      if (!pending) return undefined

      let promoted = false
      const sourceLane = laneOfPoint(lanes, pending.id)

      const connectTarget = (clientX, clientY) => {
        const element = document.elementFromPoint(clientX, clientY)
        const target = element && element.closest ? element.closest('[data-point-id]') : null
        const id = target ? target.getAttribute('data-point-id') : null
        if (!id || id === pending.id) return null
        const targetLane = laneOfPoint(lanes, id)
        if (!targetLane || targetLane.id === sourceLane?.id) return null
        return id
      }

      const handleMove = (event) => {
        if (!promoted) {
          if (Math.abs(event.clientX - pending.startX) <= DRAG_THRESHOLD) return
          promoted = true
          setDraggingId(pending.id)
          setLink(null)
        }
        setDragSpan(spanFromClientX(event.clientX))
        setConnectId(connectTarget(event.clientX, event.clientY))
      }

      const handleUp = (event) => {
        const next = spanFromClientX(event.clientX)
        const targetId = promoted ? connectTarget(event.clientX, event.clientY) : null
        setPending(null)
        setDraggingId(null)
        setDragSpan(null)
        setConnectId(null)
        if (!promoted) {
          if (pending.mode === 'move') {
            setLink(null)
            return
          }
          nodeClick(pending.id, pending.mode)
          return
        }
        if (targetId) {
          connectRef.current(pending.id, targetId)
          return
        }
        if (next.start === pending.startStart && next.end === pending.startEnd) return
        moveRef.current(pending.id, next.start, next.end)
      }

      window.addEventListener('pointermove', handleMove)
      window.addEventListener('pointerup', handleUp)
      return () => {
        window.removeEventListener('pointermove', handleMove)
        window.removeEventListener('pointerup', handleUp)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pending, lanes, min, max, worldWidth])

    useEffect(() => {
      if (!link) return undefined

      const handleKey = (event) => {
        if (event.key === 'Escape') setLink(null)
      }

      window.addEventListener('keydown', handleKey)
      return () => window.removeEventListener('keydown', handleKey)
    }, [link])

    useEffect(() => {
      if (!link) return
      if (allPoints(lanes).some((point) => point.id === link.pointId)) return
      setLink(null)
    }, [link, lanes])

    const canvasClick = (point) => {
      if (linkRef.current) {
        setLink(null)
        return
      }
      if (!lanes.length) return
      const laneIndex = clamp(Math.round(point.y / laneHeight - 0.5), 0, lanes.length - 1)
      if (Math.abs(point.y - laneCenterY(laneIndex)) > AXIS_HIT) return
      addPointRef.current(lanes[laneIndex].id, clamp(valueAt(point.x), min, max))
    }

    const cameraChange = (camera) => {
      cameraRef.current = camera
    }

    const linkTargetId = link && mergeable(link.pointId, hoveredId) ? hoveredId : null

    const displayLanes = draggingId == null || dragSpan == null
      ? lanes
      : lanes.map((lane) => ({
        ...lane,
        points: (lane.points || []).map((point) => (
          point.id === draggingId ? { ...point, ...dragSpan } : point
        ))
      }))

    return (
      <WrappedComponent
        lanes={displayLanes}
        edges={edges}
        min={min}
        max={max}
        worldWidth={worldWidth}
        laneHeight={laneHeight}
        selectedId={selectedId}
        hoveredId={hoveredId}
        draggingId={draggingId}
        dragMode={pending?.mode || null}
        connectId={connectId || linkTargetId}
        linkSourceId={link?.pointId || null}
        linkMode={link?.mode || null}
        toWorldX={toWorldX}
        valueAt={valueAt}
        laneCenterY={laneCenterY}
        select={select}
        hover={setHoveredId}
        startDrag={startDrag}
        canvasClick={canvasClick}
        cameraChange={cameraChange}
        move={move}
        connect={connect}
        addPoint={addPoint}
        {...props}
      />
    )
  }

  return TimelineGraphState
}

export default withTimelineGraph(TimelineGraphDisplay)
