import { createElement, useCallback, useEffect, useRef, useState } from 'react'
import Button from '../Button/button'
import ColorPicker from '../ColorPicker/colorPicker'
import { DevScope } from '../DevInspector/devInspector'
import { drawStroke } from '../../lib/brushStrokes'
import useBrushPalette from '../../lib/useBrushPalette'
import './styles.css'

const DEFAULT_SIZE = 6
const MIN_SIZE = 1
const MAX_SIZE = 60

const loadImage = (src) => new Promise((resolve, reject) => {
  const image = new Image()
  image.crossOrigin = 'anonymous'
  image.onload = () => resolve(image)
  image.onerror = () => reject(new Error('Image failed to load'))
  image.src = src
})

const paint = (canvas, image, strokes) => {
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(image, 0, 0)
  strokes.forEach((stroke) => drawStroke(ctx, stroke))
}

// The canvas uses object-fit: contain, so map through the letterboxed image box.
const fitBox = (canvas) => {
  const rect = canvas.getBoundingClientRect()
  const scale = Math.min(rect.width / canvas.width, rect.height / canvas.height)
  return {
    scale,
    rect,
    left: rect.left + (rect.width - canvas.width * scale) / 2,
    top: rect.top + (rect.height - canvas.height * scale) / 2,
  }
}

/**
 * Flattens strokes (in natural image pixels) onto the source image.
 */
export const renderSketch = async ({ src, strokes = [], type = 'image/png', quality }) => {
  const image = await loadImage(src)
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  paint(canvas, image, strokes)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Sketch export failed'))), type, quality)
  })
}

export const MediaSketchDisplay = ({
  src,
  alt = '',
  strokes = [],
  color,
  setColor = () => {},
  palette,
  selectedSwatch,
  selectSwatch = () => {},
  size = DEFAULT_SIZE,
  setSize = () => {},
  minSize = MIN_SIZE,
  maxSize = MAX_SIZE,
  addStroke = () => {},
  undo = () => {},
  clear = () => {},
  save = () => {},
  isSaving = false,
  saveLabel = 'Save',
  className,
  devId = 'xba6ax0',
  children,
}) => {
  const canvasRef = useRef(null)
  const activeRef = useRef(null)
  const [image, setImage] = useState(null)
  const [cursor, setCursor] = useState(null)

  useEffect(() => {
    let cancelled = false
    setImage(null)
    loadImage(src).then((loaded) => {
      if (!cancelled) setImage(loaded)
    }).catch(() => {})
    return () => {
      cancelled = true
    }
  }, [src])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return
    paint(canvas, image, strokes)
  }, [image, strokes])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return
      if (event.target?.closest?.('input, textarea, [contenteditable="true"]')) return
      event.preventDefault()
      undo()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo])

  const toImagePoint = (event, box) => ({
    x: (event.clientX - box.left) / box.scale,
    y: (event.clientY - box.top) / box.scale,
  })

  const trackCursor = (event, box) => {
    if (event.pointerType === 'touch') return
    setCursor({ x: event.clientX - box.rect.left, y: event.clientY - box.rect.top })
  }

  const handlePointerDown = (event) => {
    const canvas = canvasRef.current
    if (!canvas || !image || event.button !== 0 || isSaving) return
    event.preventDefault()
    canvas.setPointerCapture(event.pointerId)
    const box = fitBox(canvas)
    const stroke = { kind: 'stroke', tool: 'pen', color, size: size / box.scale, opacity: 1, erase: false, points: [toImagePoint(event, box)] }
    activeRef.current = { pointerId: event.pointerId, box, stroke }
    drawStroke(canvas.getContext('2d'), stroke)
  }

  const handlePointerMove = (event) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const active = activeRef.current
    if (!active || active.pointerId !== event.pointerId) {
      if (image) trackCursor(event, fitBox(canvas))
      return
    }
    trackCursor(event, active.box)
    const { points } = active.stroke
    const last = points[points.length - 1]
    const point = toImagePoint(event, active.box)
    points.push(point)
    drawStroke(canvas.getContext('2d'), active.stroke, [last, point])
  }

  const finishStroke = (event) => {
    const active = activeRef.current
    if (!active || active.pointerId !== event.pointerId) return
    activeRef.current = null
    addStroke(active.stroke)
  }

  return (
    <DevScope id={devId} state={{ strokes: strokes.length }}>
      <div className={`media-sketch${className ? ` ${className}` : ''}`} data-gesture-ignore>
        <div className="media-sketch__stage">
          <canvas
            ref={canvasRef}
            className="media-sketch__canvas"
            width={image?.naturalWidth || 0}
            height={image?.naturalHeight || 0}
            role="img"
            aria-label={alt}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishStroke}
            onPointerCancel={finishStroke}
            onPointerLeave={() => setCursor(null)}
          />
          {cursor && (
            <span
              className="media-sketch__cursor"
              aria-hidden="true"
              style={{ left: cursor.x, top: cursor.y, width: size, height: size }}
            />
          )}
        </div>
        <DevScope id="b7r4lsr" state={{ color }}>
          <div className="media-sketch__toolbar">
            <ColorPicker
              value={color}
              change={setColor}
              palette={palette}
              selectedIndex={selectedSwatch}
              selectSwatch={selectSwatch}
            />
            <input
              type="range"
              className="media-sketch__size"
              min={minSize}
              max={maxSize}
              value={size}
              onChange={(event) => setSize(Number(event.target.value))}
              aria-label="Brush size"
            />
            <Button size="sm" variant="ghost" disabled={!strokes.length || isSaving} onClick={undo}>Undo</Button>
            <Button size="sm" variant="ghost" disabled={!strokes.length || isSaving} onClick={clear}>Clear</Button>
            {children}
            <Button size="sm" disabled={!strokes.length || !image} loading={isSaving} onClick={save}>{saveLabel}</Button>
          </div>
        </DevScope>
      </div>
    </DevScope>
  )
}

export const withMediaSketch = (WrappedComponent) => ({
  src,
  onSave = () => {},
  paletteStorageKey,
  defaultSize = DEFAULT_SIZE,
  type = 'image/png',
  quality,
  ...props
}) => {
  const { palette, selectedSwatch, swatchColor, setSwatchColor, selectSwatch } = useBrushPalette({ storageKey: paletteStorageKey })
  const [strokes, setStrokes] = useState([])
  const [size, setSize] = useState(defaultSize)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setStrokes([])
  }, [src])

  const addStroke = useCallback((stroke) => setStrokes((prev) => [...prev, stroke]), [])
  const undo = useCallback(() => setStrokes((prev) => prev.slice(0, -1)), [])
  const clear = useCallback(() => setStrokes([]), [])

  const save = async () => {
    if (!strokes.length || isSaving) return
    setIsSaving(true)
    try {
      const blob = await renderSketch({ src, strokes, type, quality })
      await onSave(blob, { strokes })
      setStrokes([])
    } catch (error) {
      // onSave reports its own failures; strokes stay so the user can retry.
    } finally {
      setIsSaving(false)
    }
  }

  return createElement(WrappedComponent, {
    src,
    strokes,
    color: swatchColor,
    setColor: setSwatchColor,
    palette,
    selectedSwatch,
    selectSwatch,
    size,
    setSize,
    addStroke,
    undo,
    clear,
    save,
    isSaving,
    ...props,
  })
}

const MediaSketch = withMediaSketch(MediaSketchDisplay)

export default MediaSketch
