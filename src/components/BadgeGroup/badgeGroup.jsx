import { Children, cloneElement, isValidElement } from 'react'
import './styles.css'

/**
 * BadgeGroup — generic layout wrapper for a set of Badge children.
 *
 * Renders an optional label heading above a flex-wrap container of Badges.
 * The size prop is cloned onto each Badge child so the whole group stays
 * visually consistent, and it also drives the gap between badges.
 *
 * Props:
 *   label        {node}     — optional heading rendered above the badges
 *   size         {string}   — 'small' | 'large' (default 'small'); passed to Badge children
 *   addClassName {string}   — extra class names on the root
 *   children     {node}     — Badge elements
 */
const BadgeGroup = ({ label, size = 'small', addClassName = '', children }) => {
  const classes = ['badge-group', `badge-group--${size}`, addClassName].filter(Boolean).join(' ')

  const sizedChildren = Children.map(children, (child) =>
    isValidElement(child) ? cloneElement(child, { size }) : child
  )

  return (
    <div className={classes}>
      {label && <div className="badge-group__label">{label}</div>}
      <div className="badge-group__items">{sizedChildren}</div>
    </div>
  )
}

export default BadgeGroup
