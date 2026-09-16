import { useState, useRef, useCallback, Children, cloneElement } from 'react'

/**
 * MultiSelectDisplay — pure display controller.
 *
 * Props (passed via cloneElement under the `multiSelect` namespace):
 *   selected   {Array<{id: string, value: any}>} — the current array of selected entities
 *   add        {function({id, value}, event?)}    — toggles an entity; shift+click selects range
 *   clear      {function()}                       — clears all selected entities
 *   set        {function(Array<{id, value}>)}     — replaces the selection with a new array
 *   setItems   {function(Array<{id, ...}>)}       — registers the ordered item list for range selection
 *   isSelected {function(id): boolean}            — returns true if the given id is in the selection
 *
 * Children receive multiSelect:{ selected, add, clear, set, setItems, isSelected } via cloneElement.
 * This component renders no DOM of its own — it is purely a prop-injection layer,
 * allowing it to be used inside a form controller that manages selection state externally.
 */
export const MultiSelectDisplay = ({
  selected = [],
  add = () => {},
  clear = () => {},
  set = () => {},
  setItems = () => {},
  isSelected = () => false,
  children,
}) => {
  const enhanced = Children.map(children, (child) =>
    cloneElement(child, { multiSelect: { selected, add, clear, set, setItems, isSelected } })
  )

  return enhanced
}

/**
 * withMultiSelect — state controller HOC.
 *
 * Manages the array of selected entities and delegates all rendering to the
 * wrapped display component. Accepts an optional `defaultSelected` prop to
 * seed the initial selection.
 *
 * Each entity must conform to { id: string, value: any }.
 * Selection is keyed by `id`.
 *
 * Actions:
 *   add(entity, event?)  — toggles; if event.shiftKey is true, selects range from anchor
 *   clear()              — empties the selection
 *   set(entities)        — replaces the entire selection
 *   setItems(items)      — registers the ordered list used for shift+click range selection
 */
export const withMultiSelect = (WrappedComponent) => ({ defaultSelected = [], ...props }) => {
  const [selected, setSelected] = useState(defaultSelected)
  const lastAddedRef = useRef(null)
  const itemsRef = useRef([])

  const setItems = useCallback((items) => {
    itemsRef.current = items
  }, [])

  const add = (entity, event) => {
    const shiftHeld = event && event.shiftKey

    if (shiftHeld && lastAddedRef.current && itemsRef.current.length > 0) {
      const allItems = itemsRef.current
      const anchorIdx = allItems.findIndex((item) => item.id === lastAddedRef.current)
      const targetIdx = allItems.findIndex((item) => item.id === entity.id)

      if (anchorIdx !== -1 && targetIdx !== -1) {
        const start = Math.min(anchorIdx, targetIdx)
        const end = Math.max(anchorIdx, targetIdx)
        const rangeItems = allItems.slice(start, end + 1)

        setSelected((prev) => {
          const merged = [...prev]
          rangeItems.forEach((item) => {
            if (!merged.some((s) => s.id === item.id)) {
              merged.push({ id: item.id, value: item })
            }
          })
          return merged
        })

        lastAddedRef.current = entity.id
        return
      }
    }

    setSelected((prev) => {
      const exists = prev.some((item) => item.id === entity.id)
      lastAddedRef.current = entity.id
      if (exists) {
        return prev.filter((item) => item.id !== entity.id)
      }
      return [...prev, entity]
    })
  }

  const clear = () => setSelected([])

  const set = (entities) => setSelected(entities)

  const isSelected = (id) => selected.some((item) => item.id === id)

  return (
    <WrappedComponent
      selected={selected}
      add={add}
      clear={clear}
      set={set}
      setItems={setItems}
      isSelected={isSelected}
      {...props}
    />
  )
}

const MultiSelect = withMultiSelect(MultiSelectDisplay)
export default MultiSelect
