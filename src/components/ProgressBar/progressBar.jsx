import './styles.css'

/**
 * ProgressBar — stateless labelled progress indicator.
 *
 * Generalises the older UploadProgress: supports an arbitrary value/max range,
 * an optional label, a percentage read-out, status colors and striped/animated
 * variants.
 *
 * Props:
 *   value     {number}  — current progress amount (default: 0)
 *   max       {number}  — value that represents 100% (default: 100)
 *   label     {node}    — optional label rendered above the track
 *   status    {string}  — 'uploading' | 'done' | 'failed' (color, default 'uploading')
 *   striped   {boolean} — diagonal stripe overlay
 *   animated  {boolean} — animate the stripes (implies striped)
 *   showValue {boolean} — render the percentage on the right of the label row
 *   ...rest             — spread onto the root element
 */
const ProgressBar = ({
  value = 0,
  max = 100,
  label,
  status = 'uploading',
  striped = false,
  animated = false,
  showValue = false,
  addClassName = '',
  ...rest
}) => {
  const safeMax = max > 0 ? max : 100
  const percent = Math.min(100, Math.max(0, (value / safeMax) * 100))
  const rounded = Math.round(percent)
  const useStripes = striped || animated

  const classes = [
    'progress',
    `progress--${status}`,
    useStripes && 'progress--striped',
    animated && 'progress--animated',
    addClassName,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} {...rest}>
      {(label || showValue) && (
        <div className="progress__meta">
          {label && <span className="progress__label">{label}</span>}
          {showValue && <span className="progress__value">{rounded}%</span>}
        </div>
      )}
      <div
        className="progress__track"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={safeMax}
      >
        <div className="progress__bar" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

export default ProgressBar
