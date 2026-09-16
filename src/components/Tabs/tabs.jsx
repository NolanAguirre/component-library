import { Children, cloneElement, isValidElement } from 'react'
import { withViewSwitch } from '../ViewSwitch/viewSwitch'
import './styles.css'

/**
 * TabsDisplay — pure display controller.
 *
 * Receives index, count, select, next, back from withViewSwitch.
 * Clones children with tabs:{ index, select } via cloneElement so that
 * TabList, Tab, and TabPanel can read the active state.
 */
export const TabsDisplay = ({ index = 0, select = () => {}, children }) => {
  const enhanced = Children.map(children, (child) =>
    cloneElement(child, { tabs: { index, select } })
  )

  return (
    <div className="tabs">
      {enhanced}
    </div>
  )
}

/**
 * TabList — horizontal row of tab buttons.
 *
 * Receives tabs:{ index, select } from TabsDisplay via cloneElement.
 * Clones its Tab children to pass the tabs namespace down.
 */
export const TabList = ({ tabs = {}, children }) => {
  const enhanced = Children.map(children, (child, i) =>
    cloneElement(child, { tabs, tabIndex: child.props.tabIndex ?? i })
  )

  return (
    <div className="tabs__list" role="tablist">
      {enhanced}
    </div>
  )
}

/**
 * Tab — individual tab button; active state from tabs.index.
 *
 * Receives tabs:{ index, select } from TabList via cloneElement.
 * tabIndex is the positional index of this tab in the list.
 */
export const Tab = ({ tabs: { index, select } = {}, tabIndex = 0, children }) => {
  const isActive = index === tabIndex

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      className={`tabs__tab${isActive ? ' tabs__tab--active' : ''}`}
      onClick={() => select(tabIndex)}
    >
      {children}
    </button>
  )
}

/**
 * TabPanel — content area; renders children only when active.
 *
 * Receives tabs:{ index } from TabsDisplay via cloneElement.
 * panelIndex determines which tab index this panel corresponds to.
 */
export const TabPanel = ({ tabs: { index } = {}, panelIndex = 0, children }) => {
  const isActive = index === panelIndex

  if (!isActive) return null

  return (
    <div className="tabs__panel" role="tabpanel">
      {children}
    </div>
  )
}

const TabsWithViewSwitch = withViewSwitch(TabsDisplay)

const countPanels = (children) =>
  Children.toArray(children).filter((child) => isValidElement(child) && child.type === TabPanel).length

/**
 * Tabs — derives the view `count` from the number of TabPanel children so
 * callers do not have to pass it manually. An explicit `count` still wins.
 */
const Tabs = ({ children, count, ...props }) => {
  const derivedCount = count ?? countPanels(children)

  return (
    <TabsWithViewSwitch count={derivedCount} {...props}>
      {children}
    </TabsWithViewSwitch>
  )
}

export default Tabs
