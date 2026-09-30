import { useState, useEffect, useRef, Children, cloneElement } from 'react'
import { fuzzyScore } from '../../lib/fuzzyScore'
import './styles.css'

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

// Longest prefix shared by every option starting with the query; null when nothing to add
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

export const TypeaheadInput = ({
  typeahead: { query = '', setQuery = () => {}, clearQuery = () => {}, open = () => {} } = {},
  placeholder = 'Filter options...',
  ...rest
}) => (
  <div className="typeahead__input-wrap">
    <input
      className="typeahead__input"
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onFocus={open}
      placeholder={placeholder}
      {...rest}
    />
    {query && (
      <button className="typeahead__clear" type="button" onClick={clearQuery} aria-label="Clear filter">
        ×
      </button>
    )}
  </div>
)

export const TypeaheadItem = ({
  value,
  children,
  typeahead: { selected, highlighted, select = () => {} } = {},
}) => {
  const isSelected = selected === value

  return (
    <li
      className={`typeahead__item${isSelected ? ' typeahead__item--selected' : ''}${highlighted ? ' typeahead__item--highlighted' : ''}`}
      role="option"
      aria-selected={isSelected}
      onClick={() => select(value)}
    >
      {children}
    </li>
  )
}

export const TypeaheadEmpty = ({ typeahead: { isOpen = true, filteredOptions = [] } = {}, children = 'No options found' }) => {
  if (!isOpen) return null
  if (filteredOptions.length > 0) return null

  return <div className="typeahead__empty">{children}</div>
}

export const TypeaheadList = ({
  typeahead: { isOpen = true, filteredOptions = [], highlightedIndex = -1, select = () => {}, selected } = {},
  children,
}) => {
  if (!isOpen || filteredOptions.length === 0) return null

  const items = Children.count(children) > 0
    ? Children.toArray(children).filter((child) =>
      filteredOptions.some((option) => option.value === child.props.value)
    )
    : filteredOptions.map((option) => (
      <TypeaheadItem key={String(option.value ?? 'null')} value={option.value}>
        {option.displayValue}
      </TypeaheadItem>
    ))

  const enhanced = items.map((child, index) =>
    cloneElement(child, {
      typeahead: { filteredOptions, highlightedIndex, select, selected, highlighted: index === highlightedIndex },
    })
  )

  return (
    <ul className="typeahead__list" role="listbox">
      {enhanced}
    </ul>
  )
}

export const TypeaheadDisplay = ({
  isOpen = false,
  open = () => {},
  close = () => {},
  openOnFocus = false,
  query = '',
  setQuery = () => {},
  clearQuery = () => {},
  complete = () => {},
  selected = '',
  select = () => {},
  options = [],
  filteredOptions = [],
  highlightedIndex = -1,
  containerRef,
  handleKeyDown,
  children,
}) => {
  const typeahead = {
    isOpen,
    open,
    close,
    query,
    setQuery,
    clearQuery,
    complete,
    selected,
    select,
    options,
    filteredOptions,
    highlightedIndex,
  }

  const enhanced = Children.map(children, (child) =>
    cloneElement(child, { typeahead })
  )

  return (
    <div
      className={`typeahead${openOnFocus ? ' typeahead--dropdown' : ''}`}
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      {enhanced}
    </div>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const withTypeahead = (WrappedComponent) => ({
  defaultValue = '',
  options = [],
  filterOptions = defaultFilterOptions,
  limit = 100,
  openOnFocus = false,
  select: change,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(!openOnFocus)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(defaultValue)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef(null)
  const matched = filterOptions(options, query)
  const filteredOptions = limit > 0 ? matched.slice(0, limit) : matched
  const Component = WrappedComponent

  const open = () => setIsOpen(true)
  const close = () => {
    if (openOnFocus) setIsOpen(false)
  }

  useEffect(() => {
    setSelected(defaultValue)
  }, [defaultValue])

  useEffect(() => {
    setHighlightedIndex((prev) => {
      if (filteredOptions.length === 0) return -1
      if (prev >= 0 && prev < filteredOptions.length) return prev
      return 0
    })
  }, [filteredOptions.length])

  const clearQuery = () => {
    setQuery('')
  }

  const complete = () => {
    const completion = prefixCompletion(options, query)
    if (!completion) return false

    setQuery(completion)
    setIsOpen(true)
    return true
  }

  const select = (value) => {
    setSelected(value)
    if (openOnFocus) setIsOpen(false)
    if (change) change(value)
  }

  const handleKeyDown = (e) => {
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
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          select(filteredOptions[highlightedIndex].value)
        }
        break
      case 'Tab':
        // Only swallow Tab when it completes something, otherwise focus moves on
        if (!e.shiftKey && complete()) e.preventDefault()
        break
      case 'Escape':
        e.preventDefault()
        clearQuery()
        close()
        break
      default:
        break
    }
  }

  useEffect(() => {
    if (!openOnFocus || !isOpen) return

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openOnFocus, isOpen])

  return (
    <Component
      isOpen={isOpen}
      open={open}
      close={close}
      openOnFocus={openOnFocus}
      containerRef={containerRef}
      query={query}
      setQuery={setQuery}
      clearQuery={clearQuery}
      complete={complete}
      selected={selected}
      select={select}
      options={options}
      filteredOptions={filteredOptions}
      highlightedIndex={highlightedIndex}
      handleKeyDown={handleKeyDown}
      {...props}
    />
  )
}

const Typeahead = withTypeahead(TypeaheadDisplay)
export default Typeahead
