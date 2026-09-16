import { useState, useEffect } from 'react'
import './styles.css'

const normalize = (v) => typeof v === 'string' ? v.toLowerCase() : v

/**
 * SelectDisplay — pure display controller.
 *
 * Renders a native <select> with the current selected value.
 * Clones are not needed; props are passed directly.
 */
export const SelectDisplay = ({
  selected = '',
  options = [],
  select = () => {},
  className = '',
  ...rest
}) => (
  <select
    className={`select${className ? ` ${className}` : ''}`}
    value={selected}
    onChange={(e) => select(e.target.value)}
    {...rest}
  >
    {options.map((opt) => (
      <option key={String(normalize(opt.value) ?? 'null')} value={normalize(opt.value)}>
        {opt.displayValue ?? opt.value}
      </option>
    ))}
  </select>
)

/**
 * withSelect — state controller HOC.
 *
 * Manages selected value initialized from defaultValue.
 * Accepts `change` as the action prop (plain verb, per naming convention).
 * Syncs with external defaultValue changes (form resets, etc.).
 */
// eslint-disable-next-line react-refresh/only-export-components
export const withSelect = (WrappedComponent) => ({
  defaultValue = '',
  options = [],
  change,
  ...props
}) => {
  const [selected, setSelected] = useState(normalize(defaultValue))
  const Component = WrappedComponent

  useEffect(() => {
    setSelected(normalize(defaultValue))
  }, [defaultValue])

  const select = (value) => {
    setSelected(normalize(value))
    if (change) change(normalize(value))
  }

  return (
    <Component
      selected={selected}
      select={select}
      options={options}
      {...props}
    />
  )
}

const Select = withSelect(SelectDisplay)

export default Select
