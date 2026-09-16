import { useState, useRef, useEffect, Children, cloneElement } from 'react'
import './styles.css'

/**
 * fuzzyScore — subsequence match score for a fuzzy filter.
 *
 * Returns null when the query characters are not all present, in order, in the
 * text. Otherwise returns a score where contiguous runs and earlier matches
 * rank higher, so the closest matches sort to the top.
 */
const fuzzyScore = (text, query) => {
  const haystack = text.toLowerCase()
  const needle = query.toLowerCase()
  let score = 0
  let searchFrom = 0
  let previousMatch = -2

  for (const char of needle) {
    const matchIndex = haystack.indexOf(char, searchFrom)
    if (matchIndex === -1) return null

    score += matchIndex === previousMatch + 1 ? 2 : 1
    score -= matchIndex * 0.01

    previousMatch = matchIndex
    searchFrom = matchIndex + 1
  }

  return score
}

// searchValue lets an option render a node as its displayValue and still be filterable
const optionText = (option) => String(option.searchValue ?? option.displayValue ?? option.value ?? '')

const defaultFilterOptions = (options, query) => {
  const normalizedQuery = query.trim()
  if (!normalizedQuery) return options

  return options
    .map((option) => ({
      option,
      score: fuzzyScore(optionText(option), normalizedQuery),
    }))
    .filter((entry) => entry.score !== null)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.option)
}

const commonPrefix = (a, b) => {
  const limit = Math.min(a.length, b.length)
  let index = 0
  while (index < limit && a[index].toLowerCase() === b[index].toLowerCase()) index += 1
  return a.slice(0, index)
}

/**
 * prefixCompletion — longest prefix shared by every option starting with the
 * query, for tab completion. Returns null when nothing starts with the query
 * or the shared prefix adds nothing to what is already typed.
 */
const prefixCompletion = (options, query) => {
  if (!query) return null

  const lowered = query.toLowerCase()
  const matches = options
    .map(optionText)
    .filter((text) => text.toLowerCase().startsWith(lowered))

  if (matches.length === 0) return null

  const completion = matches.reduce(commonPrefix)
  return completion === query ? null : completion
}

/**
 * DropdownTypeaheadTrigger — the button that toggles the typeahead menu.
 *
 * Receives dropdown:{ isOpen, toggle, selected, displayValue } via cloneElement.
 */
export const DropdownTypeaheadTrigger = ({ dropdown: { isOpen, toggle, displayValue } = {}, placeholder = 'Select an option…', children, ...rest }) => (
  <button
    type="button"
    className={`form-dropdown__trigger${isOpen ? ' form-dropdown__trigger--open' : ''}`}
    onClick={toggle}
    aria-haspopup="listbox"
    aria-expanded={isOpen}
    {...rest}
  >
    <span className={`form-dropdown__trigger-label${!displayValue ? ' form-dropdown__trigger-label--placeholder' : ''}`}>
      {children || displayValue || placeholder}
    </span>
    <span className="form-dropdown__trigger-icon" aria-hidden="true">
      {isOpen ? '▲' : '▼'}
    </span>
  </button>
)

/**
 * DropdownTypeaheadMenu — positioned list container.
 *
 * Receives dropdown:{ isOpen, highlightedIndex, select, selected } via cloneElement.
 * Only renders its children when the menu is open.
 */
