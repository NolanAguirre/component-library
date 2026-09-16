import './styles.css'

/**
 * FormColorPicker — color swatch / input for selecting a colour value.
 *
 * Receives field:{ name, value, onChange, onBlur } from FormField via cloneElement.
 */
const FormColorPicker = ({ field: { name, value, onChange, onBlur } = {}, ...rest }) => {
  const currentColor = value || '#2563eb'

  return (
    <div className="form-color">
      <input
        id={name}
        name={name}
        type="color"
        value={currentColor}
        onChange={onChange}
        onBlur={onBlur}
        className="form-color__input"
        {...rest}
      />
      <span className="form-color__value">{currentColor}</span>
    </div>
  )
}

export default FormColorPicker

