import './styles.css'

/**
 * FormDate — styled date picker input (wraps native <input type="date">).
 *
 * Receives field:{ name, value, onChange, onBlur } from FormField via cloneElement.
 */
const FormDate = ({ field: { name, value, onChange, onBlur } = {}, ...rest }) => (
  <input
    id={name}
    name={name}
    type="date"
    value={value ?? ''}
    onChange={onChange}
    onBlur={onBlur}
    className="form__input form__input--date"
    {...rest}
  />
)

export default FormDate

