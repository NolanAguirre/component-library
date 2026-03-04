import { useState, Children, cloneElement } from 'react'
import './styles.css'

/**
 * FoldDisplay — pure display controller.
 *
 * Props:
 *   isOpen  {boolean}  — whether the fold is expanded
 *   toggle  {function} — triggers the open/closed state change
 *   children          — expects <FoldTrigger> and <FoldContent> as children;
 *                       both receive fold:{ isOpen, toggle } via cloneElement
 */
export const FoldDisplay = ({ isOpen = false, toggle = () => {}, children }) => {
  const enhanced = Children.map(children, (child) =>
    cloneElement(child, { fold: { isOpen, toggle } })
  )

  return (
    <div className="fold">
      {enhanced}
    </div>
  )
}

/**
 * FoldTrigger — the clickable header that toggles the fold.
 *
 * Receives fold:{ isOpen, toggle } from FoldDisplay (via cloneElement).
 * Can also accept arbitrary children as label content.
 */
export const FoldTrigger = ({ fold: { isOpen, toggle } = {}, children }) => (
  <button
    className={`fold__trigger${isOpen ? ' fold__trigger--open' : ''}`}
    onClick={toggle}
    aria-expanded={isOpen}
  >
    <span className="fold__trigger-label">{children}</span>
    <span className="fold__trigger-icon" aria-hidden="true">
      {isOpen ? '▲' : '▼'}
    </span>
  </button>
)

/**
 * FoldContent — the collapsible content area.
 *
 * Receives fold:{ isOpen } from FoldDisplay (via cloneElement).
 */
export const FoldContent = ({ fold: { isOpen } = {}, children }) => (
  <div
    className={`fold__content${isOpen ? ' fold__content--open' : ''}`}
    aria-hidden={!isOpen}
  >
    <div className="fold__content-inner">
      {children}
    </div>
  </div>
)

/**
 * Fold — state controller HOC.
 *
 * Manages the open/closed state and delegates all rendering to FoldDisplay.
 * Accepts an optional `defaultOpen` prop to set the initial state.
 */
const Fold = ({ defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const toggle = () => setIsOpen((prev) => !prev)

  return (
    <FoldDisplay isOpen={isOpen} toggle={toggle}>
      {children}
    </FoldDisplay>
  )
}

export default Fold

