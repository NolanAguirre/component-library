import { useEffect, useState } from 'react'
import './styles.css'

const ELLIPSIS = 'ellipsis'

/**
 * Build a compact list of page numbers with ellipsis gaps.
 * Always shows first/last and a window around the current page.
 */
const buildPageItems = (page, totalPages, siblings = 1) => {
  if (totalPages <= 1) {
    return [1]
  }

  const pages = new Set([1, totalPages])
  for (let i = page - siblings; i <= page + siblings; i += 1) {
    if (i >= 1 && i <= totalPages) {
      pages.add(i)
    }
  }

  const sorted = Array.from(pages).sort((a, b) => a - b)
  const items = []
  let previous = 0

  sorted.forEach((value) => {
    if (value - previous > 1) {
      items.push(ELLIPSIS)
    }
    items.push(value)
    previous = value
  })

  return items
}

/**
 * PaginationDisplay — pure display controller for page navigation.
 *
 * Props:
 *   page        {number}   — current page (1-based)
 *   totalPages  {number}   — total number of pages
 *   next        {function} — advance one page
 *   back        {function} — retreat one page
 *   goTo        {function} — jump to a specific page
 *   siblings    {number}   — page numbers shown either side of current (default: 1)
 */
export const PaginationDisplay = ({
  page = 1,
  totalPages = 1,
  next = () => {},
  back = () => {},
  goTo = () => {},
  siblings = 1,
}) => {
  const items = buildPageItems(page, totalPages, siblings)

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="pagination__arrow"
        onClick={back}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        ‹
      </button>

      {items.map((item, index) =>
        item === ELLIPSIS ? (
          <span key={`ellipsis-${index}`} className="pagination__ellipsis">…</span>
        ) : (
          <button
            key={item}
            type="button"
            className={`pagination__page${item === page ? ' pagination__page--active' : ''}`}
            onClick={() => goTo(item)}
            aria-current={item === page ? 'page' : undefined}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        className="pagination__arrow"
        onClick={next}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  )
}

/**
 * withPagination — state controller HOC.
 *
 * Manages the current page (1-based) and exposes navigation actions. Computes
 * totalPages from either an explicit `totalPages` prop or `totalItems` +
 * `pageSize`. Calls `change(page)` whenever the page changes so the consumer
 * can slice its own data (pairs with Grid / Map).
 *
 * Props supplied to the wrapped component:
 *   page, totalPages, next, back, goTo
 */
export const withPagination = (WrappedComponent) => ({
  defaultPage = 1,
  totalPages: totalPagesProp,
  totalItems = 0,
  pageSize = 10,
  change = () => {},
  ...props
}) => {
  const totalPages = Math.max(
    1,
    totalPagesProp ?? Math.ceil(totalItems / Math.max(pageSize, 1)),
  )
  const [page, setPage] = useState(defaultPage)

  useEffect(() => {
    setPage((prev) => Math.min(Math.max(prev, 1), totalPages))
  }, [totalPages])

  const update = (value) => {
    const clamped = Math.min(Math.max(value, 1), totalPages)
    setPage(clamped)
    change(clamped)
  }

  const next = () => update(page + 1)
  const back = () => update(page - 1)
  const goTo = (value) => update(value)

  return (
    <WrappedComponent
      page={page}
      totalPages={totalPages}
      next={next}
      back={back}
      goTo={goTo}
      {...props}
    />
  )
}

/**
 * Pagination — convenience default export using withPagination around
 * PaginationDisplay.
 */
const Pagination = withPagination(PaginationDisplay)

export default Pagination
