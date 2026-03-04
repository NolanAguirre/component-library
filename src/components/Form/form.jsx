import { useState, useEffect, useRef, Children, cloneElement } from 'react'
import createFormManager from './formManager'
import './styles.css'

/**
 * FormDisplay — pure display controller.
 *
 * Props:
 *   form  {object} — the full form state + actions produced by the Form HOC
 *   children      — expects FormField and FormSubmit as direct children;
 *                   all receive form:{ values, errors, touched, dirty,
 *                   isSubmitting, setValue, setTouched, onChange, onBlur,
 *                   validate, format, reset, submit } via cloneElement
 *
 * Intercepts the native form submit event so that pressing Enter in any
 * input also triggers form.submit().
 */
export const FormDisplay = ({ form = {}, children }) => {
  const handleSubmit = async (e) => {
    e.preventDefault()
    await form.submit?.()
  }

  const enhanced = Children.map(children, (child) =>
    cloneElement(child, { form })
  )

  return (
    <form className="form" onSubmit={handleSubmit}>
      {enhanced}
    </form>
  )
}

/**
 * FormField — a single field wrapper.
 *
 * Receives form:{ values, errors, touched, fields, onChange, onBlur } from
 * FormDisplay via cloneElement and exposes a narrower field:{} namespace to
 * its own children.
 *
 * Props:
 *   name     {string} — must match the key in the form config
 *   children          — expects FormLabel, FormInput, FormError, etc.;
 *                       all receive field:{ name, value, error, touched,
 *                       options, onChange, onBlur } via cloneElement
 */
export const FormField = ({ form = {}, name, children }) => {
  const { values = {}, errors = {}, touched = {}, fields = {}, onChange, onBlur } = form

  const field = {
    name,
    value:   values[name]  ?? '',
    error:   errors[name]  ?? null,
    touched: touched[name] ?? false,
    options: fields[name]?.options ?? [],
    onChange: (e) => onChange?.(name, e),
    onBlur:   (e) => onBlur?.(name, e),
  }

  const hasError = field.touched && field.error

  const enhanced = Children.map(children, (child) =>
    cloneElement(child, { field })
  )

  return (
    <div className={`form__field${hasError ? ' form__field--error' : ''}`}>
      {enhanced}
    </div>
  )
}

/**
 * FormLabel — a <label> bound to the field by name.
 *
 * Receives field:{ name } from FormField via cloneElement.
 */
export const FormLabel = ({ field: { name } = {}, children }) => (
  <label className="form__label" htmlFor={name}>
    {children}
  </label>
)

/**
 * FormInput — a controlled <input> bound to the field state.
 *
 * Receives field:{ name, value, onChange, onBlur } from FormField via cloneElement.
 * Any extra props (e.g. type, placeholder, autoComplete) are spread onto the <input>.
 *
 * Note: onChange and onBlur follow the native HTML attribute convention here because
 * they are mapped 1:1 onto the underlying <input> element (see action-naming exception).
 */
export const FormInput = ({ field: { name, value, onChange, onBlur } = {}, ...rest }) => (
  <input
    id={name}
    name={name}
    value={value ?? ''}
    onChange={onChange}
    onBlur={onBlur}
    className="form__input"
    {...rest}
  />
)

/**
 * FormTextarea — a controlled <textarea> bound to the field state.
 *
 * Receives field:{ name, value, onChange, onBlur } from FormField via cloneElement.
 */
export const FormTextarea = ({ field: { name, value, onChange, onBlur } = {}, ...rest }) => (
  <textarea
    id={name}
    name={name}
    value={value ?? ''}
    onChange={onChange}
    onBlur={onBlur}
    className="form__textarea"
    {...rest}
  />
)

/**
 * FormSelect — a controlled <select> driven by the field's options config.
 *
 * Receives field:{ name, value, options, onChange, onBlur } from FormField
 * via cloneElement.
 *
 * Options are sourced from the field config:
 *   options: [{ value: 'eng', displayValue: 'Engineer' }, …]
 *
 * An empty placeholder option is rendered automatically when a blank
 * defaultValue is used. Pass `placeholder` to customise its label.
 */
export const FormSelect = ({
  field: { name, value, options = [], onChange, onBlur } = {},
  placeholder = 'Select an option…',
  ...rest
}) => (
  <select
    id={name}
    name={name}
    value={value ?? ''}
    onChange={onChange}
    onBlur={onBlur}
    className="form__select"
    {...rest}
  >
    <option value="" disabled>{placeholder}</option>
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.displayValue}
      </option>
    ))}
  </select>
)

/**
 * FormError — renders the validation error for a field.
 *
 * Receives field:{ error, touched } from FormField via cloneElement.
 * Renders nothing if the field is untouched or has no error.
 */
export const FormError = ({ field: { error, touched } = {} }) => {
  if (!touched || !error) return null
  return (
    <span className="form__error" role="alert">
      {error}
    </span>
  )
}

/**
 * FormSubmit — the submit button.
 *
 * Receives form:{ isSubmitting } from FormDisplay via cloneElement.
 * Uses type="submit" so pressing Enter in any input also triggers submission.
 * Automatically disables itself while the form is submitting.
 */
export const FormSubmit = ({ form: { isSubmitting } = {}, children, ...rest }) => (
  <button
    type="submit"
    className="form__submit"
    disabled={isSubmitting}
    {...rest}
  >
    {children}
  </button>
)

/**
 * Form — state controller HOC.
 *
 * Creates a FormManager instance (once, via useRef) and bridges its
 * subscription-based state into React via useState + useEffect.
 *
 * Props:
 *   config   {object}   — form field config (see createFormManager)
 *   submit   {function} — called with formatted values on successful submission;
 *                         may be async — isSubmitting will be true while it runs
 *   children            — composed FormField / FormSubmit tree
 */
const Form = ({ config, submit, children }) => {
  const managerRef = useRef(null)

  if (!managerRef.current) {
    managerRef.current = createFormManager(config)
  }

  const [formState, setFormState] = useState(() => managerRef.current.getState())

  useEffect(() => {
    // Sync any state changes from the manager back into React
    const unsubscribe = managerRef.current.subscribe(setFormState)
    return unsubscribe
  }, [])

  const manager = managerRef.current

  const form = {
    ...formState,
    fields:        config.fields ?? {},
    setValue:      (name, value) => manager.setValue(name, value),
    setTouched:    (name)        => manager.setTouched(name),
    onChange:      (name, e)     => manager.onChange(name, e),
    onBlur:        (name, e)     => manager.onBlur(name, e),
    validate:      ()            => manager.validate(),
    format:        ()            => manager.format(),
    reset:         ()            => manager.reset(),
    submit: async () => {
      const result = manager.submit()
      if (result.success && submit) {
        manager.setIsSubmitting(true)
        await submit(result.values)
        manager.setIsSubmitting(false)
      }
      return result
    },
  }

  return (
    <FormDisplay form={form}>
      {children}
    </FormDisplay>
  )
}

export default Form

