import { Children, cloneElement } from 'react'
import { Virtuoso } from 'react-virtuoso'
import './styles.css'

/**
 * VirtualList — virtualized vertical list, backed by Virtuoso.
 *
 * The list twin of VirtualGrid: injects the datum as top-level `item` and
 * `index` props, the shared data-template contract, so a row template works
 * unchanged whether it is rendered directly or through this component. Use it
 * to virtualize a long stack of rows.
 *
 * Props:
 *   data            {Array}   — the dataset to render; one clone per element
 *   className       {string}  — extra class on the list element
 *   useWindowScroll {boolean} — scroll with the window (default true); pass
 *                              false inside a contained scroller
 *   height          {string}  — height of the scroller, for contained scrollers
 *   children                  — a single child element used as the per-item
 *                              template; receives { item, index }
 */
const VirtualList = ({
  data = [],
  className = '',
  useWindowScroll = true,
  height,
  children,
}) => {
  const child = Children.only(children)

  const style = height ? { height } : undefined

  return (
    <Virtuoso
      useWindowScroll={useWindowScroll}
      data={data}
      computeItemKey={(index, item) => (item?.id ? item.id : index)}
      className={`virtual-list${className ? ` ${className}` : ''}`}
      itemContent={(index, item) => (
        <div className="virtual-list__item">{cloneElement(child, { item, index })}</div>
      )}
      style={style}
    />
  )
}

export default VirtualList
