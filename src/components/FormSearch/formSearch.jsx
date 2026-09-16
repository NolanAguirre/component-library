import { useRef, useEffect } from 'react'
import './styles.css'

/**
 * FormSearch — search input with clear button and optional debounce.
 *
 * Receives field:{ name, value, onChange, onBlur } from FormField via cloneElement.
 *
 * Props:
 *   debounce  {number}  — debounce delay in ms (0 = no debounce, default)
 *   search    {function} — called with the debounced value when debounce > 0
 */
const FormSearch = ({
  field: { name, value, onChange, onBlur } = {},
  debounce = 0,
  search,
  placeholder = 'Search…',
  ...rest
}) => {
  const timerRef = useRef(null)

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const handleChange = (e) => {
    if (onChange) onChange(e)

    if (debounce > 0 && search) {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        search(e.target.value)
      }, debounce)
    }
  }

  const handleClear = () => {
    if (onChange) {
      onChange({ target: { value: '' } })
    }
    if (search) search('')
  }

  const hasValue = Boolean(value)

  return (
    <div className="form-search">
      <span className="form-search__icon" aria-hidden="true">🔍</span>
      <input
        id={name}
        name={name}
        type="search"
        value={value ?? ''}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className="form__input form-search__input"
        {...rest}
      />
      {hasValue && (
        <button
          type="button"
          className="form-search__clear"
          onClick={handleClear}
          aria-label="Clear search"
          tabIndex={-1}
        >
          ✕
        </button>
      )}
    </div>
  )
}

export default FormSearch

