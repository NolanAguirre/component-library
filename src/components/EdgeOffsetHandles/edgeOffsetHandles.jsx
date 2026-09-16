import { useRef } from 'react'
import { DevScope } from '../DevInspector/devInspector'

const EDGES = ['top', 'right', 'bottom', 'left']
const OPPOSITE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }

// Coordinates and offsets are in source pixels; origin and scale place them on the stage.
const EdgeOffsetHandles = ({ devId, width, height, offsets, onChange, minWidth = 1, minHeight = 1, originX = 0, originY = 0, scale = 1, stageWidth, stageHeight, disabled = false }) => {
  const dragRef = useRef(null)
  const svgRef = useRef(null)
  const horizontal = edge => edge === 'left' || edge === 'right'
  const maximum = edge => Math.max(0, (horizontal(edge) ? width - minWidth : height - minHeight) - offsets[OPPOSITE[edge]])
  const change = (edge, value) => onChange({ ...offsets, [edge]: Math.max(0, Math.min(maximum(edge), Math.round(value))) })
  const position = (event, edge) => {
    const rect = svgRef.current.getBoundingClientRect()
    return horizontal(edge)
      ? ((event.clientX - rect.left) * stageWidth / rect.width - originX) / scale
      : ((event.clientY - rect.top) * stageHeight / rect.height - originY) / scale
  }
  const move = event => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId || disabled) return
    event.stopPropagation()
    const direction = drag.edge === 'right' || drag.edge === 'bottom' ? -1 : 1
    change(drag.edge, drag.offset + direction * (position(event, drag.edge) - drag.start))
  }
  const finish = event => {
    if (dragRef.current?.pointerId !== event.pointerId) return
    event.stopPropagation()
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }
  const left = offsets.left
  const right = width - offsets.right
  const top = offsets.top
  const bottom = height - offsets.bottom
  const centers = { top: [(left + right) / 2, top], bottom: [(left + right) / 2, bottom], left: [left, (top + bottom) / 2], right: [right, (top + bottom) / 2] }

  return (
    <DevScope id={devId}>
      <svg ref={svgRef} style={{ position: 'absolute', inset: 0, width: stageWidth, height: stageHeight, overflow: 'visible', pointerEvents: 'none' }}>
        {EDGES.map(edge => (
          <circle key={edge}
            cx={originX + centers[edge][0] * scale} cy={originY + centers[edge][1] * scale} r="7"
            fill="#0c4a6e" stroke="#7dd3fc" strokeWidth="2"
            role="slider" tabIndex={disabled ? -1 : 0} aria-disabled={disabled}
            aria-label={`${edge} edge offset`} aria-valuemin={0} aria-valuemax={maximum(edge)} aria-valuenow={offsets[edge]} aria-valuetext={`${offsets[edge]} pixels`}
            aria-orientation={horizontal(edge) ? 'horizontal' : 'vertical'}
            style={{ pointerEvents: disabled ? 'none' : 'all', touchAction: 'none', cursor: horizontal(edge) ? 'ew-resize' : 'ns-resize' }}
            onPointerDown={event => {
              if (disabled || event.button !== 0) return
              event.preventDefault()
              event.stopPropagation()
              event.currentTarget.focus()
              event.currentTarget.setPointerCapture(event.pointerId)
              dragRef.current = { edge, pointerId: event.pointerId, offset: offsets[edge], start: position(event, edge) }
            }}
            onPointerMove={move}
            onPointerUp={event => { move(event); finish(event) }}
            onPointerCancel={finish}
            onLostPointerCapture={() => { dragRef.current = null }}
            onKeyDown={event => {
              if (disabled || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
              event.preventDefault()
              event.stopPropagation()
              const direction = edge === 'right' || edge === 'bottom' ? -1 : 1
              const delta = (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1) * direction * (event.shiftKey ? 10 : 1)
              change(edge, event.key === 'Home' ? 0 : event.key === 'End' ? maximum(edge) : offsets[edge] + delta)
            }}
          ><title>Drag {edge} offset · {offsets[edge]} px</title></circle>
        ))}
      </svg>
    </DevScope>
  )
}

export default EdgeOffsetHandles
