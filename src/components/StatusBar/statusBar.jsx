import { Children, isValidElement } from 'react'
import { DevScope } from '../DevInspector/devInspector.jsx'
import './styles.css'

const isRightAligned = (child) => isValidElement(child) && child.props.align === 'right'

/**
 * StatusBarItem — stateless status bar entry.
 *
 * Renders a <button> when `onClick` is given, otherwise a <span>. Extra
 * props are spread onto the rendered element.
 *
 * Props:
 *   align     {string}   — 'left' | 'right' (read by StatusBar for placement)
 *   title     {string}   — native tooltip
 *   onClick   {function} — makes the item an interactive button
 *   className {string}
 *   devId     {string}   — instance-root DevScope id
 *   children             — item content
 */
export const StatusBarItem = ({
  align,
  onClick,
  className,
  devId,
  children,
  ...rest
}) => {
  const classes = [
    'status-bar__item',
    onClick && 'status-bar__item--action',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const node = onClick ? (
    <button type="button" className={classes} onClick={onClick} {...rest}>
      {children}
    </button>
  ) : (
    <span className={classes} {...rest}>
      {children}
    </span>
  )

  return devId ? <DevScope id={devId}>{node}</DevScope> : node
}

/**
 * StatusBar — stateless thin bar of StatusBarItems.
 *
 * Children with align="right" are placed after a flex spacer; all others
 * stay on the left.
 *
 * Props:
 *   className {string}
 *   devId     {string} — instance-root DevScope id
 *   children           — <StatusBarItem> elements
 */
const StatusBar = ({ className, devId, children }) => {
  const items = Children.toArray(children)
  const left = items.filter((child) => !isRightAligned(child))
  const right = items.filter(isRightAligned)
  const classes = ['status-bar', className].filter(Boolean).join(' ')

  const node = (
    <div className={classes}>
      <div className="status-bar__group">{left}</div>
      <div className="status-bar__spacer" />
      <div className="status-bar__group status-bar__group--right">{right}</div>
    </div>
  )

  return devId ? <DevScope id={devId}>{node}</DevScope> : node
}

export default StatusBar
