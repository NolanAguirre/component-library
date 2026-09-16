import { useState } from 'react'
import './styles.css'

/**
 * CheckboxDisplay — pure display component.
 *
 * Can be driven by two sources of truth (multiSelect takes priority):
 *
 *   1. multiSelect namespace (injected by MultiSelectDisplay via cloneElement):
 *        multiSelect:{ isSelected, add }
 *        The checkbox derives its checked state from isSelected(id) and
 *        delegates toggling to add (which toggles: adds if absent, removes
 *        if already selected).
 *
 *   2. Own props (used when rendered standalone or inside withCheckbox):
 *        checked  {boolean}  — whether the checkbox is checked
 *        toggle   {function} — toggles the checked state
 *
 *   id    {string}  — required; the entity id used with multiSelect
 *   value {any}     — the value stored when added to multiSelect selection
 *   label {string}  — optional visible label
 */
export const CheckboxDisplay = ({
  id,
  value,
  label,
  checked = false,
  toggle = () => {},
  multiSelect: { isSelected, add } = {},
  ...rest
}) => {
  const isMultiSelect = isSelected !== undefined

  const isChecked = isMultiSelect ? isSelected(id) : checked

  const handleToggle = isMultiSelect
    ? (e) => add({ id, value }, e)
    : toggle

  return (
    <label className={`checkbox${isChecked ? ' checkbox--checked' : ''}`}>
      <input
        className="checkbox__input"
        type="checkbox"
        id={id}
        checked={isChecked}
        onChange={handleToggle}
        {...rest}
      />
      {label && <span className="checkbox__label">{label}</span>}
    </label>
  )
}

/**
 * withCheckbox — state controller HOC.
 *
 * Manages the checked boolean for a standalone checkbox.
 * Accepts an optional `defaultChecked` prop to set the initial state.
 */
const withCheckbox = (WrappedComponent) => ({ defaultChecked = false, ...props }) => {
  const [checked, setChecked] = useState(defaultChecked)

  const toggle = () => setChecked((prev) => !prev)

  return (
    <WrappedComponent
      checked={checked}
      toggle={toggle}
      {...props}
    />
  )
}

const Checkbox = withCheckbox(CheckboxDisplay)
export default Checkbox
