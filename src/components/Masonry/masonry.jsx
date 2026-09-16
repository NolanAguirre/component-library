import { Children, cloneElement, useEffect, useRef, useState } from 'react'
import { VirtuosoMasonry } from '@virtuoso.dev/masonry'
import './styles.css'

const DEFAULT_COLUMN_WIDTH = 15
const DEFAULT_GAP = 1

const MasonryItem = ({ data, index, context: { child } = {} }) => (
  <div className="masonry__item">
    {cloneElement(child, { item: data, index })}
  </div>
)

/**
 * MasonryDisplay — stateless masonry layout built on VirtuosoMasonry.
 *
 * Distributes `data` across a fixed number of equal-width columns using a
 * shortest-column-first algorithm, keeping virtualization and window scroll.
 * Accepts a single child element as a per-item template; it is cloned once per
 * item with the datum injected as top-level `item` and `index` props, the
 * shared data-template contract also used by Grid, VirtualGrid, and Map.
 *
 * Props:
 *   data        {Array}  — the dataset to render; one clone per element
 *   columnCount {number} — number of columns (default 1)
 *   gap         {number} — spacing between items in rem (default 1)
 *   children             — a single child element used as the per-item template
 */
export const MasonryDisplay = ({ data = [], columnCount = 1, gap = DEFAULT_GAP, children }) => {
  const child = Children.only(children)

  return (
    <VirtuosoMasonry
      useWindowScroll
      className="masonry__list"
      style={{ '--masonry-gap': `${gap}rem` }}
      columnCount={Math.max(1, columnCount)}
      data={data}
      context={{ child }}
      ItemContent={MasonryItem}
    />
  )
}

/**
 * withMasonry — responsive column-count controller HOC.
 *
 * Measures the container width with a ResizeObserver and derives `columnCount`
 * from a rem-based `columnWidth` target, so the layout reflows as the viewport
 * changes. Always renders at least one column.
 *
 * @param {React.Component} WrappedComponent
 */
export const withMasonry = (WrappedComponent) => {
  const MasonryState = ({ columnWidth = DEFAULT_COLUMN_WIDTH, gap = DEFAULT_GAP, ...props }) => {
    const containerRef = useRef(null)
    const [columnCount, setColumnCount] = useState(1)

    useEffect(() => {
      const element = containerRef.current
      if (!element) return undefined

      const remToPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      const targetWidth = columnWidth * remToPx

      const measure = () => {
        const width = element.clientWidth
        if (!width) return
        setColumnCount(Math.max(1, Math.floor(width / targetWidth)))
      }

      measure()
      const observer = new ResizeObserver(measure)
      observer.observe(element)
      return () => observer.disconnect()
    }, [columnWidth])

    return (
      <div ref={containerRef} className="masonry">
        <WrappedComponent columnCount={columnCount} gap={gap} {...props} />
      </div>
    )
  }

  MasonryState.displayName = `withMasonry(${WrappedComponent.displayName ?? WrappedComponent.name ?? 'Component'})`

  return MasonryState
}

export default withMasonry(MasonryDisplay)
