import { useEffect, useRef, useState, Children, cloneElement, isValidElement } from 'react'
import './styles.css'

const DRAG_THRESHOLD = 3
const WHEEL_RATE = 0.001
const ZOOM_STEP = 1.25

const clamp = (value, low, high) => Math.min(high, Math.max(low, value))

const axis = (value, visible, extent) => (
  visible >= extent ? (extent - visible) / 2 : clamp(value, 0, extent - visible)
)

const fitCamera = (world, viewport, minZoom, maxZoom) => {
  const zoom = clamp(
    Math.min(viewport.width / world.width, viewport.height / world.height),
    minZoom,
    maxZoom
  )
  return {
    zoom,
    x: (world.width - viewport.width / zoom) / 2,
    y: (world.height - viewport.height / zoom) / 2
  }
}

const useMeasure = () => {
  const ref = useRef(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element) return undefined
    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect
      if (!box) return
      setSize({ width: box.width, height: box.height })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return [ref, size]
}

/**
 * CanvasDisplay — pure display controller.
 *
 * Owns nothing but the positioning context: every slot is a child that receives
 * the injected `canvas` namespace, so a consumer decides where the surface, the
 * minimap, and the controls live.
 *
 * World coordinates are plain pixels at zoom 1. The camera holds the world point
 * sitting at the top-left of the viewport, so screen = (world - camera) * zoom.
 *
 * Props:
 *   camera      {object}   — { x, y, zoom }
 *   world       {object}   — { width, height } in world px
 *   viewport    {object}   — { width, height } measured viewport size in px
 *   height      {string}   — CSS height of the viewport
 *   panning     {boolean}  — a pan gesture is in progress
 *   viewportRef {ref}      — attached to the viewport by CanvasSurface
 *   pointerDown {function} — attached as onPointerDown by CanvasSurface
 *   toWorld     {function} — toWorld({ x, y }) client px to world px
 *   toScreen    {function} — toScreen({ x, y }) world px to client px
 *   panBy       {function} — panBy(dx, dy) moves the camera by a world delta
 *   zoomAt      {function} — zoomAt(zoom, client) keeps the client point fixed
 *   centerOn    {function} — centerOn({ x, y }) centers a world point
 *   fit         {function} — zooms so the whole world is visible
 *   reset       {function} — zoom 1 at the world origin
 */
export const CanvasDisplay = ({
  camera = { x: 0, y: 0, zoom: 1 },
  world = { width: 0, height: 0 },
  viewport = { width: 0, height: 0 },
  height = '26rem',
  panning = false,
  viewportRef,
  pointerDown = () => {},
  toWorld = () => ({ x: 0, y: 0 }),
  toScreen = () => ({ x: 0, y: 0 }),
  panBy = () => {},
  zoomAt = () => {},
  centerOn = () => {},
  fit = () => {},
  reset = () => {},
  children
}) => {
  const canvas = {
    camera,
    world,
    viewport,
    height,
    panning,
    viewportRef,
    pointerDown,
    toWorld,
    toScreen,
    panBy,
    zoomAt,
    centerOn,
    fit,
    reset
  }

  const enhanced = Children.map(children, (child) => {
    if (!isValidElement(child)) return child
    return cloneElement(child, { canvas })
  })

  return (
    <div className="canvas">
      {enhanced}
    </div>
  )
}

/**
 * CanvasSurface — the clipping viewport and the transformed world layer.
 *
 * Children are positioned absolutely in world px; the transform does the rest.
 * Content that owns its own drag gesture stops propagation on pointerdown to
 * opt out of panning.
 *
 * Receives canvas:{ camera, world, height, panning, viewportRef, pointerDown }.
 */
export const CanvasSurface = ({ canvas = {}, children }) => {
  const {
    camera = { x: 0, y: 0, zoom: 1 },
    world = { width: 0, height: 0 },
    height = '26rem',
    panning = false,
    viewportRef,
    pointerDown = () => {}
  } = canvas

  return (
    <div
      className={[
        'canvas__viewport',
        panning ? 'canvas__viewport--panning' : ''
      ].filter(Boolean).join(' ')}
      ref={viewportRef}
      style={{ height }}
      onPointerDown={pointerDown}
    >
      <div
        className="canvas__world"
        style={{
          width: `${world.width}px`,
          height: `${world.height}px`,
          transform: `translate(${-camera.x * camera.zoom}px, ${-camera.y * camera.zoom}px) scale(${camera.zoom})`,
          transformOrigin: '0 0'
        }}
      >
        {children}
      </div>
    </div>
  )
}

/**
 * CanvasMinimap — a fit-scaled box showing the whole world at once.
 *
 * Children use the same world coordinates as CanvasSurface, so an overview is
 * the same layout math at a smaller scale. A rectangle marks the camera; press
 * anywhere to center it and drag to keep panning.
 *
 * Receives canvas:{ camera, world, viewport, centerOn } and injects
 * minimap:{ scale } into its children, so an overview can divide by the scale
 * to keep an outline or a border a constant thickness on screen.
 */
