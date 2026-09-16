import { useEffect, useRef, useState, Children, cloneElement, isValidElement } from 'react'
import './styles.css'

const scaleValue = (value, min, max) => {
  if (max === min) return 50
  return ((value - min) / (max - min)) * 100
}

const formatTick = (value) => {
  if (!Number.isFinite(value)) return ''
  if (Number.isInteger(value)) return String(value)
  return String(Math.round(value * 100) / 100)
}

const DRAG_THRESHOLD = 3

const clamp = (value, low, high) => Math.min(high, Math.max(low, value))

/**
 * TimelineDisplay — pure display controller.
 *
 * Renders a horizontal track, axis ticks, and absolutely positioned span bars.
 * Scale, hover, and drag state are supplied by withTimeline.
 *
 * Props:
 *   points     {Array<{ id, start, end, label }>} — spans along the axis
 *   min/max    {number}              — axis bounds
 *   tickCount  {number}              — number of labeled ticks
 *   selectedId {string}              — currently selected point id
 *   hoveredId  {string}              — currently hovered point id
 *   draggingId {string}              — currently dragged point id
 *   scale      {function}            — maps a value to a 0–100 percentage
 *   select     {function}            — select(id)
 *   hover      {function}            — hover(id|null)
 *   startDrag  {function}            — startDrag(id, event)
 *   trackRef   {ref}                 — attached to the rail used for drag math
 */
export const TimelineDisplay = ({
  points = [],
  min = 0,
  max = 1000,
  tickCount = 5,
  selectedId,
  hoveredId,
  draggingId,
  scale = (value) => scaleValue(value, min, max),
  select = () => {},
  hover = () => {},
  startDrag = () => {},
  trackRef,
  children
}) => {
  const span = max - min
  const ticks = Array.from({ length: Math.max(tickCount, 1) }, (_, index) => {
    const ratio = tickCount <= 1 ? 0 : index / (tickCount - 1)
    const value = min + ratio * span
    return { value, position: scale(value) }
  })

  const timeline = {
    points,
    min,
    max,
    selectedId,
    hoveredId,
    draggingId,
    scale,
    select,
    hover,
    startDrag
  }

  const enhanced = Children.map(children, (child) => {
    if (!isValidElement(child)) return child
    return cloneElement(child, { timeline })
  })

  return (
    <div className="timeline">
      <div className="timeline__track">
        <div className="timeline__rail" ref={trackRef}>
          <div className="timeline__axis" />
          {ticks.map((tick, index) => (
            <div
              key={`${tick.position}-${index}`}
              className="timeline__tick"
              style={{ left: `${tick.position}%` }}
            >
              <span className="timeline__tick-mark" />
              <span className="timeline__tick-label">{formatTick(tick.value)}</span>
            </div>
          ))}
          {points.map((point) => {
            const isSelected = selectedId === point.id
            const isHovered = hoveredId === point.id
            const isDragging = draggingId === point.id
            const className = [
              'timeline__point',
              isSelected ? 'timeline__point--selected' : '',
              isHovered ? 'timeline__point--hovered' : '',
              isDragging ? 'timeline__point--dragging' : ''
            ].filter(Boolean).join(' ')
            const left = scale(Number(point.start))
            const right = scale(Number(point.end))

            return (
              <button
                key={point.id}
                type="button"
                className={className}
                style={{ left: `${left}%`, width: `${Math.max(right - left, 0)}%` }}
                aria-pressed={isSelected}
                aria-label={point.label || `Point from ${point.start} to ${point.end}`}
                onPointerDown={(event) => startDrag(point.id, event)}
                onPointerEnter={() => hover(point.id)}
                onPointerLeave={() => hover(null)}
              >
                <span
                  className="timeline__point-handle timeline__point-handle--start"
                  data-handle="start"
                />
                <span
                  className="timeline__point-handle timeline__point-handle--end"
                  data-handle="end"
                />
              </button>
            )
          })}
        </div>
      </div>
      {enhanced}
    </div>
  )
}

export const withTimeline = (WrappedComponent) => {
  const TimelineState = ({
    points = [],
    min = 0,
    max = 1000,
    tickCount = 5,
    selectedId,
    select = () => {},
    move = () => {},
    ...props
  }) => {
    const trackRef = useRef(null)
    const moveRef = useRef(move)
    const [hoveredId, setHoveredId] = useState(null)
    const [pending, setPending] = useState(null)
    const [draggingId, setDraggingId] = useState(null)
    const [dragSpan, setDragSpan] = useState(null)

    moveRef.current = move

    const scale = (value) => scaleValue(Number(value), min, max)

    const deltaFromClientX = (clientX, startX) => {
      const rail = trackRef.current
      if (!rail) return 0
      const rect = rail.getBoundingClientRect()
      if (rect.width === 0) return 0
      return ((clientX - startX) / rect.width) * (max - min)
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

    const startDrag = (id, event) => {
      event.preventDefault()
      event.stopPropagation()
      select(id)
      const point = points.find((candidate) => candidate.id === id)
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

      const handleMove = (event) => {
        if (!promoted) {
          if (Math.abs(event.clientX - pending.startX) <= DRAG_THRESHOLD) return
          promoted = true
          setDraggingId(pending.id)
        }
        setDragSpan(spanFromClientX(event.clientX))
      }

      const handleUp = (event) => {
        const next = spanFromClientX(event.clientX)
        setPending(null)
        setDraggingId(null)
        setDragSpan(null)
        if (!promoted) return
        if (next.start === pending.startStart && next.end === pending.startEnd) return
        moveRef.current(pending.id, next.start, next.end)
      }

      window.addEventListener('pointermove', handleMove)
      window.addEventListener('pointerup', handleUp)
      return () => {
        window.removeEventListener('pointermove', handleMove)
        window.removeEventListener('pointerup', handleUp)
      }
    }, [pending, min, max])

    const displayPoints = draggingId == null || dragSpan == null
      ? points
      : points.map((point) => (
        point.id === draggingId ? { ...point, ...dragSpan } : point
      ))

    return (
      <WrappedComponent
        points={displayPoints}
        min={min}
        max={max}
        tickCount={tickCount}
        selectedId={selectedId}
        hoveredId={hoveredId}
        draggingId={draggingId}
        scale={scale}
        select={select}
        hover={setHoveredId}
        startDrag={startDrag}
        move={move}
        trackRef={trackRef}
        {...props}
      />
    )
  }

  return TimelineState
}

export default withTimeline(TimelineDisplay)
