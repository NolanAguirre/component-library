import './styles.css'

/**
 * Card — stateless display component.
 */
const Card = ({ children }) => (
  <div className="card">
    {children}
  </div>
)

export default Card

/**
 * CardHeader — the top section of the card, typically used for a title.
 */
export const CardHeader = ({ children }) => (
  <div className="card__header">
    {children}
  </div>
)

/**
 * CardSection — the main body content area of the card.
 *
 * Accepts an optional `size` prop that sets the flex value when inside a CardRow.
 * Defaults to 1.
 */
export const CardSection = ({ size = 1, children }) => (
  <div className="card__section" style={{ flex: size }}>
    {children}
  </div>
)

/**
 * CardLabel — a small label, typically used for tags, categories, or status indicators.
 */
export const CardLabel = ({ children }) => (
  <span className="card__label">
    {children}
  </span>
)

/**
 * CardRow — a flex container that lays out CardSections side by side in a row.
 */
export const CardRow = ({ children }) => (
  <div className="card__row">
    {children}
  </div>
)
