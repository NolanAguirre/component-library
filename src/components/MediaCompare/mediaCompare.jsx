import { useCallback, useEffect, useRef, useState } from 'react'
import Media from '../Media/media'
import { DevScope } from '../DevInspector/devInspector'
import registerImages from '../../lib/registerImages'
import './styles.css'

const isEditable = (target) => {
  const tag = target?.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable
}

const formatPx = (value) => {
  const rounded = Math.round(value)
  return `${rounded < 0 ? '-' : '+'}${Math.abs(rounded)} px`
}

/**
 * Overlay CSS transform for an alignment result.
 *
 * The alignment is expressed in reference natural pixels; here it is mapped
 * into stage pixels using the reference's contain-fit within the stage. The
 * transform-origin sits at the reference fit-box top-left so `scale` grows from
 * the same corner the registration used. If base and overlay aspect ratios
 * differ the transform is still applied in reference space (an approximation).
 */
const overlayTransformStyle = (alignment, stage) => {
  if (!alignment || stage.width <= 0 || stage.height <= 0) return null
  const { referenceWidth: natW, referenceHeight: natH, scale, translateX, translateY } = alignment
  if (!natW || !natH) return null
  const k = Math.min(stage.width / natW, stage.height / natH)
  const fitW = natW * k
  const fitH = natH * k
  const originX = (stage.width - fitW) / 2
  const originY = (stage.height - fitH) / 2
  return {
    transform: `translate(${translateX * k}px, ${translateY * k}px) scale(${scale})`,
    transformOrigin: `${originX}px ${originY}px`,
  }
}

/**
 * MediaCompareDisplay — pure display controller.
 *
 * Stacks two full-variant Media layers absolutely; the top (overlay) layer is
 * opaque only while flipped, letting the user blink between the two images to
 * spot differences. When an alignment is applied the overlay layer is
 * CSS-transformed so the two images register, while the browser keeps rendering
 * the untouched full-resolution image.
 *
 * Props:
 *   base            — the pinned base item (Original)
 *   overlay         — the item to compare against (New)
 *   getMedia        — maps an item to Media props { src, type, ... }
 *   isFlipped {bool}— whether the overlay layer is shown
 *   flipDown/flipUp — hold-to-flip actions (press to show New, release for Original)
 *   toggleFlip      — click-toggle fallback for touch
 *   actions         — optional node rendered as a top-right overlay slot
 *   alignment       — { scale, translateX, translateY, score, referenceWidth, referenceHeight } or null
 *   alignStatus     — 'idle' | 'running' | 'failed'
 *   autoAlign       — start an auto-align run
 *   clearAlign      — drop the applied alignment
 */
export const MediaCompareDisplay = ({
  base,
  overlay,
  getMedia = (item) => item || {},
  isFlipped = false,
  flipDown = () => {},
  flipUp = () => {},
  toggleFlip = () => {},
  actions,
  alignment = null,
  alignStatus = 'idle',
  autoAlign = () => {},
  clearAlign = () => {}
}) => {
  const stageRef = useRef(null)
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const node = stageRef.current
    if (!node) return undefined
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      setStageSize({ width, height })
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const transform = overlayTransformStyle(alignment, stageSize)
  const overlayStyle = { opacity: isFlipped ? 1 : 0, ...(transform || {}) }

  return (
    <div className="media-compare">
      <div className="media-compare__stage" ref={stageRef}>
        <Media {...getMedia(base)} variant="full" magnify={false} className="media-compare__layer" />
        <div className="media-compare__layer media-compare__layer--top" style={overlayStyle}>
          <Media {...getMedia(overlay)} variant="full" magnify={false} />
        </div>
      </div>
      <div className="media-compare__actions">
        <DevScope id="mca7x3q" state={{ alignStatus }}>
          <div className="media-compare__align">
            <button
              type="button"
              className="media-compare__align-button"
              onClick={autoAlign}
              disabled={alignStatus === 'running'}
            >
              {alignStatus === 'running' ? 'Aligning...' : alignment ? 'Auto Aligned' : 'Auto Align'}
            </button>
            {alignment && (
              <button type="button" className="media-compare__align-reset" onClick={clearAlign}>Reset</button>
            )}
            {alignment && (
              <span className="media-compare__align-readout">
                {`Scale ${(alignment.scale * 100).toFixed(2)}% X ${formatPx(alignment.translateX)} Y ${formatPx(alignment.translateY)} Score ${alignment.score.toFixed(3)}`}
              </span>
            )}
            {alignStatus === 'failed' && (
              <span className="media-compare__align-readout media-compare__align-readout--error">No confident match</span>
            )}
          </div>
        </DevScope>
        {actions}
      </div>
      <button
        type="button"
        className={`media-compare__flip${isFlipped ? ' media-compare__flip--active' : ''}`}
        onMouseDown={flipDown}
        onMouseUp={flipUp}
        onMouseLeave={flipUp}
        onTouchStart={flipDown}
        onTouchEnd={flipUp}
        onClick={toggleFlip}
      >
        {isFlipped ? 'Showing New' : 'Showing Original'}
      </button>
    </div>
  )
}

