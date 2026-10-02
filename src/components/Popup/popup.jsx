import { useEffect, useState, Children, cloneElement, isValidElement } from 'react'
import { createPortal } from 'react-dom'
import { DevScope } from '../DevInspector/devInspector'
import './styles.css'

const CloseIcon = () => (
  <svg className="popup__close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="4" y1="4" x2="20" y2="20" />
    <line x1="20" y1="4" x2="4" y2="20" />
  </svg>
)

/**
 * PopupDisplay — pure display controller.
 *
 * Expects one or two children:
 *   1. The popup content (inner panel) — receives popup:{ isOpen, open, close }
 *   2. Optional trigger element        — receives popup:{ isOpen, open, close }
 *
 * The popup panel is rendered in a backdrop overlay when isOpen is true.
 * A close button (×) is automatically injected in the top-right corner of
 * the popup panel.
 *
 * Props:
 *   isOpen         {boolean}   — whether the popup is visible
 *   open           {function}  — triggers the popup to open
 *   close          {function}  — triggers the popup to close
 *   devId          {string}    — DevScope id for the portalled panel (default: `n4p8w2k`)
 *   backdropDevId  {string}    — DevScope id for the dimmed overlay (default: `yfmw976`)
 *   closeDevId     {string}    — DevScope id for the close button (default: `i1phlai`)
 *   contentDevId   {string}    — DevScope id for the popup content (default: `8cp376n`)
 *   triggerDevId   {string}    — DevScope id for the trigger (default: `553jdpc`)
 *   children                   — [popupContent, trigger] or content only
 */
export const PopupDisplay = ({
  isOpen = false,
  open = () => {},
  close = () => {},
  devId = 'n4p8w2k',
  backdropDevId = 'yfmw976',
  closeDevId = 'i1phlai',
  contentDevId = '8cp376n',
  triggerDevId = '553jdpc',
  children,
  backdropClassName = '',
  panelClassName = '',
  contentOnly = false,
  closeOnEscape = true,
  lockScroll = false,
  showClose = true,
}) => {
  const [popupContent, trigger] = Children.toArray(children)

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

  const popup = { isOpen, open, close }
  const enhancedContent = isValidElement(popupContent)
    ? cloneElement(popupContent, { popup })
    : popupContent
  const enhancedTrigger = isValidElement(trigger)
    ? cloneElement(trigger, {
        popup,
        onClick: (e) => {
          open()
          trigger.props.onClick?.(e)
        },
      })
    : trigger

  const backdropClass = `popup__backdrop${backdropClassName ? ` ${backdropClassName}` : ''}`
  const panelClass = `popup__panel${panelClassName ? ` ${panelClassName}` : ''}`

  // Each region has its own scope. The panel scope is the popup box; the
  // backdrop scope is the leaf only while the pointer is on the dimmed overlay,
  // so that outline stays full-viewport. Scopes sit inside the portal so they
  // tag the popup DOM and link back to the caller's chain.
  const scopedContent = <DevScope id={contentDevId}>{enhancedContent}</DevScope>
  const panelState = { contentOnly: contentOnly || undefined }
  const backdrop = isOpen
    ? createPortal(
        <DevScope id={backdropDevId}>
          <div className={backdropClass} onClick={close}>
            {contentOnly ? (
              <DevScope id={devId} state={panelState}>{scopedContent}</DevScope>
            ) : (
              <DevScope id={devId} state={panelState}>
                <div className={panelClass} onClick={(e) => e.stopPropagation()}>
                  {showClose && (
                    <DevScope id={closeDevId}>
                      <button type="button" className="popup__close" onClick={close} aria-label="Close popup">
                        <CloseIcon />
                      </button>
                    </DevScope>
                  )}
                  {scopedContent}
                </div>
              </DevScope>
            )}
          </div>
        </DevScope>,
        document.body,
      )
    : null

  const scopedTrigger = enhancedTrigger != null
    ? <DevScope id={triggerDevId} state={{ open: isOpen || undefined }}>{enhancedTrigger}</DevScope>
    : enhancedTrigger

  return (
    <>
      {scopedTrigger}
      {backdrop}
    </>
  )
}

/**
 * withPopup — state controller HOC.
 *
 * Wraps a component with popup open/closed state and passes
 * isOpen, open, and close as props to the wrapped component.
 *
 * @param {React.Component} WrappedComponent
 * @param {boolean} defaultOpenValue — fallback initial open state (default: false)
 */
export const withPopup = (WrappedComponent, defaultOpenValue = false) => {
  const WithPopup = ({ defaultOpen = defaultOpenValue, ...props }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    const open = () => setIsOpen(true)
    const close = () => setIsOpen(false)

    return <WrappedComponent isOpen={isOpen} open={open} close={close} {...props} />
  }

  WithPopup.displayName = `withPopup(${WrappedComponent.displayName ?? WrappedComponent.name ?? 'Component'})`

  return WithPopup
}

/**
 * Popup — convenience default export using withPopup HOC around PopupDisplay.
 */
const Popup = withPopup(PopupDisplay)

export default Popup

