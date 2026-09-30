import { Children, cloneElement, isValidElement, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { DevScope } from '../DevInspector/devInspector'
import './styles.css'

const VIEWPORT_MARGIN = 4

const pointFrom = (event) => {
  if (event && typeof event.clientX === 'number' && (event.clientX || event.clientY)) {
    return { x: event.clientX, y: event.clientY }
  }
  const rect = event?.target?.getBoundingClientRect?.()
  return rect ? { x: rect.left, y: rect.bottom } : { x: 0, y: 0 }
}

const enabledItems = (menu) =>
  Array.from(menu.querySelectorAll('.context-menu__item:not(:disabled)'))

const ContextMenuPanel = ({ entries, x, y, payload, close, className }) => {
  const menuRef = useRef(null)

  useLayoutEffect(() => {
    const menu = menuRef.current
    if (!menu) return
    const { width, height } = menu.getBoundingClientRect()
    const maxLeft = window.innerWidth - width - VIEWPORT_MARGIN
    const maxTop = window.innerHeight - height - VIEWPORT_MARGIN
    const left = x > maxLeft ? Math.max(VIEWPORT_MARGIN, maxLeft) : x
    const top = y > maxTop
      ? Math.max(VIEWPORT_MARGIN, y - height >= VIEWPORT_MARGIN ? y - height : maxTop)
      : y
    menu.style.left = `${left}px`
    menu.style.top = `${top}px`
  }, [x, y, entries.length])

  useEffect(() => {
    const menu = menuRef.current
    const previous = document.activeElement
    menu?.focus({ preventScroll: true })

    const handlePointerDown = (event) => {
      if (menu && !menu.contains(event.target)) close()
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') close()
    }
    const handleScroll = (event) => {
      if (menu && menu.contains(event.target)) return
      close()
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('scroll', handleScroll, true)
    window.addEventListener('blur', close)
    window.addEventListener('resize', close)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('blur', close)
      window.removeEventListener('resize', close)
      const active = document.activeElement
      const focusLeftMenu = !active || active === document.body || (menu && menu.contains(active))
      if (focusLeftMenu && previous && typeof previous.focus === 'function' && previous.isConnected) {
        previous.focus({ preventScroll: true })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const run = (entry) => {
    if (entry.disabled) return
    close()
    entry.run?.(payload)
  }

  const handleKeyDown = (event) => {
    const menu = menuRef.current
    if (!menu) return
    const items = enabledItems(menu)
    const current = items.indexOf(document.activeElement)
    const focusAt = (index) => items[index]?.focus()

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        focusAt(current < 0 ? 0 : (current + 1) % items.length)
        break
      case 'ArrowUp':
        event.preventDefault()
        focusAt(current <= 0 ? items.length - 1 : current - 1)
        break
      case 'Home':
        event.preventDefault()
        focusAt(0)
        break
      case 'End':
        event.preventDefault()
        focusAt(items.length - 1)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (current >= 0) items[current].click()
        break
      case 'Escape':
        event.preventDefault()
        event.stopPropagation()
        close()
        break
      case 'Tab':
        event.preventDefault()
        close()
        break
      default:
        break
    }
  }

  return (
    <div
      ref={menuRef}
      className={`context-menu${className ? ` ${className}` : ''}`}
      role="menu"
      tabIndex={-1}
      style={{ left: `${x}px`, top: `${y}px` }}
      onKeyDown={handleKeyDown}
      onContextMenu={(event) => event.preventDefault()}
    >
      {entries.map((entry, index) =>
        entry.separator ? (
          <div key={entry.id ?? `separator-${index}`} className="context-menu__separator" role="separator" />
        ) : (
          <button
            key={entry.id ?? index}
            type="button"
            role="menuitem"
            className={`context-menu__item${entry.danger ? ' context-menu__item--danger' : ''}`}
            disabled={Boolean(entry.disabled)}
            aria-disabled={entry.disabled ? true : undefined}
            onMouseEnter={(event) => event.currentTarget.focus({ preventScroll: true })}
            onClick={() => run(entry)}
          >
            <span className="context-menu__label">{entry.label}</span>
            {entry.shortcut && <span className="context-menu__shortcut">{entry.shortcut}</span>}
          </button>
        ),
      )}
    </div>
  )
}

/**
 * ContextMenuDisplay — pure right-click menu controller.
 *
 * Component children receive contextMenu:{ open(event, payload), close, isOpen, payload }.
 * Native DOM children do not receive the namespace; they open the menu
 * (without a payload) from their own contextmenu event instead.
 *
 * The menu is portalled to document.body at the pointer, clamped to the
 * viewport, and closes on outside pointerdown, Escape, window blur, resize,
 * scroll, and after an item runs.
 *
 * Props:
 *   items      {Array|function} — entries, or `(payload) => entries`; each entry is
 *                                 { id, label, shortcut, disabled, danger, run(payload) }
 *                                 or { separator: true }; falsy entries are skipped
 *   isOpen     {boolean}        — whether the menu is visible
 *   x, y       {number}         — viewport coordinates of the menu anchor
 *   payload    {any}            — value passed to `items` and each entry's `run`
 *   open       {function}       — `(event, payload)` opens the menu at the event position
 *   close      {function}       — closes the menu
 *   className  {string}         — extra class on the menu panel
 *   devId      {string}         — instance-root DevScope id around the children
 *   menuDevId  {string}         — DevScope id for the portalled menu (default: `uos9kc4`)
 *   children                    — target(s) receiving the contextMenu namespace
 */
export const ContextMenuDisplay = ({
  items = [],
  isOpen = false,
  x = 0,
  y = 0,
  payload,
  open = () => {},
  close = () => {},
  className = '',
  devId,
  menuDevId = 'uos9kc4',
  children,
}) => {
  const contextMenu = { open, close, isOpen, payload }
  const entries = isOpen ? (typeof items === 'function' ? items(payload) : items).filter(Boolean) : []

  const enhanced = Children.map(children, (child) => {
    if (!isValidElement(child)) return child
    if (typeof child.type === 'string') {
      return cloneElement(child, {
        onContextMenu: (event) => {
          child.props.onContextMenu?.(event)
          if (!event.defaultPrevented) open(event)
        },
      })
    }
    return cloneElement(child, { contextMenu })
  })

  const menu = isOpen && entries.length > 0
    ? createPortal(
        <DevScope id={menuDevId}>
          <ContextMenuPanel entries={entries} x={x} y={y} payload={payload} close={close} className={className} />
        </DevScope>,
        document.body,
      )
    : null

  const node = (
    <>
      {enhanced}
      {menu}
    </>
  )

  return devId ? <DevScope id={devId}>{node}</DevScope> : node
}

/**
 * withContextMenu — state controller HOC.
 *
 * Owns isOpen / x / y / payload and passes them with open and close to the
 * wrapped display.
 */
export const withContextMenu = (WrappedComponent) => {
  const WithContextMenu = (props) => {
    const [state, setState] = useState({ isOpen: false, x: 0, y: 0, payload: undefined })

    const open = (event, payload) => {
      event?.preventDefault?.()
      event?.stopPropagation?.()
      const { x, y } = pointFrom(event)
      setState({ isOpen: true, x, y, payload })
    }
    const close = () => setState((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev))

    return <WrappedComponent {...state} open={open} close={close} {...props} />
  }

  WithContextMenu.displayName = `withContextMenu(${WrappedComponent.displayName ?? WrappedComponent.name ?? 'Component'})`

  return WithContextMenu
}

const ContextMenu = withContextMenu(ContextMenuDisplay)
export default ContextMenu
