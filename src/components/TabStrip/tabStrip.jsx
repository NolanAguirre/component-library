import { useCallback, useEffect, useRef } from 'react'
import { DevScope } from '../DevInspector/devInspector.jsx'
import './styles.css'

const scrollIntoStrip = (strip, tab) => {
  const left = tab.offsetLeft
  const right = left + tab.offsetWidth
  if (left < strip.scrollLeft) strip.scrollLeft = left
  else if (right > strip.scrollLeft + strip.clientWidth) strip.scrollLeft = right - strip.clientWidth
}

const handleWheel = (event) => {
  const strip = event.currentTarget
  if (strip.scrollWidth <= strip.clientWidth) return
  const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
  if (!delta) return
  event.preventDefault()
  strip.scrollLeft += delta
}

/**
 * TabStrip — stateless, controlled, id-keyed editor tabs.
 *
 * Horizontally scrolling row of tabs (the wheel scrolls sideways). The active
 * tab is scrolled into view when it changes. Dirty tabs show a dot in place
 * of the close button until hovered. Middle-click closes a tab.
 *
 * Props:
 *   items     {object[]} — [{ id, label, title, dirty, icon }]
 *   activeId  {string}   — id of the active tab
 *   select    {function} — (id) activates a tab
 *   close     {function} — (id) closes a tab; omit to hide close buttons
 *   className {string}
 *   devId     {string}   — instance-root DevScope id
 */
const TabStrip = ({
  items = [],
  activeId,
  select = () => {},
  close,
  className,
  devId,
}) => {
  const stripRef = useRef(null)

  const setStrip = useCallback((node) => {
    if (stripRef.current === node) return
    stripRef.current?.removeEventListener('wheel', handleWheel)
    stripRef.current = node
    node?.addEventListener('wheel', handleWheel, { passive: false })
  }, [])

  useEffect(() => {
    const strip = stripRef.current
    if (!strip || activeId == null) return
    const tab = strip.querySelector('.tab-strip__tab--active')
    if (tab) scrollIntoStrip(strip, tab)
  }, [activeId, items.length])

  const focusTab = (index) => {
    const tabs = stripRef.current?.querySelectorAll('.tab-strip__tab')
    tabs?.[index]?.focus()
  }

  const handleKeyDown = (event, index) => {
    const item = items[index]
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      select(item.id)
      return
    }
    if (event.key === 'Delete' && close) {
      event.preventDefault()
      close(item.id)
      return
    }
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!step || items.length === 0) return
    event.preventDefault()
    const next = (index + step + items.length) % items.length
    select(items[next].id)
    focusTab(next)
  }

  const classes = ['tab-strip', className].filter(Boolean).join(' ')

  const node = (
    <div ref={setStrip} className={classes} role="tablist">
      {items.map((item, index) => {
        const isActive = item.id === activeId
        const tabClasses = [
          'tab-strip__tab',
          isActive && 'tab-strip__tab--active',
          item.dirty && 'tab-strip__tab--dirty',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <DevScope key={item.id} id="tpbx9h6" state={{ tab: item.id, active: isActive, dirty: Boolean(item.dirty) }}>
            <div
              className={tabClasses}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              title={item.title ?? (typeof item.label === 'string' ? item.label : undefined)}
              onClick={() => select(item.id)}
              onMouseDown={(event) => {
                if (event.button === 1) event.preventDefault()
              }}
              onAuxClick={(event) => {
                if (event.button !== 1 || !close) return
                event.preventDefault()
                close(item.id)
              }}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              {item.icon && <span className="tab-strip__icon" aria-hidden="true">{item.icon}</span>}
              <span className="tab-strip__label">{item.label}</span>
              {close ? (
                <button
                  type="button"
                  className="tab-strip__close"
                  tabIndex={-1}
                  aria-label={`Close ${typeof item.label === 'string' ? item.label : 'tab'}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    close(item.id)
                  }}
                >
                  <span className="tab-strip__close-dot" aria-hidden="true" />
                  <span className="tab-strip__close-x" aria-hidden="true">×</span>
                </button>
              ) : (
                item.dirty && <span className="tab-strip__dirty" aria-hidden="true" />
              )}
            </div>
          </DevScope>
        )
      })}
    </div>
  )

  return devId ? <DevScope id={devId} state={{ activeId: activeId ?? null, count: items.length }}>{node}</DevScope> : node
}

export default TabStrip
