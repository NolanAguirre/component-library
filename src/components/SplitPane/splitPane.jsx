import { Children, useEffect, useRef, useState } from 'react'
import { DevScope } from '../DevInspector/devInspector.jsx'
import './styles.css'

const KEY_STEP = 16

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const readStoredSize = (storageKey) => {
  if (!storageKey || typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (raw == null) return null
    const parsed = Number(raw)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
  } catch {
    return null
  }
}

const writeStoredSize = (storageKey, size) => {
  if (!storageKey || typeof window === 'undefined') return
  try {
    if (size == null) window.localStorage.removeItem(storageKey)
    else window.localStorage.setItem(storageKey, String(Math.round(size)))
  } catch {
    // storage unavailable
  }
}

/**
 * SplitPaneDisplay — pure display controller.
 *
 * Renders two panes separated by a draggable, keyboard-adjustable handle.
 * The first pane has a fixed size in px (width when horizontal, height when
 * vertical); the second pane flexes to fill.
 *
 * Props:
 *   direction {string}   — 'horizontal' | 'vertical' (default: 'horizontal')
 *   size      {number}   — first pane size in px
 *   minSize   {number}   — minimum first pane size
 *   maxSize   {number}   — maximum first pane size
 *   resize    {function} — (px) requests a new size
 *   reset     {function} — restores the default size (double-click)
 *   dragging  {boolean}  — whether the handle is being dragged
 *   drag      {function} — (active) reports drag start / end
 *   children            — exactly two panes
 *   className {string}
 *   devId     {string}   — instance-root DevScope id
 */
export const SplitPaneDisplay = ({
  direction = 'horizontal',
  size = 0,
  minSize = 0,
  maxSize = Infinity,
  resize = () => {},
  reset = () => {},
  dragging = false,
  drag = () => {},
  children,
  className,
  devId,
}) => {
  const dragRef = useRef(null)
  const isHorizontal = direction !== 'vertical'
  const [first, second] = Children.toArray(children)

  const limitFor = (handle) => {
    const container = handle.parentElement
    const handleSize = isHorizontal ? handle.offsetWidth : handle.offsetHeight
    const containerSize = container ? (isHorizontal ? container.clientWidth : container.clientHeight) : Infinity
    return Math.max(minSize, Math.min(maxSize, containerSize - handleSize))
  }

  const endDrag = (event) => {
    const current = dragRef.current
    if (!current) return
    event.currentTarget.releasePointerCapture?.(event.pointerId)
    document.body.style.cursor = current.bodyCursor
    document.body.style.userSelect = current.bodyUserSelect
    dragRef.current = null
    drag(false)
  }

  const handlePointerDown = (event) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    dragRef.current = {
      start: isHorizontal ? event.clientX : event.clientY,
      size,
      max: limitFor(event.currentTarget),
      bodyCursor: document.body.style.cursor,
      bodyUserSelect: document.body.style.userSelect,
    }
    document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'
    drag(true)
  }

  const handlePointerMove = (event) => {
    const current = dragRef.current
    if (!current) return
    const delta = (isHorizontal ? event.clientX : event.clientY) - current.start
    resize(clamp(current.size + delta, minSize, current.max))
  }

  const handleKeyDown = (event) => {
    const back = isHorizontal ? 'ArrowLeft' : 'ArrowUp'
    const forward = isHorizontal ? 'ArrowRight' : 'ArrowDown'
    const max = limitFor(event.currentTarget)
    let next = null
    if (event.key === back) next = size - KEY_STEP
    else if (event.key === forward) next = size + KEY_STEP
    else if (event.key === 'Home') next = minSize
    else if (event.key === 'End') next = max
    if (next == null) return
    event.preventDefault()
    resize(clamp(next, minSize, max))
  }

  const classes = [
    'split-pane',
    `split-pane--${isHorizontal ? 'horizontal' : 'vertical'}`,
    dragging && 'split-pane--dragging',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const node = (
    <div className={classes}>
      <div className="split-pane__pane split-pane__pane--first" style={{ flex: `0 0 ${size}px` }}>
        {first}
      </div>
      <DevScope id="tzo8003" state={{ dragging }}>
        <div
          className={`split-pane__handle${dragging ? ' split-pane__handle--dragging' : ''}`}
          role="separator"
          aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
          aria-valuenow={Math.round(size)}
          aria-valuemin={minSize}
          aria-valuemax={Number.isFinite(maxSize) ? maxSize : undefined}
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onLostPointerCapture={endDrag}
          onKeyDown={handleKeyDown}
          onDoubleClick={reset}
        />
      </DevScope>
      <div className="split-pane__pane split-pane__pane--second">
        {second}
      </div>
    </div>
  )

  return devId ? <DevScope id={devId} state={{ direction, size: Math.round(size), dragging }}>{node}</DevScope> : node
}

/**
 * withSplitPane — state controller HOC.
 *
 * Owns `size`, initialised from localStorage[storageKey] when valid, else
 * `defaultSize`. Persists the size whenever it settles (drag end, keyboard,
 * reset). Provides `resize(px)` and `reset()`.
 *
 * Props:
 *   defaultSize {number} — initial / reset size in px (default: 260)
 *   minSize     {number}
 *   maxSize     {number}
 *   storageKey  {string} — localStorage key for persistence (optional)
 */
export const withSplitPane = (WrappedComponent) => ({
  defaultSize = 260,
  minSize = 0,
  maxSize = Infinity,
  storageKey,
  ...props
}) => {
  const [size, setSize] = useState(() => {
    const stored = readStoredSize(storageKey)
    return clamp(stored ?? defaultSize, minSize, maxSize)
  })
  const [dragging, setDragging] = useState(false)
  const persistedRef = useRef(size)

  useEffect(() => {
    if (dragging || size === persistedRef.current) return
    persistedRef.current = size
    writeStoredSize(storageKey, size)
  }, [size, dragging, storageKey])

  const resize = (px) => setSize(clamp(px, minSize, maxSize))
  const reset = () => setSize(clamp(defaultSize, minSize, maxSize))
  const drag = (active) => setDragging(Boolean(active))

  return (
    <WrappedComponent
      size={size}
      minSize={minSize}
      maxSize={maxSize}
      resize={resize}
      reset={reset}
      dragging={dragging}
      drag={drag}
      {...props}
    />
  )
}

const SplitPane = withSplitPane(SplitPaneDisplay)
export default SplitPane
