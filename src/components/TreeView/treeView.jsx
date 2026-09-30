import { Children, cloneElement, isValidElement, useEffect, useRef, useState } from 'react'
import { Virtuoso } from 'react-virtuoso'
import { DevScope } from '../DevInspector/devInspector'
import FileIcon, { FolderIcon } from '../FileIcon/fileIcon'
import './styles.css'

const defaultGetId = (item) => item?.id
const defaultGetChildren = (item) => item?.children

const isEditableTarget = (target) => {
  if (!target || target.nodeType !== 1) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

const isThenable = (value) => Boolean(value) && typeof value.then === 'function'

const flattenRows = (roots, { getId, getChildren, isBranchOf, expandedSet }) => {
  const rows = []
  const walk = (items, depth, parentId) => {
    if (!Array.isArray(items)) return
    items.forEach((item) => {
      const id = getId(item)
      const isBranch = isBranchOf(item)
      const isExpanded = isBranch && expandedSet.has(id)
      rows.push({ id, item, depth, parentId, isBranch, isExpanded })
      if (isExpanded) walk(getChildren(item), depth + 1, id)
    })
  }
  walk(roots, 0, null)
  return rows
}

const ChevronIcon = () => (
  <svg className="tree-row__chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="9 6 15 12 9 18" />
  </svg>
)

const stemLength = (value) => {
  const dot = value.lastIndexOf('.')
  return dot > 0 ? dot : value.length
}

const TreeRowInput = ({ value = '', commit = () => {}, cancel = () => {} }) => {
  const inputRef = useRef(null)
  const doneRef = useRef(false)

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true })
  }, [])

  const finish = (event, action) => {
    event.preventDefault()
    event.stopPropagation()
    doneRef.current = true
    const tree = event.currentTarget.closest('[role="tree"]')
    action()
    tree?.focus({ preventScroll: true })
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      const next = event.currentTarget.value
      finish(event, () => commit(next))
    } else if (event.key === 'Escape') {
      finish(event, cancel)
    }
  }

  return (
    <input
      ref={inputRef}
      className="tree-row__input"
      type="text"
      defaultValue={value}
      spellCheck={false}
      autoComplete="off"
      onFocus={(event) => event.currentTarget.setSelectionRange(0, stemLength(event.currentTarget.value))}
      onKeyDown={handleKeyDown}
      onBlur={(event) => {
        if (doneRef.current) return
        doneRef.current = true
        commit(event.currentTarget.value)
      }}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.stopPropagation()}
    />
  )
}

/**
 * TreeRow — default row display for TreeView; also usable as a row template.
 *
 * Receives the datum as top-level `item` / `index` and the row controller as
 * tree:{ id, depth, indent, isBranch, isExpanded, isLoading, isSelected,
 * isFocused, toggle, select, open, contextMenu }.
 *
 * Props:
 *   item       {any}      — the row datum
 *   tree       {object}   — row controller namespace injected by TreeView
 *   label      {node}     — row text (default: item.name ?? item.label ?? id)
 *   icon       {node}     — leading icon (default: FolderIcon / FileIcon); pass null to hide
 *   editing    {boolean}  — render an inline input instead of the label
 *   editValue  {string}   — initial input text (default: label)
 *   commitEdit {function} — `(value)` on Enter or blur
 *   cancelEdit {function} — called on Escape
 *   muted      {boolean}  — dim the row (e.g. dotfiles)
 *   title      {string}   — native tooltip
 *   className  {string}   — extra class on the row
 *   children              — trailing content (e.g. a dirty dot)
 */
