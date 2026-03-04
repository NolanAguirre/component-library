import { Children, cloneElement } from 'react'
import './styles.css'

/**
 * Card — stateless display component.
 *
 * Clones its children and injects card:{} under the `card` namespace
 * so sub-components (CardHeader, CardSection, CardLabel) can be composed freely.
 */
const Card = ({ children }) => {
  const enhanced = Children.map(children, (child) =>
    cloneElement(child, { card: {} })
  )

  return (
    <div className="card">
      {enhanced}
    </div>
  )
}

export default Card

/**
 * CardHeader — the top section of the card, typically used for a title.
 *
 * Receives card:{} from Card via cloneElement.
 */
export const CardHeader = ({ card: {} = {}, children }) => (
  <div className="card__header">
    {children}
  </div>
)

/**
 * CardSection — the main body content area of the card.
 *
 * Receives card:{} from Card via cloneElement.
 * Accepts an optional `size` prop that sets the flex value when inside a CardRow.
 * Defaults to 1.
 */
export const CardSection = ({ card: {} = {}, size = 1, children }) => (
  <div className="card__section" style={{ flex: size }}>
    {children}
  </div>
)

/**
 * CardLabel — a small label, typically used for tags, categories, or status indicators.
 *
 * Receives card:{} from Card via cloneElement.
 */
export const CardLabel = ({ card: {} = {}, children }) => (
  <span className="card__label">
    {children}
  </span>
)

/**
 * CardRow — a flex container that lays out CardSections side by side in a row.
 *
 * Receives card:{} from Card via cloneElement and passes it down to its own children.
 */
export const CardRow = ({ card: {} = {}, children }) => {
  const enhanced = Children.map(children, (child) =>
    cloneElement(child, { card: {} })
  )

  return (
    <div className="card__row">
      {enhanced}
    </div>
  )
}

