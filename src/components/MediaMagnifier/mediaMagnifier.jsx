import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Button from '../Button/button'
import ColorPicker from '../ColorPicker/colorPicker'
import { DevScope } from '../DevInspector/devInspector'
import './styles.css'

const DEFAULT_ZOOM = 4
const DEFAULT_MIN_ZOOM = 1
const DEFAULT_MAX_ZOOM = 16
const DEFAULT_LENS_SIZE = 420
const LENS_GAP = 76
const CENTER_INSET = 360
const WHEEL_RATE = 0.001
const MENU_GAP = 8
const MENU_WIDTH = 220
const STORAGE_KEY = 'media-magnifier'
const DEFAULT_BORDER_COLOR = '#ffffff'

const clamp = (value, low, high) => Math.min(high, Math.max(low, value))

const readSettings = () => {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || {}
  } catch (error) {
    return {}
  }
}

const writeSettings = (settings) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    // ignore write failures (private mode, quota, etc.)
  }
}

const isTouchPointer = (event) => event.pointerType === 'touch'

const offsetLensFromPointer = (clientY, lensSize) => {
  const distance = lensSize / 2 + LENS_GAP
  if (clientY > window.innerHeight - CENTER_INSET) return { x: 0, y: -distance }
  return { x: 0, y: distance }
}

const isMenuFlipped = (left, lensSize) => left + lensSize + MENU_GAP + MENU_WIDTH > window.innerWidth

const menuLeftFor = (left, lensSize) => (
  isMenuFlipped(left, lensSize)
    ? left - MENU_WIDTH - MENU_GAP
    : left + lensSize + MENU_GAP
)

const clampToViewport = ({ left, top }, lensSize) => ({
  left: clamp(Math.round(left), 0, window.innerWidth - lensSize),
  top: clamp(Math.round(top), 0, window.innerHeight - lensSize)
})

/**
 * Maps an overlay-relative point onto the contain-fit displayed image, or
 * returns null when it lands in a letterbox dead zone.
 */
const imagePoint = (pointer, box, naturalSize) => {
  if (!pointer || !box || !naturalSize) return null

  const { width, height } = box
  const { width: naturalWidth, height: naturalHeight } = naturalSize
  if (!width || !height || !naturalWidth || !naturalHeight) return null

  const scale = Math.min(width / naturalWidth, height / naturalHeight)
  const displayWidth = naturalWidth * scale
  const displayHeight = naturalHeight * scale
  const x = pointer.x - (width - displayWidth) / 2
  const y = pointer.y - (height - displayHeight) / 2

  if (x < 0 || y < 0 || x > displayWidth || y > displayHeight) return null

  return { x, y, displayWidth, displayHeight }
}

/**
 * MediaMagnifierDisplay — pure display controller.
 *
 * Covers the parent media box with an inset overlay. While a lens object is
 * provided, renders a square lens that clips the magnified region under the
 * pointer. Pass `circle` to round it.
 *
 * Props:
 *   src        {string}   — image URL used as the lens background
 *   isActive   {boolean}  — magnify mode is on
 *   lens       {object}   — { left, top, size, image, view: { left, top, width, height } } or null
 *   overlayRef {ref}      — attached to the overlay for native wheel / pointerdown
 *   lensRef    {ref}      — attached to the lens; the drag repositions it directly
 *   menuRef    {ref}      — attached to the menu; follows the lens during a drag
 *   toggle     {function} — click action; enters or exits magnify mode
 *   move       {function} — pointermove action; tracks the cursor
 *   leave      {function} — pointerleave action; hides the lens
 *   drag       {function} — lens pointerdown action; begins a bubble drag
 *   isDragging {boolean}  — the lens bubble is being dragged
 *   isLocked   {boolean}  — the lens bubble is parked at fixed viewport coordinates
 *   circle     {boolean}  — round the lens; off by default
 */
