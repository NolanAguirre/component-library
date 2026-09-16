import './styles.css'

/**
 * FormToggle — styled on/off toggle switch (boolean).
 *
 * Receives field:{ name, value, onChange, onBlur } from FormField via cloneElement.
 * Also works standalone when given props directly.
 *
 * The toggle fires onChange with a synthetic event whose target.checked
 * matches the new boolean state, so it works with the checkbox field type.
 */
const FormToggle = ({ field: { name, value, onChange, onBlur } = {}, disabled, ...rest }) => {
  const isOn = Boolean(value)

  const handleToggle = () => {
    if (disabled || !onChange) return
    onChange({ target: { checked: !isOn, value: !isOn } })
  }

  return (
    <button
      type="button"
      id={name}
      role="switch"
      aria-checked={isOn}
      disabled={disabled}
      className={`form-toggle${isOn ? ' form-toggle--on' : ''}`}
      onClick={handleToggle}
      onBlur={onBlur}
      {...rest}
    >
      <span className="form-toggle__track">
        <span className="form-toggle__thumb" />
      </span>
    </button>
  )
}

export default FormToggle