export const TreeRow = ({
  item,
  tree = {},
  label,
  icon,
  editing = false,
  editValue,
  commitEdit = () => {},
  cancelEdit = () => {},
  muted = false,
  title,
  className = '',
  children,
}) => {
  const {
    id,
    depth = 0,
    indent = 12,
    isBranch = false,
    isExpanded = false,
    isLoading = false,
    isSelected = false,
    isFocused = false,
    toggle = () => {},
    select = () => {},
    open = () => {},
    contextMenu = () => {},
  } = tree
  const text = label ?? item?.name ?? item?.label ?? String(id ?? '')
  const glyph = icon !== undefined
    ? icon
    : isBranch
      ? <FolderIcon open={isExpanded} />
      : <FileIcon name={typeof text === 'string' ? text : item?.name} />

  const classes = [
    'tree-row',
    isBranch && 'tree-row--branch',
    isSelected && 'tree-row--selected',
    isFocused && 'tree-row--focused',
    isLoading && 'tree-row--loading',
    muted && 'tree-row--muted',
    editing && 'tree-row--editing',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const chevronClasses = [
    'tree-row__chevron',
    !isBranch && 'tree-row__chevron--leaf',
    isExpanded && !isLoading && 'tree-row__chevron--expanded',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      role="treeitem"
      aria-level={depth + 1}
      aria-expanded={isBranch ? isExpanded : undefined}
      aria-selected={isSelected}
      aria-busy={isLoading || undefined}
      title={title}
      style={{ paddingLeft: `calc(var(--tree-row-base-indent, 4px) + ${depth * indent}px)` }}
      onClick={() => {
        if (editing) return
        select()
        open()
      }}
      onContextMenu={(event) => contextMenu(event)}
    >
      <span
        className={chevronClasses}
        onClick={(event) => {
          if (!isBranch) return
          event.stopPropagation()
          select()
          toggle()
        }}
      >
        {isLoading ? <span className="tree-row__spinner" aria-hidden /> : isBranch && <ChevronIcon />}
      </span>
      {glyph != null && <span className="tree-row__icon">{glyph}</span>}
      {editing ? (
        <TreeRowInput
          value={editValue ?? (typeof text === 'string' ? text : '')}
          commit={commitEdit}
          cancel={cancelEdit}
        />
      ) : (
        <span className="tree-row__label">{text}</span>
      )}
      {children != null && <span className="tree-row__trailing">{children}</span>}
    </div>
  )
}

/**
 * TreeViewDisplay — pure virtualized tree renderer.
 *
 * Renders the flattened `rows` with Virtuoso (filling the parent's height) and
 * clones the row template once per row with top-level `item` / `index` and the
 * namespaced `tree` row controller. Defaults to <TreeRow /> when no template
 * child is given.
 *
 * Props:
 *   rows          {Array}    — flattened visible rows { id, item, depth, parentId, isBranch, isExpanded }
 *   indent        {number}   — px per depth level (default: 12)
 *   selectedId    {any}      — id of the selected row
 *   focusedId     {any}      — id of the keyboard-focused row
 *   loadingIds    {Array}    — ids of branches whose children are loading
 *   toggle        {function} — `(row)` expand / collapse a branch
 *   select        {function} — `(row)` select and focus a row
 *   open          {function} — `(row)` open a leaf or toggle a branch
 *   contextMenu   {function} — `(event, row)` row right-click
 *   onKeyDown     {function} — keydown handler for the tree root
 *   onFocus       {function} — focus handler for the tree root
 *   virtuosoRef   {object}   — ref forwarded to Virtuoso (scrollIntoView)
 *   label         {string}   — aria-label for the tree
 *   className     {string}   — extra class on the tree root
 *   style         {object}   — inline style on the tree root
 *   devId         {string}   — instance-root DevScope id
 *   children                 — optional row template element
 */
export const TreeViewDisplay = ({
  rows = [],
  indent = 12,
  selectedId = null,
  focusedId = null,
  loadingIds = [],
  toggle = () => {},
  select = () => {},
  open = () => {},
  contextMenu = () => {},
  onKeyDown,
  onFocus,
  virtuosoRef,
  label,
  className = '',
  style,
  devId,
  children,
}) => {
  const template = Children.toArray(children).find(isValidElement) ?? <TreeRow />

  const renderRow = (index, row) =>
    cloneElement(template, {
      item: row.item,
      index,
      tree: {
        id: row.id,
        depth: row.depth,
        indent,
        isBranch: row.isBranch,
        isExpanded: row.isExpanded,
        isLoading: loadingIds.includes(row.id),
        isSelected: row.id === selectedId,
        isFocused: row.id === focusedId,
        toggle: () => toggle(row),
        select: () => select(row),
        open: () => open(row),
        contextMenu: (event) => contextMenu(event, row),
      },
    })

  const node = (
    <div
      className={`tree-view${className ? ` ${className}` : ''}`}
      role="tree"
      tabIndex={0}
      aria-label={label}
      style={style}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
    >
      <Virtuoso
        ref={virtuosoRef}
        className="tree-view__scroller"
        data={rows}
        style={{ height: '100%' }}
        defaultItemHeight={22}
        computeItemKey={(index, row) => row.id ?? index}
        itemContent={renderRow}
      />
    </div>
  )

  const scopeState = typeof selectedId === 'string' || typeof selectedId === 'number'
    ? { selected: selectedId }
    : undefined

  return devId ? <DevScope id={devId} state={scopeState}>{node}</DevScope> : node
}

/**
 * withTreeView — state controller HOC.
 *
 * Owns expanded / selected / focused / loading state; `expandedIds` and
 * `selectedId` override the internal state when provided (controlled).
 * Expanded branches whose `getChildren` returns undefined trigger
 * `loadChildren(item)`; the row shows loading while a returned promise is pending.
 *
 * Props:
 *   roots              {Array}    — top-level items
 *   getId              {function} — `(item) => id` (default: item.id)
 *   getChildren        {function} — `(item) => children | undefined` (default: item.children)
 *   isBranch           {function} — `(item) => boolean` (default: Array.isArray(getChildren(item)))
 *   loadChildren       {function} — `(item) => promise | void` for unloaded branches
 *   expandedIds        {Array}    — controlled expanded ids
 *   defaultExpandedIds {Array}    — initial expanded ids when uncontrolled
 *   onExpandedChange   {function} — `(ids)` on every expand / collapse
 *   selectedId         {any}      — controlled selected id
 *   onSelect           {function} — `(item)` on selection change
 *   open               {function} — `(item)` on leaf click / Enter
 *   onRowContextMenu   {function} — `(event, item)` on row right-click (row is selected first)
 *   onKeyDown          {function} — `(event, item)` for keys the tree does not handle
 *   indent             {number}   — px per depth level (default: 12)
 *   devId              {string}   — instance-root DevScope id
 */
export const withTreeView = (WrappedComponent) => {
  const WithTreeView = ({
    roots = [],
    getId = defaultGetId,
    getChildren = defaultGetChildren,
    isBranch,
    loadChildren,
    expandedIds,
    defaultExpandedIds = [],
    onExpandedChange,
    selectedId,
    onSelect,
    open,
    onRowContextMenu,
    onKeyDown,
    ...props
  }) => {
    const [innerExpanded, setInnerExpanded] = useState(defaultExpandedIds)
    const [innerSelected, setInnerSelected] = useState(null)
    const [focusedId, setFocusedId] = useState(null)
    const [loadingIds, setLoadingIds] = useState([])
    const virtuosoRef = useRef(null)
    const attemptedRef = useRef(new Set())
    const rowsRef = useRef([])

    const expanded = expandedIds ?? innerExpanded
    const isSelectionControlled = selectedId !== undefined
    const selected = isSelectionControlled ? selectedId : innerSelected
    const isBranchOf = (item) => (isBranch ? Boolean(isBranch(item)) : Array.isArray(getChildren(item)))

    const rows = flattenRows(roots, { getId, getChildren, isBranchOf, expandedSet: new Set(expanded) })
    rowsRef.current = rows

    const indexOf = (id) => (id === null || id === undefined ? -1 : rows.findIndex((row) => row.id === id))

    const setExpanded = (next) => {
      if (expandedIds === undefined) setInnerExpanded(next)
      onExpandedChange?.(next)
    }

    const expand = (row) => {
      if (!row.isBranch || row.isExpanded) return
      setExpanded([...expanded, row.id])
    }

    const collapse = (row) => {
      if (!row.isExpanded) return
      attemptedRef.current.delete(row.id)
      setExpanded(expanded.filter((id) => id !== row.id))
    }

    const toggle = (row) => (row.isExpanded ? collapse(row) : expand(row))

    const select = (row) => {
      setFocusedId(row.id)
      if (row.id === selected) return
      if (!isSelectionControlled) setInnerSelected(row.id)
      onSelect?.(row.item)
    }

    const openRow = (row) => (row.isBranch ? toggle(row) : open?.(row.item))

    const contextMenu = (event, row) => {
      select(row)
      onRowContextMenu?.(event, row.item)
    }

    const moveTo = (index) => {
      const row = rows[index]
      if (!row) return
      select(row)
      virtuosoRef.current?.scrollIntoView({ index })
    }

    const handleKeyDown = (event) => {
      if (isEditableTarget(event.target)) return
      const focusedIndex = indexOf(focusedId)
      const index = focusedIndex >= 0 ? focusedIndex : indexOf(selected)
      const row = rows[index]
      const plain = !event.altKey && !event.ctrlKey && !event.metaKey
      const handled = () => event.preventDefault()

      switch (plain ? event.key : null) {
        case 'ArrowDown':
          handled()
          moveTo(index < 0 ? 0 : Math.min(index + 1, rows.length - 1))
          return
        case 'ArrowUp':
          handled()
          moveTo(index < 0 ? 0 : Math.max(index - 1, 0))
          return
        case 'Home':
          handled()
          moveTo(0)
          return
        case 'End':
          handled()
          moveTo(rows.length - 1)
          return
        case 'ArrowRight':
          handled()
          if (!row) return
          if (row.isBranch && !row.isExpanded) expand(row)
          else if (rows[index + 1]?.parentId === row.id) moveTo(index + 1)
          return
        case 'ArrowLeft':
          handled()
          if (!row) return
          if (row.isExpanded) collapse(row)
          else if (row.parentId !== null) moveTo(indexOf(row.parentId))
          return
        case 'Enter':
          if (!row) break
          handled()
          select(row)
          openRow(row)
          return
        default:
          break
      }
      onKeyDown?.(event, row?.item)
    }

    const handleFocus = (event) => {
      if (event.target !== event.currentTarget || indexOf(focusedId) >= 0) return
      const selectedIndex = indexOf(selected)
      const fallback = rows[selectedIndex >= 0 ? selectedIndex : 0]
      if (fallback) setFocusedId(fallback.id)
    }

    useEffect(() => {
      if (selected === null || selected === undefined) return
      setFocusedId(selected)
      const index = rowsRef.current.findIndex((row) => row.id === selected)
      if (index >= 0) virtuosoRef.current?.scrollIntoView({ index })
    }, [selected])

    useEffect(() => {
      const attempted = attemptedRef.current
      rows.forEach((row) => {
        if (!row.isBranch) return
        if (getChildren(row.item) !== undefined) {
          attempted.delete(row.id)
          return
        }
        if (!loadChildren || !row.isExpanded || attempted.has(row.id)) return
        attempted.add(row.id)
        const result = loadChildren(row.item)
        if (!isThenable(result)) return
        const done = () => setLoadingIds((prev) => prev.filter((id) => id !== row.id))
        setLoadingIds((prev) => (prev.includes(row.id) ? prev : [...prev, row.id]))
        result.then(done, done)
      })
    })

    return (
      <WrappedComponent
        rows={rows}
        selectedId={selected}
        focusedId={focusedId}
        loadingIds={loadingIds}
        toggle={toggle}
        select={select}
        open={openRow}
        contextMenu={contextMenu}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        virtuosoRef={virtuosoRef}
        {...props}
      />
    )
  }

  WithTreeView.displayName = `withTreeView(${WrappedComponent.displayName ?? WrappedComponent.name ?? 'Component'})`

  return WithTreeView
}

const TreeView = withTreeView(TreeViewDisplay)
export default TreeView
