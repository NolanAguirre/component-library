import './styles.css'

/**
 * FormRange — styled <input type="range"> slider with min/max/step and value label.
 *
 * Receives field:{ name, value, onChange, onBlur } from FormField via cloneElement.
 */
const FormRange = ({
  field: { name, value, onChange, onBlur } = {},
  min = 0,
  max = 100,
  step = 1,
  showValue = true,
  ...rest
}) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange({ target: { value: Number(e.target.value) } })
    }
  }

  const handleTextChange = (e) => {
    if (!onChange) return
    const raw = e.target.value
    if (raw === '' || raw === '-') return
    const clamped = Math.min(max, Math.max(min, Number(raw)))
    onChange({ target: { value: clamped } })
  }

  const numValue = Number(value ?? min)
  const percent = ((numValue - min) / (max - min)) * 100

  return (
    <div className="form-range">
      <input
        id={name}
        name={name}
        type="range"
        min={min}
        max={max}
        step={step}
        value={numValue}
        onChange={handleChange}
        onBlur={onBlur}
        className="form-range__input"
        style={{ '--range-percent': `${percent}%` }}
        {...rest}
      />
      {showValue && (
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={numValue}
          onChange={handleTextChange}
          onBlur={onBlur}
          className="form-range__value"
        />
      )}
    </div>
  )
}

export default FormRange

