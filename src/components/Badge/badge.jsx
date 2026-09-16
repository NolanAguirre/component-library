import { resolveStyles } from '../../lib/tagColors'
import './styles.css'

/**
 * Badge — stateless status/count indicator.
 *
 * Distinct from Tag (which is a labelled, auto-colored pill for free-form
 * metadata). Badge is a small fixed-tone status chip, a numeric count bubble,
 * or a tiny dot. It can stand alone or overlay a child element (e.g. an icon).
 *
 * Props:
 *   children     {node}     — badge content (label or count); ignored when dot
 *   variant      {string}   — 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
 *   size         {string}   — 'small' | 'medium' | 'large' (default: 'large'; large is twice the small size)
 *   dot          {boolean}  — render as a small dot (no content)
 *   count        {number}   — numeric count; renders count bubble, honours max
 *   max          {number}   — cap for count display, e.g. 99 -> "99+" (default: 99)
 *   showZero     {boolean}  — render the badge when count is 0 (default: false)
 *   overlay      {node}     — element to anchor the badge to (badge sits top-right)
 *   autoColor    {boolean}  — derive a stable per-label color from the content
 *                             (same label renders the same color app-wide, like Tag)
 *   remove       {function} — when provided renders a dismiss × button
 *   addClassName {string}   — extra class names
 *   ...rest                 — spread onto the badge element
 */
const Badge = ({
  children,
  variant = 'neutral',
  size = 'large',
  dot = false,
  count,
  max = 99,
  showZero = false,
  overlay,
  autoColor = false,
  remove,
  addClassName = '',
  ...rest
}) => {
  const hasCount = typeof count === 'number'
  const hidden = hasCount && count === 0 && !showZero && !dot

  const content = dot
    ? null
    : hasCount
      ? count > max
        ? `${max}+`
        : count
      : children

  const autoStyle = autoColor && !dot ? resolveStyles(String(children)) : null

  const classes = [
    'badge',
    `badge--${variant}`,
    `badge--${size}`,
    dot && 'badge--dot',
    hasCount && 'badge--count',
    remove && 'badge--removable',
    addClassName,
  ]
    .filter(Boolean)
    .join(' ')

  const removeButton = remove && (
    <button
      className="badge__remove"
      type="button"
      onClick={remove}
      aria-label={`Remove ${content}`}
    >
      ×
    </button>
  )

  if (overlay !== undefined) {
    return (
      <span className="badge-anchor">
        {overlay}
        {!hidden && (
          <span className={`${classes} badge--overlay`} style={autoStyle || undefined} {...rest}>
            {content}
            {removeButton}
          </span>
        )}
      </span>
    )
  }

  if (hidden) {
    return null
  }

  return (
    <span className={classes} style={autoStyle || undefined} {...rest}>
      {content}
      {removeButton}
    </span>
  )
}

export default Badge
