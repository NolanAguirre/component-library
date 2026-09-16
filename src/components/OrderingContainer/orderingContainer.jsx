import { useState, Children, cloneElement } from 'react'
import './styles.css'

/**
 * OrderingContainerDisplay — pure display controller.
 *
 * Clones each child and injects ordering:{ order, totalCount, updating, move }
 * under the `ordering` namespace so children can destructure what they need.
 *
 * Expects children to be one per ordered item. Each child must have a unique
 * `id` prop so the container can match it to the items list.
 *
 * Props:
 *   items     {Array<{ id }>}  — ordered list of items (1-based position = array index + 1)
 *   updating  {string|null}    — id of the item currently being updated, or null
 *   move      {function}       — triggers moving an item; receives (id, direction)
 *   children                  — one child per item; each must have an `id` prop
 */
export const OrderingContainerDisplay = ({
  items = [],
  updating = null,
  move = () => {},
  children,
}) => {
  const totalCount = items.length
  const childById = Children.toArray(children).reduce((acc, child) => {
    acc[child.props.id] = child
    return acc
  }, {})

  const enhanced = items.map((item, idx) => {
    const child = childById[item.id]
    if (!child) return null
    return cloneElement(child, {
      ordering: {
        order: idx + 1,
        totalCount,
        updating: updating === item.id,
        move,
      },
    })
  })

  return (
    <div className="ordering-container">
      {enhanced}
    </div>
  )
}

/**
 * OrderingContainer — state controller HOC.
 *
 * Owns the ordered list of items in state. When a reorder is triggered it:
 *   1. Swaps the item with its neighbour in state (optimistic update)
 *   2. Marks that item as `updating`
 *   3. Calls the `networkOrderChange` callback with { id, newOrder, oldOrder }
 *   4. Clears `updating` when the promise resolves or rejects
 *
 * Props:
 *   initialItems        {Array<{ id }>}  — starting ordered list
 *   networkOrderChange  {function}       — network callback; receives { id, newOrder, oldOrder };
 *                                          may return a Promise
 *   children                             — one child per item; each must have an `id` prop
 */
const withOrdering = (WrappedComponent) => ({ initialItems = [], networkOrderChange = () => {}, ...props }) => {
  const [items, setItems] = useState(initialItems)
  const [updating, setUpdating] = useState(null)

  const move = (id, direction) => {
    setItems((prev) => {
      const idx = prev.findIndex((item) => item.id === id)
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1

      if (swapIdx < 0 || swapIdx >= prev.length) return prev

      const oldOrder = idx + 1
      const newOrder = swapIdx + 1

      const next = [...prev]
      ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]

      setUpdating(id)
      Promise.resolve(networkOrderChange({ id, newOrder, oldOrder })).finally(() => setUpdating(null))

      return next
    })
  }

  return (
    <WrappedComponent
      items={items}
      updating={updating}
      move={move}
      {...props}
    />
  )
}

const OrderingContainer = withOrdering(OrderingContainerDisplay)

export default OrderingContainer
