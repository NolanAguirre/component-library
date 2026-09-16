import { useState, useEffect, useRef, Children, cloneElement, useCallback } from 'react'
import './styles.css'

let nextId = 0

const CloseIcon = () => (
  <svg className="toast__close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="4" y1="4" x2="20" y2="20" />
    <line x1="20" y1="4" x2="4" y2="20" />
  </svg>
)

const typeIcons = {
  success: () => (
    <svg className="toast__type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: () => (
    <svg className="toast__type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  warning: () => (
    <svg className="toast__type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: () => (
    <svg className="toast__type-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
}

/**
 * ToastItem — single toast message with auto-dismiss timer and close button.
 *
 * Props:
 *   id        {number|string} — unique identifier for this toast
 *   message   {string}        — the toast message text
 *   type      {string}        — one of: success, error, warning, info
 *   duration  {number}        — auto-dismiss time in ms (0 = no auto-dismiss)
 *   remove    {function}      — action to remove this toast by id
 */
export const ToastItem = ({ id, message, type = 'info', duration = 4000, remove = () => {} }) => {
  const timerRef = useRef(null)

  useEffect(() => {
    if (duration > 0) {
      timerRef.current = setTimeout(() => remove(id), duration)
    }
    return () => clearTimeout(timerRef.current)
  }, [id, duration, remove])

  const TypeIcon = typeIcons[type] || typeIcons.info

  return (
    <div className={`toast__item toast__item--${type}`} role="alert">
      <span className="toast__icon">
        <TypeIcon />
      </span>
      <span className="toast__message">{message}</span>
      <button
        className="toast__close"
        onClick={() => remove(id)}
        aria-label="Dismiss notification"
      >
        <CloseIcon />
      </button>
      {duration > 0 && (
        <span
          className="toast__timer"
          style={{ animationDuration: `${duration}ms` }}
        />
      )}
    </div>
  )
}

/**
 * ToastDisplay — pure display controller.
 *
 * Renders toast items in a fixed-position container and clones children
 * with the toast:{ add, remove, items } namespace so any child can
 * trigger notifications.
 *
 * Props:
 *   items    {Array}    — array of { id, message, type, duration }
 *   add      {function} — action to add a toast: add({ message, type, duration })
 *   remove   {function} — action to remove a toast by id
 *   children            — receives toast:{ add, remove, items } via cloneElement
 */
export const ToastDisplay = ({ items = [], add = () => {}, remove = () => {}, children }) => {
  const enhanced = Children.map(children, (child) =>
    cloneElement(child, { toast: { add, remove, items } })
  )

  return (
    <>
      {enhanced}
      <div className="toast" aria-live="polite" aria-label="Notifications">
        {items.map((item) => (
          <ToastItem
            key={item.id}
            id={item.id}
            message={item.message}
            type={item.type}
            duration={item.duration}
            remove={remove}
          />
        ))}
      </div>
    </>
  )
}

/**
 * withToast — state controller HOC.
 *
 * Manages a queue of toast items { id, message, type, duration } and
 * provides add/remove actions to the wrapped display component.
 *
 * @param {React.Component} WrappedComponent
 */
export const withToast = (WrappedComponent) => {
  const WithToast = (props) => {
    const [items, setItems] = useState([])

    const remove = useCallback((id) => {
      setItems((prev) => prev.filter((item) => item.id !== id))
    }, [])

    const add = useCallback(({ message, type = 'info', duration = 4000 } = {}) => {
      const id = ++nextId
      setItems((prev) => [...prev, { id, message, type, duration }])
      return id
    }, [])

    return <WrappedComponent {...props} items={items} add={add} remove={remove} />
  }

  WithToast.displayName = `withToast(${WrappedComponent.displayName ?? WrappedComponent.name ?? 'Component'})`

  return WithToast
}

const Toast = withToast(ToastDisplay)
export default Toast

