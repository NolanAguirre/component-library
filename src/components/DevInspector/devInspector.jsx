import { Children, cloneElement, createContext, isValidElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import GenericForm from '../GenericForm/genericForm'
import './styles.css'

/**
 * DevInspector / DevScope — dev-only component tree tagging.
 *
 * `DevScope` wraps a subtree with a unique static `id` and optional `state`.
 * When the inspector is active it stamps `data-dev-id` / `data-dev-state` onto
 * a single host-element child so the tagged node has a real box to hit. If the
 * child is not a single DOM element, it falls back to a `display: contents`
 * wrapper. When the inspector is off it returns `children` untouched.
 *
 * `DevInspector` is mounted once per app. It keeps a docked panel in the
 * bottom-right corner (a small square when collapsed). The panel and outline
 * update while the modifier key is held, or while Dev is latched from the
 * expanded panel (for pointer devices without a modifier key). Releasing the
 * modifier freezes the last scope so the pointer can move to copy. Copy
 * writes `##` plus the leaf `data-dev-id` (the innermost scope), not the chain.
 */

const MAX_STATE_STRING = 40
const BADGE_OFFSET_PX = 16
const COPIED_MS = 900
const POSITION_KEY = 'dev-inspector-position'
const PANEL_MARGIN = 12
const TOGGLE_SIZE = 28

// Each scope div carries a ref to its React parent scope div so the chain
// survives portals, where the DOM ancestry stops at document.body. That only
// helps once a scope exists inside the portal, so components that portal
// (Popup, Drawer, ...) wrap their portalled root in a DevScope.
const SCOPE_PARENT = '__devScopeParent'

const DevInspectorContext = createContext({
  active: false,
  parentId: null,
  parentNodeRef: null,
  register: () => {},
  unregister: () => {},
})

const isHostElement = (node) => isValidElement(node) && typeof node.type === 'string'

const assignRef = (ref, node) => {
  if (!ref) return
  if (typeof ref === 'function') ref(node)
  else ref.current = node
}

const serializeValue = (value) => {
  if (typeof value === 'string') {
    return value.length > MAX_STATE_STRING ? `${value.slice(0, MAX_STATE_STRING)}...` : value
  }
  if (typeof value === 'number' || typeof value === 'bigint') return String(value)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (value === null) return 'null'
  return undefined
}

const serializeState = (state) => {
  if (!state || typeof state !== 'object') return ''
  const parts = []
  Object.keys(state).forEach((key) => {
    const value = state[key]
    if (value === undefined) return
    if (value === true) {
      parts.push(key)
      return
    }
    const serialized = serializeValue(value)
    if (serialized === undefined) return
    parts.push(`${key}=${serialized}`)
  })
  return parts.join(' ')
}

/**
 * useDevScope — `{ active, id }` of the nearest enclosing scope.
 */
export const useDevScope = () => {
  const { active, parentId } = useContext(DevInspectorContext)
  return { active, id: parentId }
}

/**
 * DevScope
 *
 * Props:
 *   id       {string}  — unique static id (used as-is)
 *   state    {object}  — primitive discriminators (mode flags, active ids, active tab)
 *   children
 */
export const DevScope = ({ id, state, children }) => {
  const parent = useContext(DevInspectorContext)
  const { active, parentId, parentNodeRef, register, unregister } = parent
  const resolvedId = typeof id === 'string' && id.length > 0 ? id : null
  const nodeRef = useRef(null)

  useEffect(() => {
    if (!active || !resolvedId) return undefined
    register(resolvedId)
    return () => unregister(resolvedId)
  }, [active, resolvedId, register, unregister])

  const setNode = useCallback(
    (node) => {
      nodeRef.current = node
      if (node) node[SCOPE_PARENT] = parentNodeRef
    },
    [parentNodeRef],
  )

  const value = useMemo(
    () => ({
      active,
      parentId: resolvedId ?? parentId,
      parentNodeRef: resolvedId ? nodeRef : parentNodeRef,
      register,
      unregister,
    }),
    [active, resolvedId, parentId, parentNodeRef, register, unregister],
  )

  if (!active) return children

  const serializedState = serializeState(state)
  const childArray = Children.toArray(children)
  const hostChild = childArray.length === 1 && isHostElement(childArray[0]) ? childArray[0] : null
  const scopeProps = {
    'data-dev-id': resolvedId ?? undefined,
    'data-dev-state': serializedState || undefined
  }

  return (
    <DevInspectorContext.Provider value={value}>
      {hostChild ? (
        cloneElement(hostChild, {
          ...scopeProps,
          ref: (node) => {
            setNode(node)
            assignRef(hostChild.ref ?? hostChild.props.ref, node)
          }
        })
      ) : (
        <div
          ref={setNode}
          className="dev-scope"
          style={{ display: 'contents' }}
          {...scopeProps}
        >
          {children}
        </div>
      )}
    </DevInspectorContext.Provider>
  )
}

const parentScopeOf = (element) => {
  const ref = element[SCOPE_PARENT]
  const viaReact = ref ? ref.current : null
  if (viaReact) return viaReact
  return element.parentElement ? element.parentElement.closest('[data-dev-id]') : null
}

const segmentsFor = (element) => {
  const segments = []
  const seen = new Set()
  let current = element instanceof Element ? element.closest('[data-dev-id]') : null
  while (current && !seen.has(current)) {
    seen.add(current)
    segments.unshift({
      id: current.getAttribute('data-dev-id'),
      state: current.getAttribute('data-dev-state') || '',
    })
    current = parentScopeOf(current)
  }
  return segments
}

const formatSegment = ({ id, state }) => (state ? `${id}[${state}]` : id)

const copyToken = (id) => (id ? `##${id}` : '')

const describeElement = (element) => {
  const segments = segmentsFor(element)
  const route = typeof window !== 'undefined' ? window.location.pathname : ''
  const path = segments.map(formatSegment).join(' / ')
  const leaf = copyToken(segments.length ? segments[segments.length - 1].id : '')
  return {
    route,
    segments,
    leaf,
    text: path ? `${route} | ${path}` : route,
  }
}

/* A `display: contents` scope has no box of its own, so fall back to the
   union of the boxes its children paint. */
const boundsFor = (element) => {
  const rect = element.getBoundingClientRect()
  if (rect.width || rect.height) return rect
  let box = null
  Array.prototype.forEach.call(element.children, (child) => {
    const childRect = boundsFor(child)
    if (!childRect.width && !childRect.height) return
    box = box
      ? {
          left: Math.min(box.left, childRect.left),
          top: Math.min(box.top, childRect.top),
          right: Math.max(box.right, childRect.right),
          bottom: Math.max(box.bottom, childRect.bottom),
        }
      : { left: childRect.left, top: childRect.top, right: childRect.right, bottom: childRect.bottom }
  })
  if (!box) return rect
  return { ...box, width: box.right - box.left, height: box.bottom - box.top }
}

/* Paint order already answers what is under the cursor: the first hit is the
   topmost element and its nearest scope ancestor is the tightest wrap, which
   also keeps portalled overlays ahead of the page behind them. Box area does
   not rank nesting — a scroll container clips to the viewport while the content
   scrolling inside it does not, so a tall card outgrows the page that holds it. */
const scopeAtPoint = (hits) => {
  let scoped = null
  hits.some((el) => {
    if (typeof el.closest !== 'function' || el.closest('.dev-inspector')) return false
    scoped = el.closest('[data-dev-id]')
    return Boolean(scoped)
  })
  return scoped
}

/* navigator.clipboard is undefined outside a secure context (plain http on a
   LAN host), so keep the selection-based path around. */
const copyViaSelection = (text) => {
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.className = 'dev-inspector__clipboard'
  document.body.appendChild(area)
  area.select()
  const copied = typeof document.execCommand === 'function' && document.execCommand('copy')
  document.body.removeChild(area)
  return copied ? Promise.resolve() : Promise.reject(new Error('clipboard unavailable'))
}

const copyText = (text) => {
  if (!text) return Promise.reject(new Error('nothing to copy'))
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).catch(() => copyViaSelection(text))
  }
  return copyViaSelection(text)
}

