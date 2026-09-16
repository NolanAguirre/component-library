import './styles.css'

/**
 * FormPhone — phone number input with formatting/masking.
 *
 * Receives field:{ name, value, onChange, onBlur } from FormField via cloneElement.
 * Formats input as (XXX) XXX-XXXX for US numbers.
 */
const FormPhone = ({ field: { name, value, onChange, onBlur } = {}, placeholder = '(555) 123-4567', ...rest }) => {
  const formatPhone = (raw) => {
    const digits = raw.replace(/\D/g, '').slice(0, 10)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  const handleChange = (e) => {
    const formatted = formatPhone(e.target.value)
    if (onChange) {
      onChange({ target: { value: formatted } })
    }
  }

  return (
    <input
      id={name}
      name={name}
      type="tel"
      value={value ?? ''}
      onChange={handleChange}
      onBlur={onBlur}
      placeholder={placeholder}
      className="form__input form__input--phone"
      {...rest}
    />
  )
}

export default FormPhone

