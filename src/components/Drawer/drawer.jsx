import { useEffect, useState, Children, cloneElement, isValidElement } from 'react'
import { createPortal } from 'react-dom'
import { DevScope } from '../DevInspector/devInspector'
import './styles.css'

const CloseIcon = () => (
  <svg className="drawer__close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="4" y1="4" x2="20" y2="20" />
    <line x1="20" y1="4" x2="4" y2="20" />
  </svg>
)

/**
 * DrawerDisplay — pure display controller for an edge-anchored panel.
 *
 * Modeled on PopupDisplay but the panel slides in from a screen edge and the
 * backdrop dims the rest of the viewport.
 *
 * Expects one or two children:
 *   1. The drawer content (inner panel) — receives drawer:{ isOpen, open, close }
 *   2. Optional trigger element         — receives drawer:{ isOpen, open, close }
 *
 * Props:
 *   isOpen      {boolean}  — whether the drawer is visible
 *   open        {function} — opens the drawer
 *   close       {function} — closes the drawer
 *   placement   {string}   — 'left' | 'right' | 'top' | 'bottom' (default: 'left')
 *   closeOnEscape {boolean} — close on the Escape key (default: true)
 *   lockScroll  {boolean}  — lock body scroll while open (default: true)
 *   showClose   {boolean}  — inject a close (×) button (default: true)
 *   devId       {string}   — DevScope id for the portalled drawer (default: `m7q1c5r`)
 *   children               — [drawerContent, trigger] or content only
 */
export const DrawerDisplay = ({
  isOpen = false,
  open = () => {},
  close = () => {},
  placement = 'left',
  devId = 'm7q1c5r',
  backdropClassName = '',
  panelClassName = '',
  closeOnEscape = true,
  lockScroll = true,
  showClose = true,
  children,
}) => {
  const [drawerContent, trigger] = Children.toArray(children)

  useEffect(() => {
    if (!isOpen || !closeOnEscape) {
      return undefined
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        close()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeOnEscape, close])

  useEffect(() => {
    if (!isOpen || !lockScroll) {
      return undefined
    }

    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = overflow
    }
  }, [isOpen, lockScroll])

  const drawer = { isOpen, open, close }
  const enhancedContent = isValidElement(drawerContent)
    ? cloneElement(drawerContent, { drawer })
    : drawerContent
  const enhancedTrigger = isValidElement(trigger)
    ? cloneElement(trigger, {
        drawer,
        onClick: (e) => {
          open()
          trigger.props.onClick?.(e)
        },
      })
    : trigger

  const backdropClass = `drawer__backdrop${backdropClassName ? ` ${backdropClassName}` : ''}`
  const panelClass = `drawer__panel drawer__panel--${placement}${panelClassName ? ` ${panelClassName}` : ''}`

  // Scope the panel (not the full-viewport backdrop) so the inspector outline
  // matches the drawer, not the whole screen. The DevScope sits inside the
  // portal so it tags the drawer DOM and links back to the caller's chain.
  const overlay = isOpen
    ? createPortal(
        <div className={backdropClass} onClick={close}>
          <DevScope id={devId} state={{ placement }}>
            <div className={panelClass} onClick={(e) => e.stopPropagation()}>
              {showClose && (
                <button type="button" className="drawer__close" onClick={close} aria-label="Close drawer">
                  <CloseIcon />
                </button>
              )}
              {enhancedContent}
            </div>
          </DevScope>
        </div>,
        document.body,
      )
    : null

  return (
    <>
      {enhancedTrigger}
      {overlay}
    </>
  )
}

/**
 * withDrawer — state controller HOC.
 *
 * Wraps a component with open/closed state and passes isOpen, open and close.
 *
 * @param {React.Component} WrappedComponent
 * @param {boolean} defaultOpenValue — fallback initial open state (default: false)
 */
export const withDrawer = (WrappedComponent, defaultOpenValue = false) => {
  const WithDrawer = ({ defaultOpen = defaultOpenValue, ...props }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    const open = () => setIsOpen(true)
    const close = () => setIsOpen(false)

    return <WrappedComponent isOpen={isOpen} open={open} close={close} {...props} />
  }

  WithDrawer.displayName = `withDrawer(${WrappedComponent.displayName ?? WrappedComponent.name ?? 'Component'})`

  return WithDrawer
}

/**
 * Drawer — convenience default export using withDrawer around DrawerDisplay.
 */
const Drawer = withDrawer(DrawerDisplay)

export default Drawer