export const MediaMagnifierDisplay = ({
  src,
  isActive = false,
  lens = null,
  overlayRef,
  lensRef,
  menuRef,
  toggle = () => {},
  move = () => {},
  leave = () => {},
  drag = () => {},
  isDragging = false,
  isLocked = false,
  circle = false,
  isMenuOpen = false,
  borderColor = DEFAULT_BORDER_COLOR,
  changePosition = () => {},
  changeColor = () => {},
  lock = () => {},
  unlock = () => {}
}) => (
  <div
    ref={overlayRef}
    className={`media-magnifier${isActive ? ' media-magnifier--active' : ''}${isLocked ? ' media-magnifier--locked' : ''}`}
    onClick={toggle}
    onPointerMove={move}
    onPointerLeave={leave}
  >
    {lens && (
      <div
        className={`media-magnifier__view${circle ? ' media-magnifier__view--circle' : ''}`}
        style={{
          left: `${lens.view.left}px`,
          top: `${lens.view.top}px`,
          width: `${lens.view.width}px`,
          height: `${lens.view.height}px`,
          borderColor
        }}
      />
    )}
    {lens && createPortal(
      <DevScope id="k9m3v1z" state={{ isLocked, isMenuOpen }}>
        <div
          ref={lensRef}
          className={`media-magnifier__lens${isDragging ? ' media-magnifier__lens--dragging' : ''}${circle ? ' media-magnifier__lens--circle' : ''}`}
          style={{
            transform: `translate3d(${lens.left}px, ${lens.top}px, 0)`,
            width: `${lens.size}px`,
            height: `${lens.size}px`,
            borderColor
          }}
          onPointerDown={drag}
          onPointerMove={(event) => event.stopPropagation()}
        >
          <img
            className="media-magnifier__lens-image"
            src={src}
            alt=""
            draggable={false}
            style={{
              width: `${lens.image.width}px`,
              height: `${lens.image.height}px`,
              transform: lens.image.transform
            }}
          />
        </div>
        {isMenuOpen && (
          <MediaMagnifierMenu
            lens={lens}
            menuRef={menuRef}
            isLocked={isLocked}
            borderColor={borderColor}
            changePosition={changePosition}
            changeColor={changeColor}
            lock={lock}
            unlock={unlock}
          />
        )}
      </DevScope>,
      document.body
    )}
  </div>
)

/**
 * MediaMagnifierMenu — pure display sub-component.
 *
 * Rendered inside the lens portal as a fixed panel against the right (or left)
 * edge of the lens bubble, top-aligned with it. Holds x/y number inputs for the
 * bubble's viewport position, a shared border-color picker, and a button that
 * parks the bubble at that position or releases it back to the pointer. Stops
 * pointer and click propagation so interactions do not reach the overlay's
 * toggle handler.
 */
const MediaMagnifierMenu = ({
  lens,
  menuRef,
  isLocked = false,
  borderColor = DEFAULT_BORDER_COLOR,
  changePosition = () => {},
  changeColor = () => {},
  lock = () => {},
  unlock = () => {}
}) => {
  const stop = (event) => event.stopPropagation()

  return (
    <div
      ref={menuRef}
      className={`media-magnifier__menu${lens.menuFlipped ? ' media-magnifier__menu--flipped' : ''}`}
      style={{ left: `${lens.menuLeft}px`, top: `${lens.top}px`, width: `${MENU_WIDTH}px` }}
      onPointerDown={stop}
      onPointerMove={stop}
      onClick={stop}
    >
      <div className="media-magnifier__menu-row">
        <label className="media-magnifier__menu-field">
          <span className="media-magnifier__menu-label">X</span>
          <input
            type="number"
            className="media-magnifier__menu-input"
            value={Math.round(lens.left)}
            onChange={(event) => changePosition('left', event.target.value)}
          />
        </label>
        <label className="media-magnifier__menu-field">
          <span className="media-magnifier__menu-label">Y</span>
          <input
            type="number"
            className="media-magnifier__menu-input"
            value={Math.round(lens.top)}
            onChange={(event) => changePosition('top', event.target.value)}
          />
        </label>
      </div>
      <div className="media-magnifier__menu-row">
        <ColorPicker value={borderColor} change={changeColor} commit={changeColor} />
        <Button variant="ghost" size="sm" onClick={isLocked ? unlock : lock}>
          {isLocked ? 'Unlock' : 'Lock'}
        </Button>
      </div>
    </div>
  )
}

const computeLens = ({ isActive, pointer, box, naturalSize, zoom, lensSize, bubble }) => {
  if (!isActive) return null

  const target = imagePoint(pointer, box, naturalSize)
  if (!target) return null

  const { x: imageX, y: imageY, displayWidth, displayHeight } = target
  const offset = offsetLensFromPointer(pointer.clientY, lensSize)
  const viewSize = lensSize / zoom
  const left = bubble ? bubble.left : pointer.clientX - lensSize / 2 + offset.x
  const padX = (box.width - displayWidth) / 2
  const padY = (box.height - displayHeight) / 2
  const viewLeft = displayWidth > viewSize
    ? clamp(imageX - viewSize / 2, 0, displayWidth - viewSize)
    : (displayWidth - viewSize) / 2
  const viewTop = displayHeight > viewSize
    ? clamp(imageY - viewSize / 2, 0, displayHeight - viewSize)
    : (displayHeight - viewSize) / 2

  return {
    left,
    top: bubble ? bubble.top : pointer.clientY - lensSize / 2 + offset.y,
    size: lensSize,
    menuFlipped: isMenuFlipped(left, lensSize),
    menuLeft: menuLeftFor(left, lensSize),
    image: {
      width: displayWidth,
      height: displayHeight,
      transform: `translate(${-(viewLeft * zoom)}px, ${-(viewTop * zoom)}px) scale(${zoom})`
    },
    view: {
      left: padX + Math.max(0, viewLeft),
      top: padY + Math.max(0, viewTop),
      width: Math.min(viewSize, displayWidth),
      height: Math.min(viewSize, displayHeight)
    }
  }
}