export const DropdownTypeaheadMenu = ({
  dropdown: {
    isOpen,
    highlightedIndex,
    select,
    selected,
    filterable = false,
    query = '',
    setQuery = () => {},
    clearQuery = () => {},
    filteredOptions = [],
    canCreate = false,
    createValue = '',
    create = () => {},
  } = {},
  filterPlaceholder = 'Filter options...',
  emptyMessage = 'No options found',
  createLabel = (value) => `Create "${value}"`,
  children,
}) => {
  if (!isOpen) return null

  const items = Children.count(children) > 0
    ? Children.toArray(children).filter((child) =>
      !filterable || filteredOptions.some((option) => option.value === child.props.value)
    )
    : filteredOptions.map((opt) => (
      <DropdownTypeaheadItem key={String(opt.value ?? 'null')} value={opt.value}>
        {opt.displayValue}
      </DropdownTypeaheadItem>
    ))

  const enhanced = items.map((child, index) =>
    cloneElement(child, {
      dropdown: { select, selected, highlighted: index === highlightedIndex },
    })
  )

  return (
    <div className="form-dropdown__menu">
      {filterable && (
        <div className="form-dropdown__filter">
          <input
            className="form-dropdown__filter-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={filterPlaceholder}
            autoFocus
          />
          {query && (
            <button className="form-dropdown__filter-clear" type="button" onClick={clearQuery} aria-label="Clear filter">
              ×
            </button>
          )}
        </div>
      )}
      {enhanced.length > 0 && (
        <ul className="form-dropdown__items" role="listbox">
          {enhanced}
        </ul>
      )}
      {canCreate ? (
        <button
          type="button"
          className={`form-dropdown__create${highlightedIndex === -1 ? ' form-dropdown__create--highlighted' : ''}`}
          onClick={() => create()}
        >
          {createLabel(createValue)}
        </button>
      ) : (
        enhanced.length === 0 && <div className="form-dropdown__empty">{emptyMessage}</div>
      )}
    </div>
  )
}

/**
 * DropdownTypeaheadItem — individual option.
 *
 * Receives dropdown:{ select, selected, highlighted } via DropdownTypeaheadMenu.
 */
export const DropdownTypeaheadItem = ({ value, children, dropdown: { select, selected, highlighted } = {} }) => {
  const isSelected = selected === value

  return (
    <li
      className={`form-dropdown__item${isSelected ? ' form-dropdown__item--selected' : ''}${highlighted ? ' form-dropdown__item--highlighted' : ''}`}
      role="option"
      aria-selected={isSelected}
      onClick={() => select?.(value)}
    >
      {children}
      {isSelected && <span className="form-dropdown__item-check" aria-hidden="true">✓</span>}
    </li>
  )
}

/**
 * DropdownTypeaheadDisplay — pure display controller.
 *
 * Manages the rendering of trigger, menu, and items.
 * Clones children (DropdownTypeaheadTrigger, DropdownTypeaheadMenu) and injects
 * the dropdown namespace via cloneElement.
 */
export const DropdownTypeaheadDisplay = ({
  isOpen = false,
  toggle = () => {},
  selected = '',
  select = () => {},
  options = [],
  filteredOptions = options,
  highlightedIndex = -1,
  filterable = false,
  query = '',
  setQuery = () => {},
  clearQuery = () => {},
  canCreate = false,
  createValue = '',
  create = () => {},
  containerRef,
  handleKeyDown,
  children,
}) => {
  const displayValue = options.find((opt) => opt.value === selected)?.displayValue ?? ''

  const enhanced = Children.map(children, (child) => {
    if (child.type === DropdownTypeaheadTrigger) {
      return cloneElement(child, {
        dropdown: { isOpen, toggle, selected, displayValue },
      })
    }
    if (child.type === DropdownTypeaheadMenu) {
      return cloneElement(child, {
        dropdown: {
          isOpen,
          highlightedIndex,
          select,
          selected,
          filterable,
          query,
          setQuery,
          clearQuery,
          filteredOptions,
          canCreate,
          createValue,
          create,
        },
      })
    }
    return child
  })

  return (
    <div
      className="form-dropdown"
      ref={containerRef}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {enhanced}
    </div>
  )
}

/**
 * withDropdownTypeahead — state controller HOC.
 *
 * Manages open state, selected value, highlighted index, and keyboard navigation.
 * Accepts `change` as the action prop (plain verb, per naming convention).
 */
