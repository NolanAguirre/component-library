import { useEffect, useRef, useState } from 'react'
import { DevScope } from '../DevInspector/devInspector'
import ColorPicker from '../ColorPicker/colorPicker'
import { analyzeBackgroundSplit, splitCanvasBackground } from '../../lib/imageBackgroundSplit'
import './styles.css'

const evenlySpaced = count => Array.from({ length: count - 1 }, (_, index) => (index + 1) / count)

const withBackgroundSplit = Component => function WithBackgroundSplit({ getCanvas, sourceVersion, onSplit, onPreviewChange, maxParts = 50, disabled = false, ...props }) {
  const [count, setCount] = useState(4)
  const [direction, setDirection] = useState('columns')
  const [positions, setPositions] = useState(() => evenlySpaced(4))
  const [color, setColor] = useState(null)
  const [tolerance, setTolerance] = useState(18)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const requestRef = useRef(0)

  useEffect(() => {
    requestRef.current += 1
    setResult(null)
    setError('')
    setBusy(false)
    return () => { requestRef.current += 1 }
  }, [sourceVersion])

  const invalidate = () => {
    requestRef.current += 1
    setResult(null)
    setError('')
    setBusy(false)
  }
  const change = (setter, value) => { invalidate(); setter(value) }
  const valid = Number.isInteger(Number(count)) && Number(count) >= 2 && Number(count) <= Math.min(50, maxParts)
  const ready = result?.sourceVersion === sourceVersion ? result : null

  useEffect(() => {
    onPreviewChange?.(ready?.analysis || null, sourceVersion)
    return () => onPreviewChange?.(null, sourceVersion)
  }, [ready, sourceVersion, onPreviewChange])

  const perform = async action => {
    if (disabled || busy || !valid) return
    const request = ++requestRef.current
    setBusy(true)
    setError('')
    try {
      // Let the pending state paint before bounded pixel analysis / PNG encoding.
      await new Promise(resolve => setTimeout(resolve, 0))
      if (request !== requestRef.current) return
      await action()
    } catch (err) {
      if (request === requestRef.current) setError(err.message || 'Could not split this image.')
    } finally {
      if (request === requestRef.current) setBusy(false)
    }
  }

  const preview = () => perform(() => {
    setResult(null)
    const canvas = getCanvas?.()
    const analysis = analyzeBackgroundSplit(canvas, { positions, direction, color, tolerance })
    setResult({ canvas, analysis, sourceVersion })
  })
  const add = () => perform(async () => {
    if (!ready) return
    await onSplit?.(splitCanvasBackground(ready.canvas, ready.analysis))
    setResult(null)
  })

  return <Component {...props} backgroundSplit={{
    count, direction, positions, color, tolerance, busy, error, valid, maxParts,
    analysis: ready?.analysis, disabled: disabled || busy, preview, add,
    setCount: value => {
      invalidate()
      setCount(value)
      const number = Number(value)
      setPositions(Number.isInteger(number) && number >= 2 && number <= 50 ? evenlySpaced(number) : [])
    },
    setDirection: value => change(setDirection, value),
    setColor: value => change(setColor, value),
    setTolerance: value => change(setTolerance, value),
    setPosition: (index, value) => change(setPositions, positions.map((position, i) => i === index ? value : position)),
  }} />
}

const BackgroundSplitPreview = ({ devId, analysis, showImage = true, style }) => {
  if (!analysis) return null
  return (
    <DevScope id={devId}>
      <svg className="background-split__preview" style={style} viewBox={`0 0 ${analysis.width} ${analysis.height}`} role="img" aria-label="Preview of curved split boundaries">
        {showImage && <image href={analysis.preview} width={analysis.width} height={analysis.height} />}
        {analysis.seams.map((seam, index) => {
          const points = Array.from(seam.path, (position, line) => analysis.direction === 'columns'
            ? `${position * analysis.width},${(line + 0.5) / seam.path.length * analysis.height}`
            : `${(line + 0.5) / seam.path.length * analysis.width},${position * analysis.height}`).join(' ')
          return <g key={index}>
            <polyline points={points} fill="none" stroke="#111" strokeWidth="4" vectorEffect="non-scaling-stroke" />
            <polyline points={points} fill="none" stroke={seam.crossingFraction > 0.01 ? '#fbbf24' : '#22d3ee'} strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </g>
        })}
      </svg>
    </DevScope>
  )
}