const MODIFIER_FLAGS = {
  Alt: 'altKey',
  Control: 'ctrlKey',
  Shift: 'shiftKey',
  Meta: 'metaKey',
}

const modifierHeld = (event, modifier) => Boolean(event[MODIFIER_FLAGS[modifier]])

const isModifierEvent = (event, modifier) => event.key === modifier || modifierHeld(event, modifier)

const CopyIcon = () => (
  <svg className="dev-inspector__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </svg>
)

const PinIcon = () => (
  <svg className="dev-inspector__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3h6l-1 6 4 3v2H6v-2l4-3z" />
    <line x1="12" y1="14" x2="12" y2="21" />
  </svg>
)

const ChevronIcon = ({ up }) => (
  <svg className="dev-inspector__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points={up ? '6 15 12 9 18 15' : '6 9 12 15 18 9'} />
  </svg>
)

const MoveIcon = () => (
  <svg className="dev-inspector__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="5 9 2 12 5 15" />
    <polyline points="9 5 12 2 15 5" />
    <polyline points="15 19 12 22 9 19" />
    <polyline points="19 9 22 12 19 15" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="12" y1="2" x2="12" y2="22" />
  </svg>
)

const clampPanelPosition = (position, width, height) => {
  const w = Math.max(TOGGLE_SIZE, width || 224)
  const h = Math.max(TOGGLE_SIZE, height || TOGGLE_SIZE)
  return {
    left: Math.min(Math.max(position.left, PANEL_MARGIN), window.innerWidth - w - PANEL_MARGIN),
    top: Math.min(Math.max(position.top, PANEL_MARGIN), window.innerHeight - h - PANEL_MARGIN),
    width: w,
    height: h,
  }
}

