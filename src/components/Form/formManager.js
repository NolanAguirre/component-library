/**
 * createFormManager — config-driven form state manager (no React).
 *
 * Accepts a config object describing each field:
 *
 *   const config = {
 *     fields: {
 *       email: {
 *         type: 'email',          // maps to a fieldTypes entry; defaults to 'text'
 *         defaultValue: '',
 *         required: true,
 *         // Optional per-field overrides — all take precedence over type defaults:
 *         validate: (value, fieldConfig) => string | null,
 *         format:   (value) => any,
 *         onChange:  (event)  => any,
 *         onBlur:   (event)  => void,
 *       },
 *     }
 *   }
 *
 * Returns a manager object with:
 *   getState()                → current snapshot of { values, errors, touched, dirty, isSubmitting }
 *   setValue(name, value)     → update a field's value (re-validates if already touched)
 *   setTouched(name)          → mark a field as touched and run its validation
 *   onChange(name, event)     → extract value via type/config handler then call setValue
 *   onBlur(name, event)       → call type/config handler then setTouched
 *   validate()                → run all validations; returns { isValid, errors }
 *   format()                  → return formatted values for all fields
 *   submit()                  → validate → format → return { success, values } or { success:false, errors }
 *   reset()                   → restore initial state
 *   setIsSubmitting(bool)     → update the isSubmitting flag
 *   subscribe(fn)             → register a state-change listener; returns an unsubscribe function
 */

import { fieldTypes } from './fieldTypes'

const createFormManager = (config) => {
  const { fields = {} } = config

  // ── Helpers ──────────────────────────────────────────────

  const _initialValues = () =>
    Object.fromEntries(
      Object.entries(fields).map(([name, field]) => [name, field.defaultValue ?? ''])
    )

  const _blank = (fill) =>
    Object.fromEntries(Object.keys(fields).map((name) => [name, fill]))

  // ── State ─────────────────────────────────────────────────

  let state = {
    values:      _initialValues(),
    errors:      _blank(null),
    touched:     _blank(false),
    dirty:       _blank(false),
    isSubmitting: false,
  }

  // ── Subscriptions ─────────────────────────────────────────

  const subscribers = new Set()

  const _notify = () => subscribers.forEach((fn) => fn(getState()))

  const subscribe = (fn) => {
    subscribers.add(fn)
    return () => subscribers.delete(fn)
  }

  // ── State snapshot (shallow copies so consumers get a stable reference) ──

  const getState = () => ({
    values:      { ...state.values },
    errors:      { ...state.errors },
    touched:     { ...state.touched },
    dirty:       { ...state.dirty },
    isSubmitting: state.isSubmitting,
  })

  // ── Type resolution ───────────────────────────────────────

  const _typeDefaults = (name) => {
    const type = (fields[name] ?? {}).type ?? 'text'
    return fieldTypes[type] ?? fieldTypes.text
  }

  // ── Per-field validation (single field) ──────────────────

  const _validateField = (name, value) => {
    const fieldConfig   = fields[name] ?? {}
    const typeDefaults  = _typeDefaults(name)
    const validateFn    = fieldConfig.validate ?? typeDefaults.validate
    return validateFn ? validateFn(value, fieldConfig) : null
  }

  // ── Public API ────────────────────────────────────────────

  const setValue = (name, value) => {
    const errors = state.touched[name]
      ? { ...state.errors, [name]: _validateField(name, value) }
      : state.errors

    state = {
      ...state,
      values: { ...state.values, [name]: value },
      dirty:  { ...state.dirty,  [name]: true },
      errors,
    }
    _notify()
  }

  const setTouched = (name) => {
    const error = _validateField(name, state.values[name])
    state = {
      ...state,
      touched: { ...state.touched, [name]: true },
      errors:  { ...state.errors,  [name]: error },
    }
    _notify()
  }

  const onChange = (name, e) => {
    const fieldConfig  = fields[name] ?? {}
    const typeDefaults = _typeDefaults(name)
    const onChangeFn   = fieldConfig.onChange ?? typeDefaults.onChange
    const value        = onChangeFn ? onChangeFn(e) : e.target.value
    setValue(name, value)
  }

  const onBlur = (name, e) => {
    const fieldConfig  = fields[name] ?? {}
    const typeDefaults = _typeDefaults(name)
    const onBlurFn     = fieldConfig.onBlur ?? typeDefaults.onBlur
    if (onBlurFn) onBlurFn(e)
    setTouched(name)
  }

  /**
   * validate — runs all field validators, marks every field as touched,
   * and returns { isValid, errors }.
   */
  const validate = () => {
    const errors = {}
    let isValid  = true

    Object.keys(fields).forEach((name) => {
      const error    = _validateField(name, state.values[name])
      errors[name]   = error
      if (error) isValid = false
    })

    state = {
      ...state,
      errors,
      touched: _blank(true),
    }
    _notify()
    return { isValid, errors }
  }

  /**
   * format — runs the format function for every field and returns
   * the resulting { [name]: formattedValue } map.
   */
  const format = () =>
    Object.fromEntries(
      Object.entries(fields).map(([name, fieldConfig]) => {
        const typeDefaults = _typeDefaults(name)
        const formatFn     = fieldConfig.format ?? typeDefaults.format
        const formatted    = formatFn ? formatFn(state.values[name]) : state.values[name]
        return [name, formatted]
      })
    )

  /**
   * submit — validates → formats → returns result.
   *
   * On failure: { success: false, errors }
   * On success: { success: true,  values }   ← values are formatted
   *
   * Fields that are not required and have no value set by the user are
   * omitted from the returned values object entirely.
   */
  const submit = () => {
    const { isValid, errors } = validate()
    if (!isValid) return { success: false, errors }

    const formatted = format()
    const values = Object.fromEntries(
      Object.entries(formatted).filter(([name, value]) => {
        const fieldConfig = fields[name] ?? {}
        if (fieldConfig.required) return true
        return value !== '' && value !== null && value !== undefined && value !== false
      })
    )

    return { success: true, values }
  }

  const reset = () => {
    state = {
      values:      _initialValues(),
      errors:      _blank(null),
      touched:     _blank(false),
      dirty:       _blank(false),
      isSubmitting: false,
    }
    _notify()
  }

  const setIsSubmitting = (value) => {
    state = { ...state, isSubmitting: Boolean(value) }
    _notify()
  }

  return {
    getState,
    setValue,
    setTouched,
    onChange,
    onBlur,
    validate,
    format,
    submit,
    reset,
    setIsSubmitting,
    subscribe,
  }
}

export default createFormManager