/**
 * withMediaCompare — flip-state controller HOC.
 *
 * Owns the flip state and wires hold-to-flip via the Space key. Exposes
 * plain-verb actions flipDown / flipUp / toggleFlip to the display.
 */
const withMediaCompare = (WrappedComponent) => (props) => {
  const [isFlipped, setIsFlipped] = useState(false)

  const flipDown = () => setIsFlipped(true)
  const flipUp = () => setIsFlipped(false)
  const toggleFlip = () => setIsFlipped((prev) => !prev)

  useEffect(() => {
    const isSpace = (event) => event.code === 'Space' || event.key === ' '

    const handleKeyDown = (event) => {
      if (!isSpace(event)) return
      if (isEditable(event.target)) return
      // Suppress the default Space behaviour (page scroll and activation of any
      // focused button, e.g. the details toggle) for the whole hold gesture.
      event.preventDefault()
      if (event.repeat) return
      flipDown()
    }

    const handleKeyUp = (event) => {
      if (!isSpace(event)) return
      if (isEditable(event.target)) return
      event.preventDefault()
      flipUp()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return <WrappedComponent isFlipped={isFlipped} flipDown={flipDown} flipUp={flipUp} toggleFlip={toggleFlip} {...props} />
}

/**
 * withMediaCompareAlign — auto-align controller HOC.
 *
 * Runs constrained (uniform scale + translation) registration in a worker via
 * registerImages, keeping the applied `alignment` (reference-pixel units) and
 * an `alignStatus`. The alignment resets whenever either media src changes.
 * While an alignment is applied, arrow keys nudge translation by 1 px (Shift =
 * 10) and +/- adjust scale by 0.1%, ignored inside editable targets.
 */
const withMediaCompareAlign = (WrappedComponent) => (props) => {
  const { base, overlay, getMedia = (item) => item || {} } = props
  const baseSrc = getMedia(base)?.src
  const overlaySrc = getMedia(overlay)?.src

  const [alignment, setAlignment] = useState(null)
  const [alignStatus, setAlignStatus] = useState('idle')
  const runIdRef = useRef(0)

  useEffect(() => {
    runIdRef.current += 1
    setAlignment(null)
    setAlignStatus('idle')
  }, [baseSrc, overlaySrc])

  const autoAlign = useCallback(() => {
    if (!baseSrc || !overlaySrc) return
    runIdRef.current += 1
    const runId = runIdRef.current
    setAlignStatus('running')
    registerImages(baseSrc, overlaySrc)
      .then((result) => {
        if (runId !== runIdRef.current) return
        if (result.ok) {
          setAlignment(result)
          setAlignStatus('idle')
        } else {
          setAlignStatus('failed')
        }
      })
      .catch(() => {
        if (runId !== runIdRef.current) return
        setAlignStatus('failed')
      })
  }, [baseSrc, overlaySrc])

  const clearAlign = useCallback(() => {
    setAlignment(null)
    setAlignStatus('idle')
  }, [])

  const nudgeAlign = useCallback(({ dx = 0, dy = 0, dScale = 0 }) => {
    setAlignment((prev) => (prev ? {
      ...prev,
      translateX: prev.translateX + dx,
      translateY: prev.translateY + dy,
      scale: prev.scale + dScale
    } : prev))
  }, [])

  useEffect(() => {
    if (!alignment) return undefined
    const handleKeyDown = (event) => {
      if (isEditable(event.target)) return
      const stepPx = event.shiftKey ? 10 : 1
      switch (event.key) {
        case 'ArrowLeft': nudgeAlign({ dx: -stepPx }); break
        case 'ArrowRight': nudgeAlign({ dx: stepPx }); break
        case 'ArrowUp': nudgeAlign({ dy: -stepPx }); break
        case 'ArrowDown': nudgeAlign({ dy: stepPx }); break
        case '+':
        case '=': nudgeAlign({ dScale: 0.001 }); break
        case '-':
        case '_': nudgeAlign({ dScale: -0.001 }); break
        default: return
      }
      event.preventDefault()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [alignment, nudgeAlign])

  return (
    <WrappedComponent
      {...props}
      alignment={alignment}
      alignStatus={alignStatus}
      autoAlign={autoAlign}
      clearAlign={clearAlign}
      nudgeAlign={nudgeAlign}
    />
  )
}

const MediaCompare = withMediaCompare(withMediaCompareAlign(MediaCompareDisplay))
export default MediaCompare
export { withMediaCompareAlign }