/**
 * withMediaMagnifier — state controller HOC.
 *
 * Owns magnify mode, zoom, pointer position, the overlay box, and the image's
 * natural size. Preloads `src` via `new Image()` so contain-fit geometry can
 * map the pointer onto the displayed pixels. Mouse and pen only; touch is
 * ignored so lightbox swipe navigation keeps working.
 *
 * Locking parks the magnified bubble at fixed viewport coordinates while the
 * pointer keeps roaming the image, so the bubble stays put and only its
 * contents change. `position` seeds that spot as `{ left, top }` in viewport
 * pixels; a stored spot from a previous session wins over it.
 *
 * @param {React.Component} WrappedComponent
 */
export const withMediaMagnifier = (WrappedComponent) => {
  const MediaMagnifierState = ({
    src,
    position = null,
    zoom: initialZoom = DEFAULT_ZOOM,
    minZoom = DEFAULT_MIN_ZOOM,
    maxZoom = DEFAULT_MAX_ZOOM,
    lensSize = DEFAULT_LENS_SIZE,
    ...props
  }) => {
    const overlayRef = useRef(null)
    const lensRef = useRef(null)
    const menuRef = useRef(null)
    const touchRef = useRef(false)
    const dragRef = useRef(null)
    const [isActive, setIsActive] = useState(false)
    const [zoom, setZoom] = useState(() => clamp(initialZoom, minZoom, maxZoom))
    const [pointer, setPointer] = useState(null)
    const [box, setBox] = useState(null)
    const [naturalSize, setNaturalSize] = useState(null)
    const [settings, setSettings] = useState(readSettings)
    const [bubble, setBubble] = useState(settings.lens ?? position)
    const [isDragging, setIsDragging] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const isLocked = bubble != null
    const borderColor = settings.color || DEFAULT_BORDER_COLOR
    const lens = computeLens({ isActive, pointer, box, naturalSize, zoom, lensSize, bubble })

    const saveSettings = (next) => {
      setSettings(next)
      writeSettings(next)
    }

    const parkBubble = (next) => {
      setBubble(next)
      saveSettings({ ...settings, lens: next })
    }

    const measure = () => {
      const element = overlayRef.current
      if (!element) return null
      const rect = element.getBoundingClientRect()
      setBox((current) => (
        current && current.width === rect.width && current.height === rect.height
          ? current
          : { width: rect.width, height: rect.height }
      ))
      return rect
    }

    const updatePointer = (event) => {
      const rect = measure()
      if (!rect) return
      const next = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        clientX: event.clientX,
        clientY: event.clientY
      }
      const size = { width: rect.width, height: rect.height }
      // A parked bubble must survive the trip across the letterbox dead zones
      // to reach it, so out-of-image points are ignored rather than tracked.
      if (isLocked && naturalSize && !imagePoint(next, size, naturalSize)) return
      setPointer(next)
    }

    const toggle = (event) => {
      if (touchRef.current || isTouchPointer(event)) return
      if (event.shiftKey) {
        if (isMenuOpen) {
          setIsMenuOpen(false)
          return
        }
        updatePointer(event)
        setIsActive(true)
        setIsMenuOpen(true)
        return
      }
      if (isActive) {
        setIsActive(false)
        setPointer(null)
        setIsMenuOpen(false)
        return
      }
      updatePointer(event)
      setIsActive(true)
    }

    const move = (event) => {
      if (isTouchPointer(event) || isDragging) return
      if (isMenuOpen && !isLocked) return
      updatePointer(event)
    }

    const leave = () => {
      if (isDragging || isLocked || isMenuOpen) return
      setPointer(null)
    }

    const changePosition = (axis, value) => {
      const base = bubble || (lens ? { left: lens.left, top: lens.top } : { left: 0, top: 0 })
      parkBubble(clampToViewport({ ...base, [axis]: Number(value) || 0 }, lensSize))
    }

    const changeColor = (hex) => {
      saveSettings({ ...settings, color: hex })
    }

    const lock = () => {
      if (!lens) return
      parkBubble(clampToViewport({ left: lens.left, top: lens.top }, lensSize))
    }

    const unlock = () => {
      setBubble(null)
      const next = { ...settings }
      delete next.lens
      saveSettings(next)
    }

    const drag = (event) => {
      event.stopPropagation()
      event.preventDefault()
      const rect = event.currentTarget.getBoundingClientRect()
      dragRef.current = { dx: event.clientX - rect.left, dy: event.clientY - rect.top }
      // Keeps the gesture on the lens even when the pointer outruns it.
      event.currentTarget.setPointerCapture?.(event.pointerId)
      setIsDragging(true)
    }

    useEffect(() => {
      if (!src) {
        setNaturalSize(null)
        return undefined
      }

      const image = new Image()
      const handleLoad = () => {
        setNaturalSize({ width: image.naturalWidth, height: image.naturalHeight })
      }

      image.addEventListener('load', handleLoad)
      image.src = src
      if (image.complete) handleLoad()

      return () => {
        image.removeEventListener('load', handleLoad)
      }
    }, [src])

    useEffect(() => {
      if (!isDragging) return undefined

      let frame = null
      let latest = null

      // The drag writes the DOM directly and commits to state once on release:
      // re-rendering per pointer event cannot keep up with the pointer, and the
      // only thing that changes mid-drag is the lens position.
      const paint = () => {
        frame = null
        if (!latest) return
        const lensElement = lensRef.current
        if (lensElement) {
          lensElement.style.transform = `translate3d(${latest.left}px, ${latest.top}px, 0)`
        }
        const menuElement = menuRef.current
        if (menuElement) {
          menuElement.style.left = `${menuLeftFor(latest.left, lensSize)}px`
          menuElement.style.top = `${latest.top}px`
        }
      }

      const handleMove = (event) => {
        const grab = dragRef.current
        if (!grab) return
        latest = clampToViewport(
          { left: event.clientX - grab.dx, top: event.clientY - grab.dy },
          lensSize
        )
        if (frame == null) frame = window.requestAnimationFrame(paint)
      }
      const handleUp = () => {
        if (frame != null) window.cancelAnimationFrame(frame)
        frame = null
        dragRef.current = null
        setIsDragging(false)
        if (!latest) return
        setBubble(latest)
        saveSettings({ ...settings, lens: latest })
      }

      window.addEventListener('pointermove', handleMove)
      window.addEventListener('pointerup', handleUp)
      return () => {
        if (frame != null) window.cancelAnimationFrame(frame)
        window.removeEventListener('pointermove', handleMove)
        window.removeEventListener('pointerup', handleUp)
      }
    }, [isDragging, lensSize])

    useEffect(() => {
      const element = overlayRef.current
      if (!element) return undefined

      const handlePointerDown = (event) => {
        touchRef.current = isTouchPointer(event)
      }

      element.addEventListener('pointerdown', handlePointerDown)
      return () => element.removeEventListener('pointerdown', handlePointerDown)
    }, [])

    useEffect(() => {
      if (!isActive) return undefined
      const element = overlayRef.current
      if (!element) return undefined

      const handleWheel = (event) => {
        event.preventDefault()
        event.stopPropagation()
        if (!event.deltaY) return
        setZoom((current) => clamp(current * Math.exp(-event.deltaY * WHEEL_RATE), minZoom, maxZoom))
      }

      element.addEventListener('wheel', handleWheel, { passive: false })
      return () => element.removeEventListener('wheel', handleWheel)
    }, [isActive, minZoom, maxZoom])

    useEffect(() => {
      if (!isActive) return undefined

      const handleKeyDown = (event) => {
        if (event.key !== 'Escape') return
        event.stopPropagation()
        if (isMenuOpen) {
          setIsMenuOpen(false)
          return
        }
        setIsActive(false)
        setPointer(null)
      }

      window.addEventListener('keydown', handleKeyDown, true)
      return () => window.removeEventListener('keydown', handleKeyDown, true)
    }, [isActive, isMenuOpen])

    return (
      <WrappedComponent
        src={src}
        isActive={isActive}
        lens={lens}
        overlayRef={overlayRef}
        lensRef={lensRef}
        menuRef={menuRef}
        toggle={toggle}
        move={move}
        leave={leave}
        drag={drag}
        isDragging={isDragging}
        isLocked={isLocked}
        isMenuOpen={isMenuOpen}
        borderColor={borderColor}
        changePosition={changePosition}
        changeColor={changeColor}
        lock={lock}
        unlock={unlock}
        {...props}
      />
    )
  }

  MediaMagnifierState.displayName = `withMediaMagnifier(${WrappedComponent.displayName ?? WrappedComponent.name ?? 'Component'})`

  return MediaMagnifierState
}

export default withMediaMagnifier(MediaMagnifierDisplay)
