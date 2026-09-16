import './styles.css'

/**
 * Skeleton — stateless loading placeholder with a shimmer animation.
 *
 * Use while content is loading to reserve layout space. Supports a handful of
 * common shapes and an optional `count` to repeat the placeholder.
 *
 * Props:
 *   shape        {string}  — 'text' | 'row' | 'card' | 'media' | 'circle' (default: 'text')
 *   count        {number}  — number of placeholders to render (default: 1)
 *   width        {string}  — explicit width (e.g. '50%', '4rem')
 *   height       {string}  — explicit height
 *   addClassName {string}  — extra class names
 *   ...rest                — spread onto each placeholder element
 */
const Skeleton = ({
  shape = 'text',
  count = 1,
  width,
  height,
  addClassName = '',
  ...rest
}) => {
  const classes = ['skeleton', `skeleton--${shape}`, addClassName]
    .filter(Boolean)
    .join(' ')

  const style = {}
  if (width) style.width = width
  if (height) style.height = height

  const items = Array.from({ length: Math.max(1, count) }, (_, index) => (
    <span
      key={index}
      className={classes}
      style={style}
      aria-hidden="true"
      {...rest}
    />
  ))

  if (count > 1) {
    return <span className="skeleton-group">{items}</span>
  }

  return items[0]
}

export default Skeleton
