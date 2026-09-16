import { Children, cloneElement, useEffect, useRef, useState } from 'react'
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  defaultAnimateLayoutChanges,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import './styles.css'

const DEFAULT_MIN_ITEM_WIDTH = 15
const DEFAULT_GAP = 1

const itemId = (item, index) => {
  return item?.id ?? index
}

const sameMembership = (left, right) => {
  if (left.length !== right.length) return false
  const ids = new Set(left.map((item) => item?.id))
  return right.every((item) => ids.has(item?.id))
}

const animateLayoutChanges = (args) => {
  if (args.wasDragging) return false
  return defaultAnimateLayoutChanges(args)
}

const SortableGridItem = ({ id, children }) => {
  const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    animateLayoutChanges,
  })
  const dragged = useRef(false)

  useEffect(() => {
    if (isDragging) dragged.current = true
  }, [isDragging])

  const handleClickCapture = (event) => {
    if (!dragged.current) return
    event.preventDefault()
    event.stopPropagation()
    dragged.current = false
  }

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid__item${isDragging ? ' grid__item--dragging' : ''}`}
      onClickCapture={handleClickCapture}
      {...listeners}
    >
      {children}
    </div>
  )
}

/**
 * GridDisplay — stateless CSS grid layout component.
 *
 * Accepts an array of `data` and a single child element as a template.
 * Clones the child once per item in `data`, injecting the datum as top-level
 * `item` and `index` props — the shared data-template contract used by Grid,
 * VirtualGrid, Masonry, and Map, so one template works under any of them.
 *
 * Two column modes:
 *   fixed      — pass `columns` for an exact column count
 *   responsive — omit `columns` for auto-fill tracks of `minItemWidth`
 *
 * Props:
 *   data         {Array}     — the dataset to render; one clone per element
 *   columns      {number}    — fixed column count; enables the fixed mode
 *   minItemWidth {number}    — responsive track minimum in rem (default 15)
 *   gap          {number}    — spacing between items in rem (default 1)
 *   className    {string}    — extra class on the grid element, for overrides such
 *                              as padding or a narrower track set through
 *                              --grid-min-item-width
 *   ItemWrap     {Component} — optional wrapper around each clone; receives { id }
 *   children                 — a single child element used as the per-item template;
 *                              receives { item, index } via cloneElement
 */
export const GridDisplay = ({
  data = [],
  columns,
  minItemWidth = DEFAULT_MIN_ITEM_WIDTH,
  gap = DEFAULT_GAP,
  className = '',
  ItemWrap,
  children,
}) => {
  const child = Children.only(children)
  const modifier = columns ? 'grid--fixed' : 'grid--auto'
  const sortable = !!ItemWrap

  const style = {
    '--grid-columns': columns,
    '--grid-item-width': `${minItemWidth}rem`,
    '--grid-gap': `${gap}rem`,
  }

  return (
    <div
      className={`grid ${modifier}${sortable ? ' grid--sortable' : ''}${className ? ` ${className}` : ''}`}
      style={style}
    >
      {data.map((item, index) => {
        const key = itemId(item, index)
        const cloned = cloneElement(child, { item, index })
        if (!ItemWrap) {
          return cloneElement(cloned, { key })
        }
        return (
          <ItemWrap key={key} id={key}>
            {cloned}
          </ItemWrap>
        )
      })}
    </div>
  )
}

/**
 * withSortable — optional drag-and-drop reorder controller for GridDisplay.
 *
 * When `onReorder` is passed and there are at least two items, wraps the grid
 * in a sortable context. Dropping an item onto another calls
 * `onReorder(item, newOrder)` with the drop target's `order` field — the same
 * contract used by sibling-shift database triggers.
 *
 * Props:
 *   data      {Array<{ id, order }>} — ordered list of items
 *   onReorder {function}             — (item, newOrder) => void | Promise
 */
export const withSortable = (WrappedComponent) => {
  const SortableGrid = ({ data = [], onReorder, ...props }) => {
    const [items, setItems] = useState(data)
    const dataRef = useRef(data)
    dataRef.current = data
    const dataSignature = data.map((item) => `${item?.id ?? ''}:${item?.order ?? ''}`).join('|')

    useEffect(() => {
      const incoming = dataRef.current
      setItems((prev) => {
        if (!sameMembership(prev, incoming) || prev.length === 0) return incoming
        const incomingById = new Map(incoming.map((item) => [item?.id, item]))
        return prev.map((item) => incomingById.get(item?.id) ?? item)
      })
    }, [dataSignature])

    const sensors = useSensors(
      useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
      useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
    )

    const list = onReorder ? items : data
    const activeSort = typeof onReorder === 'function' && list.length > 1

    const handleDragEnd = (event) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = list.findIndex((item, index) => itemId(item, index) === active.id)
      const newIndex = list.findIndex((item, index) => itemId(item, index) === over.id)
      if (oldIndex < 0 || newIndex < 0) return

      const activeItem = list[oldIndex]
      const overItem = list[newIndex]
      const previous = list
      setItems(arrayMove(list, oldIndex, newIndex))

      Promise.resolve(onReorder(activeItem, overItem?.order ?? 0)).catch(() => {
        setItems(previous)
      })
    }

    if (!activeSort) {
      return <WrappedComponent data={data} {...props} />
    }

    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={list.map(itemId)} strategy={rectSortingStrategy}>
          <WrappedComponent data={list} ItemWrap={SortableGridItem} {...props} />
        </SortableContext>
      </DndContext>
    )
  }

  return SortableGrid
}

const Grid = withSortable(GridDisplay)

export default Grid