const loadPanelPosition = () => {
  try {
    const raw = localStorage.getItem(POSITION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (![parsed.left, parsed.top].every(Number.isFinite)) return null
    return clampPanelPosition(parsed, parsed.width, parsed.height)
  } catch {
    return null
  }
}

const savePanelPosition = (position) => {
  localStorage.setItem(POSITION_KEY, JSON.stringify(position))
}

const panelStyle = (position) => {
  if (!position) return undefined
  return {
    left: `${position.left}px`,
    top: `${position.top}px`,
    maxHeight: `calc(100dvh - ${Math.max(PANEL_MARGIN, position.top) + PANEL_MARGIN}px)`,
    right: 'auto',
    bottom: 'auto',
  }
}

const toggleStyle = (position) => {
  if (!position) return undefined
  return {
    left: `${position.left + Math.max(position.width, TOGGLE_SIZE) - TOGGLE_SIZE}px`,
    top: `${position.top + Math.max(position.height, TOGGLE_SIZE) - TOGGLE_SIZE}px`,
    right: 'auto',
    bottom: 'auto',
  }
}

const DevInspectorPanel = ({
  forms,
  activeFormId,
  onSelectForm,
  descriptor,
  pinned,
  collapsed,
  latched,
  copied,
  dragging,
  position,
  modifier,
  onCopy,
  onTogglePin,
  onToggleLatch,
  onToggleCollapse,
  onMoveStart,
}) => {
  const segments = descriptor ? descriptor.segments : []
  const activeForm = forms.find(form => form.id === activeFormId)
  const View = activeForm?.view

  if (collapsed) {
    return (
      <button
        type="button"
        className="dev-inspector__toggle"
        style={toggleStyle(position)}
        onClick={onToggleCollapse}
        title="Expand"
        aria-label="Expand panel"
      >
        <ChevronIcon up />
      </button>
    )
  }

  return (
    <div className={`dev-inspector__panel${dragging ? ' dev-inspector__panel--dragging' : ''}`} style={panelStyle(position)}>
      <div className="dev-inspector__panel-header">
        <button
          type="button"
          className="dev-inspector__action dev-inspector__action--move"
          onPointerDown={onMoveStart}
          title="Move"
          aria-label="Move panel"
        >
          <MoveIcon />
        </button>
        {forms.map(form => (
          <button key={form.id} type="button" className="dev-inspector__action"
            title={form.title ?? form.id} aria-label={form.title ?? form.id}
            aria-pressed={activeFormId === form.id}
            onClick={() => onSelectForm(activeFormId === form.id ? null : form.id)}>
            {form.icon ?? 'ƒ'}
          </button>
        ))}
        <span className="dev-inspector__panel-title">{copied ? 'copied' : 'dev inspector'}</span>
        <button
          type="button"
          className={`dev-inspector__action dev-inspector__action--label${latched ? ' dev-inspector__action--on' : ''}`}
          onClick={onToggleLatch}
          title={`Inspect without holding ${modifier}`}
          aria-label="Inspect without a modifier key"
          aria-pressed={latched}
        >
          Dev
        </button>
        <button
          type="button"
          className={`dev-inspector__action${pinned ? ' dev-inspector__action--on' : ''}`}
          onClick={onTogglePin}
          title="Pin the current scope (or hold the modifier and click the page)"
          aria-label="Pin scope"
        >
          <PinIcon />
        </button>
        <button
          type="button"
          className="dev-inspector__action"
          onClick={onCopy}
          title="Copy leaf id"
          aria-label="Copy leaf id"
        >
          <CopyIcon />
        </button>
        <button
          type="button"
          className="dev-inspector__action"
          onClick={onToggleCollapse}
          title="Collapse"
          aria-label="Collapse panel"
        >
          <ChevronIcon />
        </button>
      </div>
      <div className={`dev-inspector__panel-body${activeForm ? ' dev-inspector__panel-body--form' : ''}`}>
        {View ? <View key={activeForm.id} {...activeForm.props} inspector={{ descriptor, close: () => onSelectForm(null) }} /> : activeForm ? <GenericForm key={activeForm.id} {...activeForm} /> : segments.length === 0 ? (
          <span className="dev-inspector__empty">
            {latched ? 'tap a scope' : `hold ${modifier} or tap Dev`}
          </span>
        ) : (
          <>
            <span className="dev-inspector__route">{descriptor.route}</span>
            {segments.map((segment, index) => (
              <span className="dev-inspector__segment" key={`${segment.id}-${index}`}>
                {segment.id}
                {segment.state && <span className="dev-inspector__state">[{segment.state}]</span>}
              </span>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

const isInspectorChrome = (element) =>
  typeof element.closest === 'function' && element.closest('.dev-inspector__panel, .dev-inspector__toggle')

const DevInspectorOverlay = ({ modifier, panel, forms }) => {
  const [activeFormId, setActiveFormId] = useState(null)
  const [held, setHeld] = useState(false)
  const [latched, setLatched] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [pointer, setPointer] = useState({ x: 0, y: 0 })
  const [target, setTarget] = useState(null)
  const [copied, setCopied] = useState(false)
  const [position, setPosition] = useState(loadPanelPosition)
  const [dragging, setDragging] = useState(false)
  const inspectingRef = useRef(false)
  const pinnedRef = useRef(false)
  const latchedRef = useRef(false)
  const pointerRef = useRef({ x: 0, y: 0 })
  const copiedTimer = useRef(null)
  const positionRef = useRef(position)
  const dragRef = useRef(null)
  positionRef.current = position

  const inspecting = held || latched

  useEffect(() => {
    inspectingRef.current = inspecting
    pinnedRef.current = pinned
    latchedRef.current = latched
  }, [inspecting, pinned, latched])

  const updateTarget = useCallback((x, y) => {
    const hits = document.elementsFromPoint(x, y)
    // The overlay root is a full-viewport layer. Ignore it and the outline so
    // a full-screen highlight cannot steal the next hover. Only freeze when
    // the pointer is actually over the docked panel.
    if (hits.some(isInspectorChrome)) {
      return
    }
    const scoped = scopeAtPoint(hits)
    if (!scoped) {
      setTarget(null)
      return
    }
    const descriptor = describeElement(scoped)
    setTarget((current) =>
      current && current.element === scoped && current.descriptor.text === descriptor.text
        ? current
        : { element: scoped, descriptor },
    )
  }, [])

  const flashCopied = useCallback((text) => {
    copyText(text)
      .then(() => {
        setCopied(true)
        if (copiedTimer.current) clearTimeout(copiedTimer.current)
        copiedTimer.current = setTimeout(() => setCopied(false), COPIED_MS)
      })
      .catch(() => {
        console.info('[dev-inspector]', text)
      })
  }, [])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setHeld(false)
        setLatched(false)
        setPinned(false)
        return
      }
      if (isModifierEvent(event, modifier)) {
        setHeld(true)
        if (!pinnedRef.current) {
          const { x, y } = pointerRef.current
          updateTarget(x, y)
        }
      }
    }

    const handleKeyUp = (event) => {
      if (event.key === modifier || !modifierHeld(event, modifier)) setHeld(false)
    }

    const handleBlur = () => setHeld(false)

    window.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('keyup', handleKeyUp, true)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('keyup', handleKeyUp, true)
      window.removeEventListener('blur', handleBlur)
    }
  }, [modifier, updateTarget])

  useEffect(() => {
    let frame = 0

    const handleMove = (event) => {
      const { clientX, clientY } = event
      pointerRef.current = { x: clientX, y: clientY }
      if (!inspectingRef.current) return
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        setPointer({ x: clientX, y: clientY })
        if (!pinnedRef.current) updateTarget(clientX, clientY)
      })
    }

    window.addEventListener('pointermove', handleMove, true)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', handleMove, true)
    }
  }, [updateTarget])

  useEffect(() => {
    // Modifier + click pins the clicked scope in the panel; the click itself is
    // swallowed so links do not navigate and the target takes no focus.
    const handleMouseDown = (event) => {
      if (isInspectorChrome(event.target)) return
      if (!modifierHeld(event, modifier)) return
      event.preventDefault()
      event.stopPropagation()
    }

    const handleClick = (event) => {
      if (isInspectorChrome(event.target)) return
      if (modifierHeld(event, modifier)) {
        event.preventDefault()
        event.stopPropagation()
        if (pinnedRef.current) {
          setPinned(false)
          return
        }
        updateTarget(event.clientX, event.clientY)
        setPinned(true)
        return
      }
      if (!latchedRef.current) return
      event.preventDefault()
      event.stopPropagation()
      if (!pinnedRef.current) updateTarget(event.clientX, event.clientY)
    }

    window.addEventListener('mousedown', handleMouseDown, true)
    window.addEventListener('click', handleClick, true)

    return () => {
      window.removeEventListener('mousedown', handleMouseDown, true)
      window.removeEventListener('click', handleClick, true)
    }
  }, [modifier, updateTarget])

  useEffect(() => () => {
    if (copiedTimer.current) clearTimeout(copiedTimer.current)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setPosition((current) => {
        if (!current) return current
        const next = clampPanelPosition(current, current.width, current.height)
        savePanelPosition(next)
        return next
      })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!dragging) return undefined

    const handleMove = (event) => {
      const drag = dragRef.current
      if (!drag) return
      const next = clampPanelPosition(
        {
          left: drag.start.left + event.clientX - drag.x,
          top: drag.start.top + event.clientY - drag.y,
        },
        drag.width,
        drag.height
      )
      positionRef.current = next
      setPosition(next)
    }

    const handleUp = () => {
      if (positionRef.current) savePanelPosition(positionRef.current)
      dragRef.current = null
      setDragging(false)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('pointercancel', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('pointercancel', handleUp)
    }
  }, [dragging])

  const startMove = (event) => {
    event.preventDefault()
    event.stopPropagation()
    const panel = event.currentTarget.closest('.dev-inspector__panel')
    const rect = panel ? panel.getBoundingClientRect() : event.currentTarget.getBoundingClientRect()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      start: { left: rect.left, top: rect.top },
      width: rect.width,
      height: rect.height,
    }
    setDragging(true)
  }

  const descriptor = target ? target.descriptor : null
  const showOutline = Boolean(target) && (inspecting || pinned)
  const showBadge = Boolean(target) && inspecting
  const bounds = showOutline ? boundsFor(target.element) : null

  const overlay = (
    <div className="dev-inspector">
      {bounds && (
        <div
          className="dev-inspector__outline"
          style={{
            left: `${bounds.left}px`,
            top: `${bounds.top}px`,
            width: `${bounds.width}px`,
            height: `${bounds.height}px`,
          }}
        />
      )}
      {showBadge && (
        <div
          className={`dev-inspector__badge${copied ? ' dev-inspector__badge--copied' : ''}`}
          style={{ left: `${pointer.x + BADGE_OFFSET_PX}px`, top: `${pointer.y + BADGE_OFFSET_PX}px` }}
        >
          <span className="dev-inspector__route">{descriptor.route}</span>
          {descriptor.segments.map((segment, index) => (
            <span className="dev-inspector__segment" key={`${segment.id}-${index}`}>
              {segment.id}
              {segment.state && <span className="dev-inspector__state">[{segment.state}]</span>}
            </span>
          ))}
        </div>
      )}
      {panel && (
        <DevInspectorPanel
          forms={forms}
          activeFormId={activeFormId}
          onSelectForm={(id) => { setActiveFormId(id); setLatched(false) }}
          descriptor={descriptor}
          pinned={pinned}
          collapsed={collapsed}
          latched={latched}
          copied={copied}
          dragging={dragging}
          position={position}
          modifier={modifier}
          onCopy={() => flashCopied(descriptor ? descriptor.leaf : '')}
          onTogglePin={() => setPinned((current) => !current)}
          onToggleLatch={() => {
            setActiveFormId(null)
            if (latched) {
              setLatched(false)
              return
            }
            setLatched(true)
            if (!pinnedRef.current) {
              const { x, y } = pointerRef.current
              updateTarget(x, y)
            }
          }}
          onToggleCollapse={() => setCollapsed((current) => !current)}
          onMoveStart={startMove}
        />
      )}
    </div>
  )

  // Portalled to the body so app popups and drawers, which portal there too,
  // cannot stack above the overlay.
  return createPortal(overlay, document.body)
}

