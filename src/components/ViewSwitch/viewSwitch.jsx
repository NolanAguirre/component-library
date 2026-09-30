import { useEffect, useState, Children, cloneElement } from 'react'
import './styles.css'

/**
 * ViewSwitchDisplay — pure display controller.
 *
 * Props:
 *   index   {number}   — the currently active view index (0-based)
 *   count   {number}   — total number of views
 *   select  {function} — jumps directly to a given index
 *   next    {function} — advances to the next view
 *   back    {function} — retreats to the previous view
 *   loop    {boolean}  — when true, next/back wrap around the ends
 *   children           — expects <ViewSwitchControls> and <ViewSwitchView> children;
 *                        all receive viewSwitch:{ index, count, select, next, back, loop }
 *                        via cloneElement
 */
export const ViewSwitchDisplay = ({
  index = 0,
  count = 0,
  select = () => {},
  next = () => {},
  back = () => {},
  loop = false,
  children,
}) => {
  const enhanced = Children.map(children, (child) =>
    cloneElement(child, { viewSwitch: { index, count, select, next, back, loop } })
  )

  return (
    <div className="view-switch">
      {enhanced}
    </div>
  )
}

/**
 * ViewSwitchBack — the previous view arrow button.
 *
 * Receives viewSwitch:{ index, back } from ViewSwitchDisplay.
 */
export const ViewSwitchBack = ({
  viewSwitch: { index = 0, back = () => {}, loop = false } = {},
}) => (
  <button
    type="button"
    className="view-switch__arrow view-switch__arrow--back"
    onClick={back}
    disabled={!loop && index === 0}
    aria-label="Previous view"
  >
    ‹
  </button>
)

/**
 * ViewSwitchNext — the next view arrow button.
 *
 * Receives viewSwitch:{ index, count, next } from ViewSwitchDisplay.
 */
export const ViewSwitchNext = ({
  viewSwitch: { index = 0, count = 0, next = () => {}, loop = false } = {},
}) => (
  <button
    type="button"
    className="view-switch__arrow view-switch__arrow--next"
    onClick={next}
    disabled={!loop && index === count - 1}
    aria-label="Next view"
  >
    ›
  </button>
)

/**
 * ViewSwitchControls — the left/right arrow navigation bar.
 *
 * Receives viewSwitch:{ index, count, next, back } from ViewSwitchDisplay.
 * Renders an optional label slot via children (e.g. "2 / 5").
 */
export const ViewSwitchControls = ({
  viewSwitch = {},
  children,
}) => {
  const { index = 0, count = 0 } = viewSwitch

  return (
    <div className="view-switch__controls">
      <ViewSwitchBack viewSwitch={viewSwitch} />
      <span className="view-switch__label">
        {children ?? `${index + 1} / ${count}`}
      </span>
      <ViewSwitchNext viewSwitch={viewSwitch} />
    </div>
  )
}

/**
 * ViewSwitchView — renders its children only when it is the active view.
 *
 * Receives viewSwitch:{ index } from ViewSwitchDisplay.
 * Requires a `viewIndex` prop that declares which position this view occupies.
 */
export const ViewSwitchView = ({
  viewSwitch: { index = 0 } = {},
  viewIndex,
  children,
}) => {
  const isActive = index === viewIndex

  return (
    <div
      className={`view-switch__view${isActive ? ' view-switch__view--active' : ''}`}
      aria-hidden={!isActive}
    >
      {children}
    </div>
  )
}

/**
 * withViewSwitch — state controller HOC.
 *
 * Manages the active index and delegates all rendering to the wrapped display component.
 * Accepts an optional `defaultIndex` prop to set the initial view.
 * Pass `index` to control the active view, and `onSelect` to hear every change.
 *
 * Provides three navigation actions:
 *   select(i) — jump directly to index i
 *   next()    — advance by one (wraps to 0 when loop is true, else clamped)
 *   back()    — retreat by one (wraps to count - 1 when loop is true, else clamped)
 */
export const withViewSwitch = (WrappedComponent) => ({
  defaultIndex = 0,
  index: controlledIndex,
  onSelect,
  count = 0,
  loop = false,
  ...props
}) => {
  const [uncontrolledIndex, setIndex] = useState(defaultIndex)
  const isControlled = controlledIndex !== undefined
  const index = isControlled ? controlledIndex : uncontrolledIndex
  const maxIndex = Math.max(count - 1, 0)
  const wrapCount = Math.max(count, 1)

  useEffect(() => {
    if (isControlled) return
    setIndex((prev) => Math.min(Math.max(prev, 0), maxIndex))
  }, [maxIndex, isControlled])

  const commit = (nextIndex) => {
    const clamped = Math.min(Math.max(nextIndex, 0), maxIndex)
    if (!isControlled) setIndex(clamped)
    if (onSelect) onSelect(clamped)
  }

  const select = (i) => commit(i)
  const next = () => commit(loop ? (index + 1) % wrapCount : Math.min(index + 1, maxIndex))
  const back = () => commit(loop ? (index - 1 + wrapCount) % wrapCount : Math.max(index - 1, 0))

  return (
    <WrappedComponent {...props} index={index} count={count} loop={loop} select={select} next={next} back={back} />
  )
}

const ViewSwitch = withViewSwitch(ViewSwitchDisplay)
export default ViewSwitch