// eslint-disable-next-line react-refresh/only-export-components
export const withDropdownTypeahead = (WrappedComponent) => ({
  defaultValue = '',
  options = [],
  change,
  create,
  filter = false,
  filterable = false,
  filterOptions = defaultFilterOptions,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState(defaultValue)
  const [query, setQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef(null)
  const isFilterable = filter || filterable
  const filteredOptions = isFilterable ? filterOptions(options, query) : options
  const normalizedQuery = query.trim()
  const hasExactMatch = options.some((opt) =>
    String(opt.displayValue ?? opt.value ?? '').trim().toLowerCase() === normalizedQuery.toLowerCase()
  )
  const canCreate = Boolean(create) && isFilterable && normalizedQuery.length > 0 && !hasExactMatch
  const Component = WrappedComponent

  // Sync selected with external value changes (form resets, etc.)
  useEffect(() => {
    setSelected(defaultValue)
  }, [defaultValue])

  useEffect(() => {
    if (!isOpen) return

    setHighlightedIndex((prev) => {
      if (filteredOptions.length === 0) return -1
      if (prev >= 0 && prev < filteredOptions.length) return prev
      return 0
    })
  }, [filteredOptions.length, isOpen])

  const toggle = () => {
    setIsOpen((prev) => {
      if (prev) {
        setQuery('')
      } else {
        const selectedIndex = filteredOptions.findIndex((opt) => opt.value === selected)
        setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0)
      }
      return !prev
    })
  }

  const select = (value) => {
    setSelected(value)
    setIsOpen(false)
    setQuery('')
    if (change) change(value)
  }

  const clearQuery = () => {
    setQuery('')
  }

  const complete = () => {
    const completion = prefixCompletion(options, query)
    if (!completion) return false

    setQuery(completion)
    return true
  }

  const triggerCreate = () => {
    if (!canCreate) return
    setIsOpen(false)
    setQuery('')
    create(normalizedQuery)
  }

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
        const selectedIndex = filteredOptions.findIndex((opt) => opt.value === selected)
        setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0)
      }
      return
    }

    if (e.target.tagName === 'INPUT' && e.key === ' ') return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) => filteredOptions.length === 0 ? -1 : (prev + 1) % filteredOptions.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => filteredOptions.length === 0 ? -1 : (prev - 1 + filteredOptions.length) % filteredOptions.length)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          select(filteredOptions[highlightedIndex].value)
        } else if (canCreate) {
          triggerCreate()
        }
        break
      case 'Tab':
        // Only swallow Tab when it completes something, otherwise focus moves on
        if (!e.shiftKey && complete()) e.preventDefault()
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setQuery('')
        break
      default:
        break
    }
  }

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
        setQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <Component
      isOpen={isOpen}
      toggle={toggle}
      selected={selected}
      select={select}
      options={options}
      filteredOptions={filteredOptions}
      highlightedIndex={highlightedIndex}
      filterable={isFilterable}
      query={query}
      setQuery={setQuery}
      clearQuery={clearQuery}
      canCreate={canCreate}
      createValue={normalizedQuery}
      create={triggerCreate}
      containerRef={containerRef}
      handleKeyDown={handleKeyDown}
      {...props}
    />
  )
}

export const DropdownTypeahead = withDropdownTypeahead(DropdownTypeaheadDisplay)

/**
 * FormDropdown — form-integrated dropdown.
 *
 * Receives field:{ name, value, options, onChange, onBlur } from FormField
 * via cloneElement. Bridges the form field interface into the DropdownTypeahead
 * system.
 *
 * Options are sourced from the field config:
 *   options: [{ value: 'eng', displayValue: 'Engineer' }, …]
 */
const FormDropdown = ({ field: { name, value, options = [], onChange, onBlur } = {}, placeholder = 'Select an option…', ...rest }) => {
  const handleChange = (selectedValue) => {
    if (onChange) {
      onChange({ target: { value: selectedValue } })
    }
  }

  return (
    <div id={name} onBlur={onBlur}>
      <DropdownTypeahead
        defaultValue={value}
        options={options}
        change={handleChange}
        {...rest}
      >
        <DropdownTypeaheadTrigger placeholder={placeholder} />
        <DropdownTypeaheadMenu>
          {options.map((opt) => (
            <DropdownTypeaheadItem key={String(opt.value ?? 'null')} value={opt.value}>
              {opt.displayValue}
            </DropdownTypeaheadItem>
          ))}
        </DropdownTypeaheadMenu>
      </DropdownTypeahead>
    </div>
  )
}

export default FormDropdown