/**
 * DevInspector
 *
 * Props:
 *   enabled     {boolean} — when false, renders children only (default: false)
 *   modifier    {string}  — key held to inspect: Alt | Control | Shift | Meta (default: Alt)
 *   panel       {boolean} — dock the bottom-right panel (default: true)
 *   globalName  {string}  — window property exposing `describe(el)` (default: devInspector)
 *   children
 */
const DevInspector = ({ enabled = false, modifier = 'Alt', panel = true, globalName = 'devInspector', forms = [], views = [], children }) => {
  const registry = useRef(new Map())

  const register = useCallback((id) => {
    const count = (registry.current.get(id) || 0) + 1
    registry.current.set(id, count)
    if (count > 1) {
      console.warn(`[dev-inspector] duplicate DevScope id "${id}" is live ${count} times; pass a distinct devId`)
    }
  }, [])

  const unregister = useCallback((id) => {
    const count = (registry.current.get(id) || 0) - 1
    if (count <= 0) registry.current.delete(id)
    else registry.current.set(id, count)
  }, [])

  const value = useMemo(
    () => ({ active: enabled, parentId: null, parentNodeRef: null, register, unregister }),
    [enabled, register, unregister],
  )

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined
    window[globalName] = {
      describe: (element = document.activeElement) => describeElement(element).leaf,
      copy: (element = document.activeElement) => copyText(describeElement(element).leaf),
      ids: () => Array.from(registry.current.keys()),
    }
    return () => {
      delete window[globalName]
    }
  }, [enabled, globalName])

  if (!enabled) return children

  return (
    <DevInspectorContext.Provider value={value}>
      {children}
      <DevInspectorOverlay modifier={modifier} panel={panel} forms={[...forms, ...views.map(({ component, ...view }) => ({ ...view, view: component }))]} />
    </DevInspectorContext.Provider>
  )
}

export default DevInspector
