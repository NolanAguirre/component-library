import { Children, cloneElement } from 'react'
import { VirtuosoGrid } from 'react-virtuoso'
import '../Grid/styles.css'
import './styles.css'

const DEFAULT_MIN_ITEM_WIDTH = 15
const DEFAULT_GAP = 1

/**
 * VirtualGrid — virtualized twin of Grid, backed by VirtuosoGrid.
 *
 * Takes the same props as Grid and reuses its `.grid` CSS block, so a long list
 * can be virtualized by swapping the component name at the call site. Injects
 * the datum as top-level `item` and `index` props, the shared data-template
 * contract, so a card template works unchanged under either component.
 *
 * The responsive mode uses `auto-fill`, never `auto-fit`: with `auto-fit` the
 * empty tracks collapse, so the single item Virtuoso measures to estimate row
 * size spans the whole row and the grid renders wrong.
 *
 * Props:
 *   data            {Array}   — the dataset to render; one clone per element
 *   columns         {number}  — fixed column count; enables the fixed mode
 *   minItemWidth    {number}  — responsive track minimum in rem (default 15)
 *   gap             {number}  — spacing between items in rem (default 1)
 *   className       {string}  — extra class on the list element
 *   useWindowScroll {boolean} — scroll with the window (default true); pass
 *                              false inside a contained scroller
 *   height          {string}  — height of the scroller, for contained scrollers
 *   children                  — a single child element used as the per-item
 *                              template; receives { item, index }
 */
const VirtualGrid = ({
  data = [],
  columns,
  minItemWidth = DEFAULT_MIN_ITEM_WIDTH,
  gap = DEFAULT_GAP,
  className = '',
  useWindowScroll = true,
  height,
  children,
}) => {
  const child = Children.only(children)
  const modifier = columns ? 'grid--fixed' : 'grid--auto'

  const style = {
    '--grid-columns': columns,
    '--grid-item-width': `${minItemWidth}rem`,
    '--grid-gap': `${gap}rem`,
    ...(height ? { height } : {}),
  }

  return (
    <VirtuosoGrid
      useWindowScroll={useWindowScroll}
      data={data}
      computeItemKey={(index, item) => (item?.id ? item.id : index)}
      listClassName={`grid ${modifier}${className ? ` ${className}` : ''}`}
      itemClassName="grid__item"
      itemContent={(index, item) => cloneElement(child, { item, index })}
      style={style}
    />
  )
}

export default VirtualGrid