export const CanvasMinimap = ({ canvas = {}, height = '7rem', children }) => {
  const {
    camera = { x: 0, y: 0, zoom: 1 },
    world = { width: 0, height: 0 },
    viewport = { width: 0, height: 0 },
    centerOn = () => {}
  } = canvas
  const [boxRef, box] = useMeasure()
  const [dragging, setDragging] = useState(false)
  const centerRef = useRef(centerOn)

  centerRef.current = centerOn

  const scale = box.width && world.width && world.height
    ? Math.min(box.width / world.width, box.height / world.height)
    : 0

  const pointFrom = (event) => {
    const element = boxRef.current
    if (!element || !scale) return null
    const rect = element.getBoundingClientRect()
    return {
      x: (event.clientX - rect.left) / scale,
      y: (event.clientY - rect.top) / scale
    }
  }

  const handlePointerDown = (event) => {
    const point = pointFrom(event)
    if (!point) return
    event.preventDefault()
    centerRef.current(point)
    setDragging(true)
  }

  useEffect(() => {
    if (!dragging) return undefined

    const handleMove = (event) => {
      const element = boxRef.current
      if (!element || !scale) return
      const rect = element.getBoundingClientRect()
      centerRef.current({
        x: (event.clientX - rect.left) / scale,
        y: (event.clientY - rect.top) / scale
      })
    }

    const handleUp = () => setDragging(false)

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [dragging, scale, boxRef])

  const enhanced = Children.map(children, (child) => {
    if (!isValidElement(child)) return child
    return cloneElement(child, { minimap: { scale } })
  })

  return (
    <div
      className={[
        'canvas__minimap',
        dragging ? 'canvas__minimap--dragging' : ''
      ].filter(Boolean).join(' ')}
      ref={boxRef}
      style={{ height }}
      onPointerDown={handlePointerDown}
    >
      <div
        className="canvas__minimap-world"
        style={{
          width: `${world.width}px`,
          height: `${world.height}px`,
          transform: `scale(${scale})`,
          transformOrigin: '0 0'
        }}
      >
        {enhanced}
      </div>
      {scale > 0 && (
        <div
          className="canvas__minimap-view"
          style={{
            left: `${camera.x * scale}px`,
            top: `${camera.y * scale}px`,
            width: `${(viewport.width / camera.zoom) * scale}px`,
            height: `${(viewport.height / camera.zoom) * scale}px`
          }}
        />
      )}
    </div>
  )
}

/**
 * CanvasControls — zoom out, current zoom, zoom in, and fit.
 *
 * Receives canvas:{ camera, zoomAt, fit }.
 */
export const CanvasControls = ({ canvas = {} }) => {
  const { camera = { zoom: 1 }, zoomAt = () => {}, fit = () => {} } = canvas

  return (
    <div className="canvas__controls">
      <button
        type="button"
        className="canvas__control"
        onClick={() => zoomAt(camera.zoom / ZOOM_STEP)}
        aria-label="Zoom out"
      >
        −
      </button>
      <span className="canvas__zoom">{Math.round(camera.zoom * 100)}%</span>
      <button
        type="button"
        className="canvas__control"
        onClick={() => zoomAt(camera.zoom * ZOOM_STEP)}
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        type="button"
        className="canvas__control canvas__control--fit"
        onClick={fit}
      >
        Fit
      </button>
    </div>
  )
}

/**
 * withCanvas — camera state controller HOC.
 *
 * Props:
 *   world    {object}   — { width, height } bounded world size in px at zoom 1
 *   height   {string}   — CSS height of the viewport
 *   minZoom  {number}   — smallest allowed zoom
 *   maxZoom  {number}   — largest allowed zoom
 *   autoFit  {boolean}  — fit the world the first time the viewport is measured
 *   click    {function} — click(worldPoint, event) for a press that never panned
 *   change   {function} — change(camera) on every camera change, for consumers
 *                         that need the live zoom without another render
 */
export const withCanvas = (WrappedComponent) => {
  const CanvasState = ({
    world = { width: 1000, height: 1000 },
    height = '26rem',
    minZoom = 0.05,
    maxZoom = 8,
    autoFit = true,
    click = () => {},
    change = () => {},
    ...props
  }) => {
    const [viewportRef, viewport] = useMeasure()
    const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 })
    const [panning, setPanning] = useState(false)
    const [pending, setPending] = useState(null)
    const cameraRef = useRef(camera)
    const clickRef = useRef(click)
    const changeRef = useRef(change)
    const zoomRef = useRef(null)
    const fittedRef = useRef(false)

    cameraRef.current = camera
    clickRef.current = click
    changeRef.current = change

    const limits = (next) => {
      const zoom = clamp(next.zoom, minZoom, maxZoom)
      if (!viewport.width || !viewport.height) return { ...next, zoom }
      return {
        zoom,
        x: axis(next.x, viewport.width / zoom, world.width),
        y: axis(next.y, viewport.height / zoom, world.height)
      }
    }

    const toWorld = ({ x, y }) => {
      const element = viewportRef.current
      const live = cameraRef.current
      if (!element) return { x: live.x, y: live.y }
      const rect = element.getBoundingClientRect()
      return {
        x: live.x + (x - rect.left) / live.zoom,
        y: live.y + (y - rect.top) / live.zoom
      }
    }

    const toScreen = ({ x, y }) => {
      const element = viewportRef.current
      const live = cameraRef.current
      if (!element) return { x: 0, y: 0 }
      const rect = element.getBoundingClientRect()
      return {
        x: rect.left + (x - live.x) * live.zoom,
        y: rect.top + (y - live.y) * live.zoom
      }
    }

    const panBy = (dx, dy) => setCamera((current) => limits({
      ...current,
      x: current.x + dx,
      y: current.y + dy
    }))

    const zoomAt = (zoom, client) => setCamera((current) => {
      const element = viewportRef.current
      const next = clamp(zoom, minZoom, maxZoom)
      if (!element) return limits({ ...current, zoom: next })
      const rect = element.getBoundingClientRect()
      const offsetX = client ? client.x - rect.left : rect.width / 2
      const offsetY = client ? client.y - rect.top : rect.height / 2
      return limits({
        zoom: next,
        x: current.x + offsetX / current.zoom - offsetX / next,
        y: current.y + offsetY / current.zoom - offsetY / next
      })
    })

    zoomRef.current = zoomAt

    const centerOn = (point) => setCamera((current) => limits({
      ...current,
      x: point.x - viewport.width / current.zoom / 2,
      y: point.y - viewport.height / current.zoom / 2
    }))

    const fit = () => setCamera(() => limits(fitCamera(world, viewport, minZoom, maxZoom)))

    const reset = () => setCamera(() => limits({ x: 0, y: 0, zoom: 1 }))

    useEffect(() => {
      changeRef.current(camera)
    }, [camera])

    useEffect(() => {
      if (!viewport.width || !viewport.height) return
      if (autoFit && !fittedRef.current) {
        fittedRef.current = true
        setCamera(limits(fitCamera(world, viewport, minZoom, maxZoom)))
        return
      }
      setCamera((current) => limits(current))
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewport.width, viewport.height, world.width, world.height, minZoom, maxZoom, autoFit])

    useEffect(() => {
      const element = viewportRef.current
      if (!element) return undefined

      // React's onWheel is passive, so preventDefault only works on a native listener
      const handleWheel = (event) => {
        event.preventDefault()
        const zoom = cameraRef.current.zoom * Math.exp(-event.deltaY * WHEEL_RATE)
        zoomRef.current(zoom, { x: event.clientX, y: event.clientY })
      }

      element.addEventListener('wheel', handleWheel, { passive: false })
      return () => element.removeEventListener('wheel', handleWheel)
    }, [viewportRef, viewport.width, viewport.height])

    const pointerDown = (event) => {
      if (event.button !== 0 && event.button !== 1) return
      setPending({
        startX: event.clientX,
        startY: event.clientY,
        camera: cameraRef.current,
        promoted: event.button === 1
      })
    }

    useEffect(() => {
      if (!pending) return undefined

      let promoted = pending.promoted
      if (promoted) setPanning(true)

      const handleMove = (event) => {
        if (!promoted) {
          const moved = Math.max(
            Math.abs(event.clientX - pending.startX),
            Math.abs(event.clientY - pending.startY)
          )
          if (moved <= DRAG_THRESHOLD) return
          promoted = true
          setPanning(true)
        }
        setCamera(limits({
          ...pending.camera,
          x: pending.camera.x - (event.clientX - pending.startX) / pending.camera.zoom,
          y: pending.camera.y - (event.clientY - pending.startY) / pending.camera.zoom
        }))
      }

      const handleUp = (event) => {
        setPending(null)
        setPanning(false)
        if (promoted) return
        clickRef.current(toWorld({ x: event.clientX, y: event.clientY }), event)
      }

      window.addEventListener('pointermove', handleMove)
      window.addEventListener('pointerup', handleUp)
      return () => {
        window.removeEventListener('pointermove', handleMove)
        window.removeEventListener('pointerup', handleUp)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pending, viewport.width, viewport.height, world.width, world.height, minZoom, maxZoom])

    return (
      <WrappedComponent
        camera={camera}
        world={world}
        viewport={viewport}
        height={height}
        panning={panning}
        viewportRef={viewportRef}
        pointerDown={pointerDown}
        toWorld={toWorld}
        toScreen={toScreen}
        panBy={panBy}
        zoomAt={zoomAt}
        centerOn={centerOn}
        fit={fit}
        reset={reset}
        {...props}
      />
    )
  }

  return CanvasState
}

export default withCanvas(CanvasDisplay)
