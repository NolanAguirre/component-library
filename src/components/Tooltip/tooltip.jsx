import { Children, cloneElement, useEffect, useRef } from 'react'
import { withPopup } from '../Popup/popup'
import './styles.css'

/**
 * TooltipDisplay — pure anchored floating primitive controller.
 *
 * Expects exactly two children:
 *   1. The trigger element — receives tooltip:{ isOpen, show, hide, toggle }
 *   2. The floating content — receives tooltip:{ isOpen, show, hide, toggle }
 *
 * The content floats near the trigger. Behavior depends on `trigger`:
 *   - `hover` (default): shows on hover/focus, non-interactive tooltip semantics.
 *   - `click`: toggles on trigger click, closes on outside click and Escape,
 *     renders interactive content without tooltip semantics.
 *
 * Props:
 *   isOpen             {boolean}  — whether the content is visible
 *   open               {function} — mapped to `show` in the tooltip namespace
 *   close              {function} — mapped to `hide` in the tooltip namespace
 *   placement          {string}   — one of 12 directions (default: top-center)
 *   trigger            {string}   — hover | click (default: hover)
 *   interactive        {boolean}  — allow pointer events on content (default: click mode)
 *   closeOnContentClick{boolean}  — hide after a click inside the content (default: false)
 *   className          {string}   — extra class for the wrapper
 *   contentClassName   {string}   — extra class for the content
 *   children                      — exactly two children: [trigger, content]
 */
export const TooltipDisplay = ({
  isOpen = false,
  open: show = () => {},
  close: hide = () => {},
  placement = 'top-center',
  trigger = 'hover',
  interactive,
  closeOnContentClick = false,
  className = '',
  contentClassName = '',
  children,
}) => {
  const wrapperRef = useRef(null)
  const [triggerChild, tooltipContent] = Children.toArray(children)

  const isClick = trigger === 'click'
  const isInteractive = interactive ?? isClick
  const toggle = () => (isOpen ? hide() : show())

  const namespace = { isOpen, show, hide, toggle }

  useEffect(() => {
    if (!isClick || !isOpen) return undefined

    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        hide()
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') hide()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isClick, isOpen, hide])

  // Only inject the tooltip namespace into component children — native DOM
  // elements cannot consume it and React would warn about the unknown attribute.
  const namespaceFor = (child) => (typeof child.type === 'string' ? {} : { tooltip: namespace })

  const enhancedTrigger = cloneElement(triggerChild, {
    ...namespaceFor(triggerChild),
    ...(isClick && {
      onClick: (event) => {
        triggerChild.props.onClick?.(event)
        toggle()
      },
    }),
  })

  const enhancedContent = cloneElement(tooltipContent, {
    ...namespaceFor(tooltipContent),
    ...(closeOnContentClick && {
      onClick: (event) => {
        tooltipContent.props.onClick?.(event)
        hide()
      },
    }),
  })

  const wrapperProps = isClick
    ? {}
    : { onMouseEnter: show, onMouseLeave: hide, onFocus: show, onBlur: hide }

  const contentClass = [
    'tooltip__content',
    `tooltip__content--${placement}`,
    isInteractive && 'tooltip__content--interactive',
    contentClassName,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={`tooltip${className ? ` ${className}` : ''}`} ref={wrapperRef} {...wrapperProps}>
      {enhancedTrigger}
      {isOpen && (
        <div className={contentClass} {...(!isClick && { role: 'tooltip' })}>
          {enhancedContent}
        </div>
      )}
    </div>
  )
}

/**
 * Tooltip — convenience default export using withPopup HOC around TooltipDisplay.
 *
 * Reuses the same open/close state controller as Popup.
 */
const Tooltip = withPopup(TooltipDisplay)
export default Tooltip
