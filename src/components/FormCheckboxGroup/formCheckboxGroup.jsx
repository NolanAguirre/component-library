import { MultiSelectDisplay } from '../MultiSelect/multiSelect'
import './styles.css'

/**
 * FormCheckboxItem — individual checkbox in a group.
 *
 * Receives multiSelect:{ isSelected, add } from MultiSelectDisplay via cloneElement.
 * Calls add({ id, value }) on click which toggles the item in/out of the selection.
 */
const FormCheckboxItem = ({ id, value, label, multiSelect: { isSelected, add } = {}, ...rest }) => {
  const checked = isSelected ? isSelected(id) : false

  const handleChange = () => {
    if (add) add({ id, value })
  }

  return (
    <label className={`form-checkbox-item${checked ? ' form-checkbox-item--checked' : ''}`}>
      <input
        type="checkbox"
        value={value}
        checked={checked}
        onChange={handleChange}
        className="form-checkbox-item__input"
        {...rest}
      />
      <span className="form-checkbox-item__indicator" />
      {label && <span className="form-checkbox-item__label">{label}</span>}
    </label>
  )
}

/**
 * FormCheckboxGroup — group of checkboxes that produce an array value for a single field.
 *
 * Receives field:{ name, value, options, onChange, onBlur } from FormField
 * via cloneElement.
 *
 * Uses MultiSelectDisplay internally with add() (which toggles) for
 * multi-selection behaviour. The field value is an array of selected option values.
 *
 * Options are sourced from the field config:
 *   options: [{ value: 'a', displayValue: 'Option A' }, …]
 */
const FormCheckboxGroup = ({ field: { name, value = [], options = [], onChange, onBlur } = {}, ...rest }) => {
  const selectedArr = Array.isArray(value) ? value : []
  const selected = selectedArr.map((v) => ({ id: v, value: v }))

  const handleAdd = (entity) => {
    const next = selectedArr.includes(entity.id)
      ? selectedArr.filter((v) => v !== entity.id)
      : [...selectedArr, entity.id]

    if (onChange) {
      onChange({ target: { value: next } })
    }
  }

  const isSelected = (id) => selectedArr.includes(id)

  return (
    <div className="form-checkbox-group" role="group" onBlur={onBlur} {...rest}>
      <MultiSelectDisplay
        selected={selected}
        add={handleAdd}
        isSelected={isSelected}
      >
        {options.map((opt) => (
          <FormCheckboxItem
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

export default FormCheckboxGroup
