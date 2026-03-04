import { Children, cloneElement } from 'react'
import './styles.css'

/**
 * Row — stateless display component.
 *
 * Clones its children and injects row:{} under the `row` namespace
 * so sub-components (RowHeader, RowLabel, RowSection) can be composed freely.
 * Children are always laid out flex inline.
 */
const Row = ({ children }) => {
  const enhanced = Children.map(children, (child) =>
    cloneElement(child, { row: {} })
  )

  return (
    <div className="row">
      {enhanced}
    </div>
  )
}

export default Row

/**
 * RowHeader — a titled label area, typically the leftmost element of the row.
 *
 * Receives row:{} from Row via cloneElement.
 */
export const RowHeader = ({ row: {} = {}, children }) => (
  <div className="row__header">
    {children}
  </div>
)

/**
 * RowSection — a flex content area within the row.
 *
 * Receives row:{} from Row via cloneElement.
 * Accepts an optional `size` prop that sets the flex value. Defaults to 1.
 */
export const RowSection = ({ row: {} = {}, size = 1, children }) => (
  <div className="row__section" style={{ flex: size }}>
    {children}
  </div>
)

/**
 * RowLabel — a small label, typically used for tags, categories, or status indicators.
 *
 * Receives row:{} from Row via cloneElement.
 */
export const RowLabel = ({ row: {} = {}, children }) => (
  <span className="row__label">
    {children}
  </span>
)

