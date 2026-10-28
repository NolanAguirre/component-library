import { createElement, useRef, useState } from 'react'
import { DevScope } from '../DevInspector/devInspector'
import './styles.css'

const MIN_SIZE = 0.005
const clamp = value => Math.max(0, Math.min(1, value))
const boxFrom = ({ x0, y0, x1, y1 }) => ({ x: Math.min(x0, x1), y: Math.min(y0, y1), w: Math.abs(x1 - x0), h: Math.abs(y1 - y0) })
const percent = box => ({ left: `${box.x * 100}%`, top: `${box.y * 100}%`, width: `${box.w * 100}%`, height: `${box.h * 100}%` })

/**
 * Image with normalized (0–1) rectangular regions. Drag on the image to draw a new region.
 * regions: [{ id, x, y, w, h, label?, tone? }]; tone adds `media-regions__region--<tone>`.
 */
export const MediaRegionsDisplay = ({ devId, src, alt = '', regions = [], selected, onSelect = () => {}, draft, disabled = false, stageRef, pointer = {}, className = '' }) => (
  <DevScope id={devId} state={{ drawing: Boolean(draft), selected: selected || null }}>
    <div className={`media-regions ${disabled ? 'media-regions--disabled' : ''} ${className}`}>
      <div ref={stageRef} className="media-regions__stage" {...pointer}>
        <img className="media-regions__image" src={src} alt={alt} draggable={false} />
        {regions.map((region, index) => (
          <button key={region.id} type="button" style={percent(region)}
            className={`media-regions__region ${region.tone ? `media-regions__region--${region.tone}` : ''} ${region.id === selected ? 'is-selected' : ''}`}
            aria-pressed={region.id === selected} aria-label={region.label || `Region ${index + 1}`}
            onPointerDown={event => event.stopPropagation()} onClick={() => onSelect(region.id)}>
            <span className="media-regions__label">{region.label || index + 1}</span>
          </button>
        ))}
        {draft && <div className="media-regions__region media-regions__region--draft" style={percent(draft)} />}
      </div>
    </div>
  </DevScope>
)

export const withMediaRegions = (WrappedComponent) => ({ onDraw = () => {}, disabled = false, ...props }) => {
  const stageRef = useRef(null)
  const [drag, setDrag] = useState(null)
  const point = event => {
    const rect = stageRef.current.getBoundingClientRect()
    return [clamp((event.clientX - rect.left) / rect.width), clamp((event.clientY - rect.top) / rect.height)]
  }
  const pointer = {
    onPointerDown: event => {
      if (disabled || event.button !== 0) return
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      const [x, y] = point(event)
      setDrag({ pointerId: event.pointerId, x0: x, y0: y, x1: x, y1: y })
    },
    onPointerMove: event => {
      if (drag?.pointerId !== event.pointerId) return
      const [x, y] = point(event)
      setDrag(current => ({ ...current, x1: x, y1: y }))
    },
    onPointerUp: event => {
      if (drag?.pointerId !== event.pointerId) return
      const [x, y] = point(event)
      const box = boxFrom({ ...drag, x1: x, y1: y })
      setDrag(null)
      if (box.w >= MIN_SIZE && box.h >= MIN_SIZE) onDraw(box)
    },
    onPointerCancel: () => setDrag(null),
  }
  return createElement(WrappedComponent, { ...props, disabled, stageRef, pointer, draft: drag ? boxFrom(drag) : null })
}

const MediaRegions = withMediaRegions(MediaRegionsDisplay)

export default MediaRegions