const BackgroundSplitDisplay = ({ devId, backgroundSplit, addLabel = 'Add cutouts', showPreview = true }) => {
  const split = backgroundSplit
  const analysis = split.analysis
  const risky = analysis?.seams.some(seam => seam.crossingFraction > 0.01)
  return (
    <DevScope id={devId} state={{ busy: split.busy, direction: split.direction }}>
      <div className="background-split">
        <strong>Intelligent split</strong>
        <p>Follow the background between subjects with curved cuts. Each PNG keeps its background; corners outside its curved boundary are transparent.</p>
        <fieldset disabled={split.disabled}>
          <label>Parts <input type="number" min="2" max={Math.min(50, split.maxParts)} step="1" value={split.count} onChange={event => split.setCount(event.target.value)} /></label>
          <label>Arrangement
            <select value={split.direction} onChange={event => split.setDirection(event.target.value)}>
              <option value="columns">Side by side</option>
              <option value="rows">Stacked</option>
            </select>
          </label>
          <label><input type="checkbox" checked={split.color === null} onChange={event => split.setColor(event.target.checked ? null : analysis?.color || '#eeeeee')} /> Detect background color</label>
          {split.color !== null && <div className="background-split__color">Background <ColorPicker value={split.color} onChange={split.setColor} label="Split background color" /></div>}
          {analysis && split.color === null && <span>Detected background: {analysis.color}</span>}
          <label>Color tolerance: {split.tolerance}% <input type="range" min="1" max="60" value={split.tolerance} onChange={event => split.setTolerance(Number(event.target.value))} /></label>
          <p>Increase tolerance for shadows or gradients. Move the hints near the gaps for uneven layouts.</p>
          {split.positions.map((position, index) => (
            <label key={index}>Boundary {index + 1}: {Math.round(position * 100)}%
              <input type="range" min={Math.ceil((split.positions[index - 1] ?? 0) * 100) + 1} max={Math.floor((split.positions[index + 1] ?? 1) * 100) - 1} step="1" value={Math.round(position * 100)} onChange={event => split.setPosition(index, Number(event.target.value) / 100)} />
            </label>
          ))}
          {!split.valid && <p>Choose 2–{Math.min(50, split.maxParts)} parts within the remaining cutout limit.</p>}
          <button type="button" onClick={split.preview} disabled={!split.valid}>{split.busy ? 'Working…' : 'Preview intelligent split'}</button>
        </fieldset>
        {analysis && (
          <DevScope id="c7m1f9a">
            {showPreview && <BackgroundSplitPreview devId="t6v2p8d" analysis={analysis} />}
            {!showPreview && <p>Split boundaries are shown on the main image.</p>}
            <p>{risky ? 'Amber boundaries cross pixels unlike the background and may cut a subject. Adjust the hints or color settings and review before adding.' : 'Review the boundaries before adding. Touching subjects may still need a manual cut.'}</p>
            <button type="button" onClick={split.add} disabled={split.disabled || !split.valid}>{addLabel} ({analysis.seams.length + 1})</button>
          </DevScope>
        )}
        {split.error && <p role="alert">{split.error}</p>}
      </div>
    </DevScope>
  )
}

const BackgroundSplit = withBackgroundSplit(BackgroundSplitDisplay)
export { BackgroundSplitDisplay, BackgroundSplitPreview, withBackgroundSplit }
export default BackgroundSplit
