import Tooltip from '../Tooltip/tooltip'
import './styles.css'

/**
 * Dropdown — normal click-triggered floating-content primitive.
 *
 * A thin wrapper around Tooltip with `trigger="click"`. It owns no domain
 * behavior: the first child is the trigger, the second child is the dropdown
 * content. Placement, class names, and close-on-content-click are passed
 * through to the underlying Tooltip.
 *
 * Menu-like content closes on content click by default; callers rendering
 * interactive controls can opt out with `closeOnContentClick={false}`.
 *
 * Props:
 *   placement          {string}  — one of 12 directions (default: bottom-left)
 *   closeOnContentClick{boolean} — hide after a click inside the content (default: true)
 *   className          {string}  — extra class for the wrapper
 *   contentClassName   {string}  — extra class for the content
 *   children                     — exactly two children: [trigger, content]
 */
export const Dropdown = ({
  placement = 'bottom-left',
  closeOnContentClick = true,
  className = '',
  contentClassName = '',
  children,
  ...rest
}) => (
  <Tooltip
    trigger="click"
    placement={placement}
    closeOnContentClick={closeOnContentClick}
    className={`dropdown${className ? ` ${className}` : ''}`}
    contentClassName={`dropdown__content${contentClassName ? ` ${contentClassName}` : ''}`}
    {...rest}
  >
    {children}
  </Tooltip>
)

export default Dropdown
