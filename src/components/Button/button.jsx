import { DevScope } from '../DevInspector/devInspector.jsx'
import './styles.css'

/**
 * Button — stateless display component.
 *
 * Renders a <button> with BEM variants. All extra props (onClick, type, etc.)
 * are spread directly onto the native <button> element.
 *
 * Props:
 *   variant   {string}  — 'primary' | 'secondary' | 'danger' | 'ghost' (default: 'primary')
 *   size      {string}  — 'sm' | 'lg' (default: undefined / normal)
 *   loading   {boolean} — shows a spinner and disables the button
 *   disabled  {boolean} — native disabled state
 *   devId     {string}  — instance-root DevScope id
 *   children            — button label content
 *   ...rest             — spread onto the native <button>
 */
const Button = ({
  variant = 'primary',
  size,
  loading = false,
  disabled = false,
  children,
  devId,
  ...rest
}) => {
  const classes = [
    'button',
    `button--${variant}`,
    size && `button--${size}`,
    loading && 'button--loading',
  ]
    .filter(Boolean)
    .join(' ')

  const node = (
    <button
      className={classes}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <span className="button__spinner" aria-hidden="true" />}
      <span className={`button__label${loading ? ' button__label--hidden' : ''}`}>
        {children}
      </span>
    </button>
  )

  return devId ? <DevScope id={devId}>{node}</DevScope> : node
}

export default Button

