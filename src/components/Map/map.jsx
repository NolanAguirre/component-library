import { Children, cloneElement } from 'react'
import './styles.css'

/**
 * Map — stateless display/layout component.
 *
 * Accepts an array of `data` and clones its single child once per element,
 * injecting each item and its index as top-level props — the shared
 * data-template contract also used by Grid, VirtualGrid, and Masonry:
 *
 *   { item, index }
 *
 * Props:
 *   data     {Array}    — the array of items to iterate over
 *   children {ReactNode} — a single child element to clone per item
 *
 * Example:
 *   <Map data={items}>
 *     <MyCard />
 *   </Map>
 *
 *   // MyCard receives: { item, index }
 *   const MyCard = ({ item, index }) => <div>{item.name}</div>
 */
const Map = ({ data = [], children }) => {
  const child = Children.only(children)

  return (
    <div className="map">
      {data.map((item, index) =>
        cloneElement(child, {
          key: index,
          item,
          index,
        })
      )}
    </div>
  )
}

export default Map

