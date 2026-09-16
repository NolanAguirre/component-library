import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { DevScope } from '../DevInspector/devInspector'
import './styles.css'

const clamp01 = (value) => Math.min(1, Math.max(0, value))

const normalizeHex = (value) => {
  let hex = String(value || '').trim().replace(/^#/, '')
  if (hex.length === 3) {
    hex = hex.split('').map((ch) => ch + ch).join('')
  }
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null
  return `#${hex.toLowerCase()}`
}

const hexToRgb = (hex) => {
  const value = normalizeHex(hex) || '#000000'
  return {
    r: parseInt(value.slice(1, 3), 16),
    g: parseInt(value.slice(3, 5), 16),
    b: parseInt(value.slice(5, 7), 16)
  }
}

const rgbToHex = ({ r, g, b }) => {
  const toHex = (n) => Math.round(clamp01(n / 255) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

const rgbToHsv = ({ r, g, b }) => {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  let h = 0
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6
    else if (max === gn) h = (bn - rn) / delta + 2
    else h = (rn - gn) / delta + 4
    h *= 60
    if (h < 0) h += 360
  }
  const s = max === 0 ? 0 : delta / max
  return { h, s, v: max }
}

const hsvToRgb = ({ h, s, v }) => {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let rn = 0
  let gn = 0
  let bn = 0
  if (h < 60) { rn = c; gn = x }
  else if (h < 120) { rn = x; gn = c }
  else if (h < 180) { gn = c; bn = x }
  else if (h < 240) { gn = x; bn = c }
  else if (h < 300) { rn = x; bn = c }
  else { rn = c; bn = x }
  return {
    r: (rn + m) * 255,
    g: (gn + m) * 255,
    b: (bn + m) * 255
  }
}

/**
 * ColorPickerDisplay — pure display controller.
 *
 * A swatch button that opens a portalled popover holding an HSV square, a hue
 * slider, a hex input, and an optional palette strip. All interaction state is
 * supplied by withColorPicker.
 *
 * Props:
 *   value         {string}   — current colour as a hex string
 *   palette       {Array}    — optional hex strings rendered as a swatch strip
 *   selectedIndex {number}   — palette slot currently in use
 *   open          {boolean}  — whether the popover is visible
 *   position      {object}   — { right, bottom } fixed placement of the popover
 *   hue           {number}   — fallback hue for greyscale values
 *   hexInput      {string}   — raw text in the hex field
 *   rootRef       {object}   — ref for the swatch wrapper
 *   swatchRef     {object}   — ref for the swatch button
 *   popoverRef    {object}   — ref for the portalled popover
 *   svRef         {object}   — ref for the saturation/value square
 *   hueRef        {object}   — ref for the hue slider
 *   toggle        {function} — toggle(): opens or closes the popover
 *   startSv       {function} — startSv(event): begins a saturation/value drag
 *   startHue      {function} — startHue(event): begins a hue drag
 *   changeHex     {function} — changeHex(event) from the hex input
 *   selectSwatch  {function} — selectSwatch(index) from the palette strip
 */
export const ColorPickerDisplay = ({
  value = '#000000',
  palette,
  selectedIndex,
  open = false,
  position = null,
  hue = 0,
  hexInput = '',
  rootRef,
  swatchRef,
  popoverRef,
  svRef,
  hueRef,
  toggle = () => {},
  startSv = () => {},
  startHue = () => {},
  changeHex = () => {},
  selectSwatch = () => {},
  label = 'Choose color'
}) => {
  const hsv = rgbToHsv(hexToRgb(value))
  const displayHue = hsv.s > 0 && hsv.v > 0 ? hsv.h : hue

  return (
    <div className="color-picker" ref={rootRef}>
      <button
        ref={swatchRef}
        type="button"
        className="color-picker__swatch"
        style={{ background: value }}
        onClick={toggle}
        aria-label={label}
      />
      {open && position && createPortal(
        <DevScope id="h8f2t4c">
          <div
            ref={popoverRef}
            className="color-picker__popover"
            style={{ right: position.right, bottom: position.bottom }}
          >
            <div
              ref={svRef}
              className="color-picker__sv"
              style={{ background: `hsl(${displayHue}, 100%, 50%)` }}
              onPointerDown={startSv}
            >
              <div className="color-picker__sv-white" />
              <div className="color-picker__sv-black" />
              <div
                className="color-picker__sv-thumb"
                style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
              />
            </div>
            <div
              ref={hueRef}
              className="color-picker__hue"
              onPointerDown={startHue}
            >
              <div
                className="color-picker__hue-thumb"
                style={{ left: `${(displayHue / 360) * 100}%` }}
              />
            </div>
            <input
              type="text"
              className="color-picker__hex"
              value={hexInput}
              onChange={changeHex}
              spellCheck={false}
              maxLength={7}
            />
            {palette && (
              <div className="color-picker__palette">
                {palette.map((swatch, index) => (
                  <button
                    key={index}
                    type="button"
                    className={[
                      'color-picker__palette-swatch',
                      index === selectedIndex ? 'color-picker__palette-swatch--active' : ''
                    ].filter(Boolean).join(' ')}
                    style={{ background: swatch }}
                    onClick={() => selectSwatch(index)}
                    aria-pressed={index === selectedIndex}
                    aria-label={`Color slot ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </DevScope>,
        document.body
      )}
    </div>
  )
}

/**
 * withColorPicker — state controller HOC.
 *
 * Owns popover open/placement, the fallback hue for greyscale values, the raw
 * hex field text, and the pointer drag that tracks the HSV square and hue
 * slider. Emits normalized hex strings through change on every movement, and
 * through commit only once a drag ends or the popover closes, so consumers that
 * persist a colour do not write once per pointer frame.
 *
 * @param {React.Component} WrappedComponent
 */
export const withColorPicker = (WrappedComponent) => {
  const ColorPickerState = ({ value = '#000000', change = () => {}, commit = () => {}, ...props }) => {
    const [open, setOpen] = useState(false)
    const [position, setPosition] = useState(null)
    const [hue, setHue] = useState(() => rgbToHsv(hexToRgb(value)).h)
    const [hexInput, setHexInput] = useState(value)
    const rootRef = useRef(null)
    const swatchRef = useRef(null)
    const popoverRef = useRef(null)
    const svRef = useRef(null)
    const hueRef = useRef(null)
    const draggingRef = useRef(null)
    const pendingRef = useRef(null)
    const commitRef = useRef(commit)

    commitRef.current = commit

    const hsv = rgbToHsv(hexToRgb(value))
    const displayHue = hsv.s > 0 && hsv.v > 0 ? hsv.h : hue

    useEffect(() => {
      setHexInput(value)
    }, [value])

    const updatePosition = useCallback(() => {
      const swatch = swatchRef.current
      if (!swatch) return
      const rect = swatch.getBoundingClientRect()
      setPosition({
        right: window.innerWidth - rect.left + 8,
        bottom: window.innerHeight - rect.bottom
      })
    }, [])

    const flush = useCallback(() => {
      const pending = pendingRef.current
      if (pending == null) return
      pendingRef.current = null
      commitRef.current(pending)
    }, [])

    const close = useCallback(() => {
      flush()
      setOpen(false)
    }, [flush])

    const toggle = useCallback(() => {
      if (open) {
        close()
        return
      }
      updatePosition()
      setOpen(true)
    }, [open, close, updatePosition])

    useEffect(() => {
      if (!open) return undefined

      const handlePointerDown = (event) => {
        const inRoot = rootRef.current && rootRef.current.contains(event.target)
        const inPopover = popoverRef.current && popoverRef.current.contains(event.target)
        if (!inRoot && !inPopover) close()
      }
      const handleKey = (event) => {
        if (event.key === 'Escape') close()
      }
      const handleReposition = () => updatePosition()

      document.addEventListener('pointerdown', handlePointerDown)
      document.addEventListener('keydown', handleKey)
      window.addEventListener('resize', handleReposition)
      window.addEventListener('scroll', handleReposition, true)
      return () => {
        document.removeEventListener('pointerdown', handlePointerDown)
        document.removeEventListener('keydown', handleKey)
        window.removeEventListener('resize', handleReposition)
        window.removeEventListener('scroll', handleReposition, true)
      }
    }, [open, close, updatePosition])

    const emit = useCallback((nextHsv) => {
      const next = rgbToHex(hsvToRgb(nextHsv))
      pendingRef.current = next
      change(next)
    }, [change])

    const updateFromSv = useCallback((event) => {
      const rect = svRef.current.getBoundingClientRect()
      const s = clamp01((event.clientX - rect.left) / rect.width)
      const v = clamp01(1 - (event.clientY - rect.top) / rect.height)
      emit({ h: displayHue, s, v })
    }, [displayHue, emit])

    const updateFromHue = useCallback((event) => {
      const rect = hueRef.current.getBoundingClientRect()
      const nextHue = clamp01((event.clientX - rect.left) / rect.width) * 360
      setHue(nextHue)
      emit({ h: nextHue, s: hsv.s === 0 ? 1 : hsv.s, v: hsv.v === 0 ? 1 : hsv.v })
    }, [emit, hsv.s, hsv.v])

    const handlePointerMove = useCallback((event) => {
      if (draggingRef.current === 'sv') updateFromSv(event)
      else if (draggingRef.current === 'hue') updateFromHue(event)
    }, [updateFromSv, updateFromHue])

    useEffect(() => {
      const handleUp = () => {
        if (draggingRef.current == null) return
        draggingRef.current = null
        flush()
      }
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handleUp)
      return () => {
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handleUp)
      }
    }, [handlePointerMove, flush])

    const startSv = (event) => {
      draggingRef.current = 'sv'
      updateFromSv(event)
    }

    const startHue = (event) => {
      draggingRef.current = 'hue'
      updateFromHue(event)
    }

    const changeHex = (event) => {
      const raw = event.target.value
      setHexInput(raw)
      const normalized = normalizeHex(raw)
      if (!normalized) return
      pendingRef.current = normalized
      change(normalized)
    }

    return (
      <WrappedComponent
        value={value}
        open={open}
        position={position}
        hue={hue}
        hexInput={hexInput}
        rootRef={rootRef}
        swatchRef={swatchRef}
        popoverRef={popoverRef}
        svRef={svRef}
        hueRef={hueRef}
        toggle={toggle}
        startSv={startSv}
        startHue={startHue}
        changeHex={changeHex}
        {...props}
      />
    )
  }

  ColorPickerState.displayName = `withColorPicker(${WrappedComponent.displayName ?? WrappedComponent.name ?? 'Component'})`

  return ColorPickerState
}

export default withColorPicker(ColorPickerDisplay)
