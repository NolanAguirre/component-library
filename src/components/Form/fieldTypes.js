/**
 * fieldTypes — default validate, format, onChange, and onBlur handlers
 * for each supported field type.
 *
 * Every type exposes:
 *   validate(value, fieldConfig) → string | null   (error message or null)
 *   format(value)                → any             (output-ready value)
 *   onChange(event)              → any             (raw value extracted from the event)
 *   onBlur(event)                → void
 *
 * All of these can be overridden per-field inside the form config.
 */

export const fieldTypes = {

  // ── text ────────────────────────────────────────────────
  text: {
    validate: (value, config) => {
      const str = String(value ?? '')
      if (config.required && !str.trim()) return config.requiredMessage ?? 'This field is required'
      if (config.minLength && str.length < config.minLength) return `Minimum ${config.minLength} characters required`
      if (config.maxLength && str.length > config.maxLength) return `Maximum ${config.maxLength} characters allowed`
      if (config.pattern && !config.pattern.test(str)) return config.patternMessage ?? 'Invalid format'
      return null
    },
    format: (value) => String(value ?? '').trim(),
    onChange: (e) => e.target.value,
    onBlur: () => {},
  },

  // ── email ────────────────────────────────────────────────
  email: {
    validate: (value, config) => {
      const str = String(value ?? '').trim()
      if (config.required && !str) return config.requiredMessage ?? 'Email is required'
      if (str && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) return 'Please enter a valid email address'
      return null
    },
    format: (value) => String(value ?? '').trim().toLowerCase(),
    onChange: (e) => e.target.value,
    onBlur: () => {},
  },

  // ── number ───────────────────────────────────────────────
  number: {
    validate: (value, config) => {
      const str = String(value ?? '').trim()
      if (str === '') return config.required ? (config.requiredMessage ?? 'This field is required') : null
      if (isNaN(Number(str))) return 'Please enter a valid number'
      const num = Number(str)
      if (config.min !== undefined && num < config.min) return `Minimum value is ${config.min}`
      if (config.max !== undefined && num > config.max) return `Maximum value is ${config.max}`
      return null
    },
    format: (value) => {
      const str = String(value ?? '').trim()
      return str === '' ? '' : Number(str)
    },
    onChange: (e) => e.target.value,
    onBlur: () => {},
  },

  // ── tel ──────────────────────────────────────────────────
  tel: {
    validate: (value, config) => {
      const str = String(value ?? '').trim()
      if (config.required && !str) return config.requiredMessage ?? 'Phone number is required'
      if (str && !/^\+?[\d\s\-().]{7,}$/.test(str)) return 'Please enter a valid phone number'
      return null
    },
    format: (value) => String(value ?? '').replace(/\s+/g, ' ').trim(),
    onChange: (e) => e.target.value,
    onBlur: () => {},
  },

  // ── date ─────────────────────────────────────────────────
  date: {
    validate: (value, config) => {
      if (config.required && !value) return config.requiredMessage ?? 'Date is required'
      if (value && isNaN(Date.parse(value))) return 'Please enter a valid date'
      if (config.min && value && value < config.min) return `Date must be on or after ${config.min}`
      if (config.max && value && value > config.max) return `Date must be on or before ${config.max}`
      return null
    },
    format: (value) => value ?? '',
    onChange: (e) => e.target.value,
    onBlur: () => {},
  },

  // ── checkbox ─────────────────────────────────────────────
  checkbox: {
    validate: (value, config) => {
      if (config.required && !value) return config.requiredMessage ?? 'This field must be checked'
      return null
    },
    format: (value) => Boolean(value),
    onChange: (e) => e.target.checked,
    onBlur: () => {},
  },

  // ── select ───────────────────────────────────────────────
  select: {
    validate: (value, config) => {
      if (config.required && !value) return config.requiredMessage ?? 'Please select an option'
      return null
    },
    format: (value) => value ?? '',
    onChange: (e) => e.target.value,
    onBlur: () => {},
  },

  // ── textarea ─────────────────────────────────────────────
  textarea: {
    validate: (value, config) => {
      const str = String(value ?? '')
      if (config.required && !str.trim()) return config.requiredMessage ?? 'This field is required'
      if (config.minLength && str.length < config.minLength) return `Minimum ${config.minLength} characters required`
      if (config.maxLength && str.length > config.maxLength) return `Maximum ${config.maxLength} characters allowed`
      return null
    },
    format: (value) => String(value ?? '').trim(),
    onChange: (e) => e.target.value,
    onBlur: () => {},
  },

  // ── toggle ──────────────────────────────────────────────
  toggle: {
    validate: (value, config) => {
      if (config.required && !value) return config.requiredMessage ?? 'This field must be enabled'
      return null
    },
    format: (value) => Boolean(value),
    onChange: (e) => e.target.checked ?? e.target.value,
    onBlur: () => {},
  },

  // ── phone ───────────────────────────────────────────────
  phone: {
    validate: (value, config) => {
      const str = String(value ?? '').trim()
      if (config.required && !str) return config.requiredMessage ?? 'Phone number is required'
      if (str && !/^\+?[\d\s\-().]{7,}$/.test(str)) return 'Please enter a valid phone number'
      return null
    },
    format: (value) => String(value ?? '').replace(/[^\d+]/g, ''),
    onChange: (e) => e.target.value,
    onBlur: () => {},
  },

  // ── radio ───────────────────────────────────────────────
  radio: {
    validate: (value, config) => {
      if (config.required && !value) return config.requiredMessage ?? 'Please select an option'
      return null
    },
    format: (value) => value ?? '',
    onChange: (e) => e.target.value,
    onBlur: () => {},
  },

  // ── checkboxGroup ───────────────────────────────────────
  checkboxGroup: {
    validate: (value, config) => {
      const arr = Array.isArray(value) ? value : []
      if (config.required && arr.length === 0) return config.requiredMessage ?? 'Please select at least one option'
      if (config.min !== undefined && arr.length < config.min) return `Select at least ${config.min} option(s)`
      if (config.max !== undefined && arr.length > config.max) return `Select at most ${config.max} option(s)`
      return null
    },
    format: (value) => Array.isArray(value) ? value : [],
    onChange: (e) => e.target.value,
    onBlur: () => {},
  },

  // ── range ───────────────────────────────────────────────
  range: {
    validate: (value, config) => {
      const num = Number(value)
      if (isNaN(num)) return 'Please select a value'
      if (config.min !== undefined && num < config.min) return `Minimum value is ${config.min}`
      if (config.max !== undefined && num > config.max) return `Maximum value is ${config.max}`
      return null
    },
    format: (value) => Number(value),
    onChange: (e) => e.target.value,
    onBlur: () => {},
  },

  // ── file ────────────────────────────────────────────────
  file: {
    validate: (value, config) => {
      if (config.required && !value) return config.requiredMessage ?? 'Please select a file'
      if (value instanceof File && config.maxSize && value.size > config.maxSize) {
        return `File must be smaller than ${Math.round(config.maxSize / 1024)}KB`
      }
      return null
    },
    format: (value) => value ?? null,
    onChange: (e) => e.target.files ? e.target.files[0] : e.target.value,
    onBlur: () => {},
  },

  // ── multiFile ─────────────────────────────────────────────
  multiFile: {
    validate: (value, config) => {
      const arr = Array.isArray(value) ? value : []
      if (config.required && arr.length === 0) return config.requiredMessage ?? 'Please select at least one file'
      if (config.maxFiles && arr.length > config.maxFiles) return `Maximum ${config.maxFiles} files allowed`
      return null
    },
    format: (value) => Array.isArray(value) ? value : [],
    onChange: (e) => e.target.value,
    onBlur: () => {},
  },

  // ── color ───────────────────────────────────────────────
  color: {
    validate: (value, config) => {
      const str = String(value ?? '').trim()
      if (config.required && !str) return config.requiredMessage ?? 'Please select a colour'
      if (str && !/^#[0-9a-fA-F]{6}$/.test(str)) return 'Please enter a valid hex colour'
      return null
    },
    format: (value) => String(value ?? '').toLowerCase(),
    onChange: (e) => e.target.value,
    onBlur: () => {},
  },

  // ── password ────────────────────────────────────────────
  password: {
    validate: (value, config) => {
      const str = String(value ?? '')
      if (config.required && !str) return config.requiredMessage ?? 'Password is required'
      if (config.minLength && str.length < config.minLength) return `Minimum ${config.minLength} characters required`
      if (config.pattern && !config.pattern.test(str)) return config.patternMessage ?? 'Password does not meet requirements'
      return null
    },
    format: (value) => String(value ?? ''),
    onChange: (e) => e.target.value,
    onBlur: () => {},
  },

  // ── dropdown ──────────────────────────────────────────────
  dropdown: {
    validate: (value, config) => {
      if (config.required && !value) return config.requiredMessage ?? 'Please select an option'
      return null
    },
    format: (value) => value ?? '',
    onChange: (e) => e.target.value,
    onBlur: () => {},
  },

  // ── search ──────────────────────────────────────────────
  search: {
    validate: (value, config) => {
      const str = String(value ?? '').trim()
      if (config.required && !str) return config.requiredMessage ?? 'Search term is required'
      if (config.minLength && str.length < config.minLength) return `Minimum ${config.minLength} characters required`
      return null
    },
    format: (value) => String(value ?? '').trim(),
    onChange: (e) => e.target.value,
    onBlur: () => {},
  },
}

