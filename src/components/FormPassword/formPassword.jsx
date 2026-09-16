import { useState } from 'react'
import './styles.css'

/**
 * FormPassword — password input with show/hide toggle.
 *
 * Receives field:{ name, value, onChange, onBlur } from FormField via cloneElement.
 */
const FormPassword = ({ field: { name, value, onChange, onBlur } = {}, placeholder = '••••••••', ...rest }) => {
  const [visible, setVisible] = useState(false)

  const toggleVisibility = () => setVisible((prev) => !prev)

  return (
    <div className="form-password">
      <input
        id={name}
        name={name}
        type={visible ? 'text' : 'password'}
        value={value ?? ''}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className="form__input form-password__input"
        {...rest}
      />
      <button
        type="button"
        className="form-password__toggle"
        onClick={toggleVisibility}
        aria-label={visible ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {visible ? '🙈' : '👁'}
      </button>
    </div>
  )
}

export default FormPassword

