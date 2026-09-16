import { MultiSelectDisplay } from '../MultiSelect/multiSelect'
import './styles.css'

/**
 * FormRadio — individual radio button.
 *
 * Receives multiSelect:{ isSelected, set } from MultiSelectDisplay via cloneElement.
 * Calls set([{ id, value }]) on click to replace the selection with a single item.
 */
export const FormRadio = ({ id, value, label, multiSelect: { isSelected, set } = {}, ...rest }) => {
  const checked = isSelected ? isSelected(id) : false

  const handleChange = () => {
    if (set) set([{ id, value }])
  }

  return (
    <label className={`form-radio${checked ? ' form-radio--checked' : ''}`}>
      <input
        type="radio"
        name={id}
        value={value}
        checked={checked}
        onChange={handleChange}
        className="form-radio__input"
        {...rest}
      />
      <span className="form-radio__indicator" />
      {label && <span className="form-radio__label">{label}</span>}
    </label>
  )
}

/**
 * FormRadioGroup — radio button group bound to a single field value.
 *
 * Receives field:{ name, value, options, onChange, onBlur } from FormField
 * via cloneElement.
 *
 * Uses MultiSelectDisplay internally with set() for single-selection behaviour.
 * When a radio is selected, the field value is updated to that option's value.
 *
 * Options are sourced from the field config:
 *   options: [{ value: 'a', displayValue: 'Option A' }, …]
 */
const FormRadioGroup = ({ field: { name, value, options = [], onChange, onBlur } = {}, ...rest }) => {
  const selected = value ? [{ id: value, value }] : []

  const handleSet = (entities) => {
    const next = entities[0]?.value ?? ''
    if (onChange) {
      onChange({ target: { value: next } })
    }
  }

  const isSelected = (id) => id === value

  return (
    <div className="form-radio-group" role="radiogroup" onBlur={onBlur} {...rest}>
      <MultiSelectDisplay
        selected={selected}
        set={handleSet}
        isSelected={isSelected}
      >
        {options.map((opt) => (
          <FormRadio
            key={opt.value}
            id={opt.value}
            value={opt.value}
            label={opt.displayValue}
          />
        ))}
      </MultiSelectDisplay>
    </div>
  )
}

export default FormRadioGroup
