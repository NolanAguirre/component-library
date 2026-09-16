import './styles.css'

/**
 * Row — stateless display component.
 *
 * Children are always laid out flex inline.
 */
const Row = ({ children }) => (
  <div className="row">
    {children}
  </div>
)

export default Row

/**
 * RowHeader — a titled label area, typically the leftmost element of the row.
 */
export const RowHeader = ({ children }) => (
  <div className="row__header">
    {children}
  </div>
)

/**
 * RowSection — a flex content area within the row.
 *
 * Accepts an optional `size` prop that sets the flex value. Defaults to 1.
 */
export const RowSection = ({ size = 1, children }) => (
  <div className="row__section" style={{ flex: size }}>
    {children}
  </div>
)

/**
 * RowLabel — a small label, typically used for tags, categories, or status indicators.
 */
export const RowLabel = ({ children }) => (
  <span className="row__label">
    {children}
  </span>
)
