import { Children, cloneElement, createElement, isValidElement, useCallback, useEffect, useRef, useState } from 'react'
import Media from '../Media/media'
import MediaCompare from '../MediaCompare/mediaCompare'
import { DevScope } from '../DevInspector/devInspector'
import { PopupDisplay } from '../Popup/popup'
import { ViewSwitchBack, ViewSwitchNext, withViewSwitch } from '../ViewSwitch/viewSwitch'
import './styles.css'

const getDefaultMedia = (item) => item || {}
const HORIZONTAL_WHEEL_THRESHOLD = 24
const HORIZONTAL_WHEEL_INTENT_RATIO = 1.35
const WHEEL_NAVIGATION_COOLDOWN_MS = 450
const HORIZONTAL_SWIPE_THRESHOLD = 48
const HORIZONTAL_SWIPE_INTENT_RATIO = 1.35
const SWIPE_NAVIGATION_COOLDOWN_MS = 450

const DetailsToggleIcon = ({ isOpen }) => (
  <svg className="media-lightbox__details-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {isOpen ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
)

export const MediaLightboxDisplay = ({
  items = [],
  getMedia = getDefaultMedia,
  getItemKey = (item, index) => item?.id || item?.url || index,
  index = 0,
  count = 0,
  select = () => {},
  next = () => {},
  back = () => {},
  close = () => {},
  isDetailsOpen = true,
  toggleDetails = () => {},
  isBottomOpen = true,
  toggleBottom = () => {},
  isCountVisible = true,
  toggleCount = () => {},
  detailsLabel = 'Details',
  renderOverlay,
  renderMeta,
  renderLeft,
  renderRight,
  renderMedia = ({ mediaProps }) => <Media {...mediaProps} variant="full" className="media-lightbox__media" />,
  loop = false,
  isComparing = false,
  compare,
  compareWith = () => {},
  exitCompare = () => {},
  previewItem = null,
  isPreviewFlipped = false,
  previewLabel,
  previewFlippedLabel,
  preview = () => {},
  clearPreview = () => {},
  lightboxRef,
  devId = 's3h9d6b',
  children,
}) => {
  const item = items[index]
  const activeItem = (!isComparing && previewItem && !isPreviewFlipped) ? previewItem : item
  const mediaProps = activeItem ? getMedia(activeItem, index) : {}
  const previewStatusLabel = (!isComparing && previewItem)
    ? (isPreviewFlipped
      ? (previewFlippedLabel || 'Original')
      : (previewLabel || 'Variant'))
    : null
  const viewSwitch = { index, count, select, next, back, loop }
  const selectAfterRemoval = () => {
    if (count <= 1) {
      close()
    } else if (index >= count - 1) {
      select(index - 1)
    } else {
      select(index)
    }
  }
  const mediaLightbox = { item, index, count, close, select, next, back, selectAfterRemoval, isDetailsOpen, toggleDetails, isBottomOpen, toggleBottom, isComparing, compare, compareWith, exitCompare, previewItem, isPreviewFlipped, preview, clearPreview }
  const overlay = renderOverlay ? renderOverlay(mediaLightbox) : null
  const childList = Children.toArray(children)
  const hasDetails = childList.length > 0
  const enhancedChildren = childList.map((child) =>
    isValidElement(child) ? cloneElement(child, { mediaLightbox }) : child
  )

  if (!item) return null

  return (
    <PopupDisplay
      isOpen
      close={close}
      lockScroll
      backdropClassName="popup__backdrop--lightbox"
      panelClassName="popup__panel--lightbox"
      devId={devId}
    >
      <div className="media-lightbox" key={getItemKey(item, index)} ref={lightboxRef}>
        <ViewSwitchBack viewSwitch={viewSwitch} />
        <div className="media-lightbox__content">
          <DevScope id="p2v4n8x" state={{ index, count, isDetailsOpen }}>
            <div className={`media-lightbox__meta${renderMeta ? ' media-lightbox__meta--actions' : ''}`}>
              <button
                type="button"
                className={`media-lightbox__counter${isCountVisible ? '' : ' media-lightbox__counter--hidden'}`}
                onClick={toggleCount}
                aria-pressed={isCountVisible}
                aria-label={isCountVisible ? 'Hide count' : 'Show count'}
              >
                {isCountVisible ? `${index + 1} / ${count}` : '#'}
              </button>
              {hasDetails && (
                <button
                  type="button"
                  className={`media-lightbox__details-toggle${isDetailsOpen ? ' media-lightbox__details-toggle--open' : ''}`}
                  onClick={toggleDetails}
                  aria-expanded={isDetailsOpen}
                  aria-label={isDetailsOpen ? `Hide ${detailsLabel}` : `Show ${detailsLabel}`}
                >
                  <DetailsToggleIcon isOpen={isDetailsOpen} />
                </button>
              )}
              {renderMeta ? renderMeta(mediaLightbox) : null}
            </div>
          </DevScope>
          {overlay && (
            <DevScope id="w6t1j3f">
              <div className="media-lightbox__overlay">
                {overlay}
              </div>
            </DevScope>
          )}
          <div className="media-lightbox__stage">
            {isDetailsOpen && renderLeft && (
              <DevScope id="c8k5m2a">
                <div className="media-lightbox__side media-lightbox__side--left">{renderLeft(mediaLightbox)}</div>
              </DevScope>
            )}
            {isDetailsOpen && !renderLeft && renderRight && (
              <div className="media-lightbox__side media-lightbox__side--left media-lightbox__side--spacer" aria-hidden />
            )}
            <DevScope id="r1b7q4h" state={{ isComparing, previewing: Boolean(previewItem), isPreviewFlipped }}>
              <div className="media-lightbox__media-container">
                {previewStatusLabel && (
                  <div className="media-lightbox__preview-label">{previewStatusLabel}</div>
                )}
                {renderMedia({ ...mediaLightbox, mediaProps })}
              </div>
            </DevScope>
            {isDetailsOpen && renderRight && (
              <DevScope id="y5n0s8d">
                <div className="media-lightbox__side media-lightbox__side--right">{renderRight(mediaLightbox)}</div>
              </DevScope>
            )}
            {isDetailsOpen && !renderRight && renderLeft && (
              <div className="media-lightbox__side media-lightbox__side--right media-lightbox__side--spacer" aria-hidden />
            )}
          </div>
          {hasDetails && isDetailsOpen && (
            <DevScope id="g3w6l9p" state={{ isBottomOpen }}>
              <div className="media-lightbox__bottom">
                <button
                  type="button"
                  className={`media-lightbox__bottom-toggle${isBottomOpen ? ' media-lightbox__bottom-toggle--open' : ''}`}
                  onClick={toggleBottom}
                  aria-expanded={isBottomOpen}
                  aria-label={isBottomOpen ? `Collapse ${detailsLabel}` : `Expand ${detailsLabel}`}
                >
                  <span className="media-lightbox__bottom-toggle-arrow" />
                </button>
                {isBottomOpen && (
                  <div className="media-lightbox__details media-lightbox__details--open">
                    {enhancedChildren}
                  </div>
                )}
              </div>
            </DevScope>
          )}
        </div>
        <ViewSwitchNext viewSwitch={viewSwitch} />
      </div>
    </PopupDisplay>
  )
}

const withMediaLightboxDetails = (WrappedComponent) => ({ defaultDetailsOpen = true, defaultBottomOpen = true, defaultCountVisible = true, ...props }) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(defaultDetailsOpen)
  const [isBottomOpen, setIsBottomOpen] = useState(defaultBottomOpen)
  const [isCountVisible, setIsCountVisible] = useState(defaultCountVisible)

  const toggleDetails = () => setIsDetailsOpen((prev) => !prev)
  const toggleBottom = () => setIsBottomOpen((prev) => !prev)
  const toggleCount = () => setIsCountVisible((prev) => !prev)

  return createElement(WrappedComponent, { isDetailsOpen, toggleDetails, isBottomOpen, toggleBottom, isCountVisible, toggleCount, ...props })
}

const withMediaLightboxCompare = (WrappedComponent) => ({
  items = [],
  getMedia = getDefaultMedia,
  index = 0,
  count = 0,
  next = () => {},
  back = () => {},
  loop = false,
  renderMedia,
  renderCompareActions,
  ...props
}) => {
  const [isComparing, setIsComparing] = useState(false)
  const [compareBaseIndex, setCompareBaseIndex] = useState(0)
  const [compareOverlayIndex, setCompareOverlayIndex] = useState(0)
  const [explicitOverlayItem, setExplicitOverlayItem] = useState(null)

  const compare = count > 1
    ? () => {
      setCompareBaseIndex(index)
      setCompareOverlayIndex((index + 1) % count)
      setExplicitOverlayItem(null)
      setIsComparing(true)
    }
    : undefined

  const compareWith = (overlayItem) => {
    if (!overlayItem) return
    setCompareBaseIndex(index)
    setExplicitOverlayItem(overlayItem)
    setIsComparing(true)
  }

  const exitCompare = () => {
    setIsComparing(false)
    setCompareBaseIndex(0)
    setCompareOverlayIndex(0)
    setExplicitOverlayItem(null)
  }

  const cycleOverlay = (delta) => {
    if (count === 0) return
    setCompareOverlayIndex((prev) => (((prev + delta) % count) + count) % count)
  }

  const sharedProps = { items, getMedia, index, count, isComparing, compare, compareWith, exitCompare, ...props }

  if (!isComparing) {
    return createElement(WrappedComponent, { ...sharedProps, next, back, loop, renderMedia })
  }

  const isExplicit = !!explicitOverlayItem
  const baseItem = items[compareBaseIndex]
  const overlayItem = explicitOverlayItem || items[compareOverlayIndex]
  const nextOverlay = isExplicit ? () => {} : () => cycleOverlay(1)
  const compareActions = renderCompareActions
    ? renderCompareActions({ baseItem, overlayItem, exitCompare, nextOverlay })
    : undefined

  const renderCompareMedia = () => (
    <MediaCompare
      base={baseItem}
      overlay={overlayItem}
      getMedia={getMedia}
      actions={compareActions}
    />
  )

  return createElement(WrappedComponent, {
    ...sharedProps,
    next: isExplicit ? () => {} : () => cycleOverlay(1),
    back: isExplicit ? () => {} : () => cycleOverlay(-1),
    loop: true,
    renderMedia: renderCompareMedia,
  })
}

const withMediaLightboxPreview = (WrappedComponent) => ({
  index = 0,
  isComparing = false,
  items = [],
  getPreviewItems,
  getPreviewOptions,
  getItemKey = (item, itemIndex) => item?.id || item?.url || itemIndex,
  next = () => {},
  back = () => {},
  loop = false,
  ...props
}) => {
  const [previewItem, setPreviewItem] = useState(null)
  const [previewLabels, setPreviewLabels] = useState({})
  const [isPreviewFlipped, setIsPreviewFlipped] = useState(false)

  const preview = useCallback((item, options = {}) => {
    setPreviewItem(item || null)
    setPreviewLabels({ label: options?.label, flippedLabel: options?.flippedLabel })
  }, [])
  const clearPreview = useCallback(() => {
    setPreviewItem(null)
    setPreviewLabels({})
  }, [])

  useEffect(() => {
    setPreviewItem(null)
  }, [index])

  useEffect(() => {
    if (isComparing) setPreviewItem(null)
  }, [isComparing])

  useEffect(() => {
    if (!previewItem) {
      setIsPreviewFlipped(false)
      return undefined
    }

    const isSpace = (event) => event.code === 'Space' || event.key === ' '
    const isEditable = (target) => {
      const tag = target?.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable
    }

    const handleKeyDown = (event) => {
      if (!isSpace(event)) return
      if (isEditable(event.target)) return
      // Suppress default Space (page scroll + activation of any focused button)
      // for the whole hold gesture, matching MediaCompare's flip.
      event.preventDefault()
      if (event.repeat) return
      setIsPreviewFlipped(true)
    }

    const handleKeyUp = (event) => {
      if (!isSpace(event)) return
      if (isEditable(event.target)) return
      event.preventDefault()
      setIsPreviewFlipped(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      setIsPreviewFlipped(false)
    }
  }, [previewItem])

  const primaryItem = items[index]
  const previewItems = (!isComparing && getPreviewItems && primaryItem)
    ? (getPreviewItems(primaryItem, index) || [])
    : []
  const hasPreviewNav = !!previewItem && previewItems.length > 0

  const cyclePreview = (delta) => {
    const currentIndex = previewItems.findIndex((item, itemIndex) => getItemKey(item, itemIndex) === getItemKey(previewItem))
    const ringLength = previewItems.length
    if (ringLength === 0) return
    const resolvedIndex = currentIndex < 0 ? 0 : currentIndex
    const nextIndex = ((resolvedIndex + delta) % ringLength + ringLength) % ringLength
    const nextItem = previewItems[nextIndex]
    const options = getPreviewOptions ? getPreviewOptions(nextItem, primaryItem) : {}
    preview(nextItem, options)
  }

  return createElement(WrappedComponent, {
    index,
    isComparing,
    items,
    getItemKey,
    previewItem,
    isPreviewFlipped,
    previewLabel: previewLabels.label,
    previewFlippedLabel: previewLabels.flippedLabel,
    preview,
    clearPreview,
    next: hasPreviewNav ? () => cyclePreview(1) : next,
    back: hasPreviewNav ? () => cyclePreview(-1) : back,
    loop: hasPreviewNav ? true : loop,
    ...props,
  })
}

const withMediaLightboxWheelNavigation = (WrappedComponent) => ({
  index = 0,
  count = 0,
  next = () => {},
  back = () => {},
  loop = false,
  lightboxRef: externalLightboxRef,
  ...props
}) => {
  const localLightboxRef = useRef(null)
  const lightboxRef = externalLightboxRef || localLightboxRef
  const wheelNavigationTimeout = useRef(null)

  useEffect(() => () => {
    if (wheelNavigationTimeout.current) {
      clearTimeout(wheelNavigationTimeout.current)
    }
  }, [])

  const lockWheelNavigation = useCallback(() => {
    wheelNavigationTimeout.current = setTimeout(() => {
      wheelNavigationTimeout.current = null
    }, WHEEL_NAVIGATION_COOLDOWN_MS)
  }, [])

  const handleWheelNavigation = useCallback((event) => {
    if (event.ctrlKey || event.metaKey) return
    if (event.target?.closest?.('.media-lightbox__details')) return

    const horizontalDelta = Math.abs(event.deltaX)
    const verticalDelta = Math.abs(event.deltaY)
    const hasHorizontalIntent = horizontalDelta >= HORIZONTAL_WHEEL_THRESHOLD
      && horizontalDelta > verticalDelta * HORIZONTAL_WHEEL_INTENT_RATIO

    if (!hasHorizontalIntent) return

    event.preventDefault()
    event.stopPropagation()

    if (wheelNavigationTimeout.current) return
    if (count <= 1 && !loop) return

    lockWheelNavigation()

    if (event.deltaX > 0 && (loop || index < count - 1)) {
      next()
      return
    }

    if (event.deltaX < 0 && (loop || index > 0)) {
      back()
    }
  }, [back, count, index, lockWheelNavigation, loop, next])

  useEffect(() => {
    const lightboxElement = lightboxRef.current
    if (!lightboxElement) return undefined

    lightboxElement.addEventListener('wheel', handleWheelNavigation, { passive: false })

    return () => {
      lightboxElement.removeEventListener('wheel', handleWheelNavigation)
    }
  }, [handleWheelNavigation, lightboxRef])

  return createElement(WrappedComponent, {
    index,
    count,
    next,
    back,
    loop,
    lightboxRef,
    ...props,
  })
}

const withMediaLightboxSwipeNavigation = (WrappedComponent) => ({
  index = 0,
  count = 0,
  next = () => {},
  back = () => {},
  loop = false,
  lightboxRef: externalLightboxRef,
  ...props
}) => {
  const localLightboxRef = useRef(null)
  const lightboxRef = externalLightboxRef || localLightboxRef
  const touchStartRef = useRef(null)
  const swipeNavigationTimeout = useRef(null)

  useEffect(() => () => {
    if (swipeNavigationTimeout.current) {
      clearTimeout(swipeNavigationTimeout.current)
    }
  }, [])

  const lockSwipeNavigation = useCallback(() => {
    swipeNavigationTimeout.current = setTimeout(() => {
      swipeNavigationTimeout.current = null
    }, SWIPE_NAVIGATION_COOLDOWN_MS)
  }, [])

  const clearTouchStart = useCallback(() => {
    touchStartRef.current = null
  }, [])

  const handleTouchStart = useCallback((event) => {
    if (event.touches.length !== 1) {
      clearTouchStart()
      return
    }
    if (event.target?.closest?.('.media-lightbox__details')) {
      clearTouchStart()
      return
    }

    const touch = event.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    }
  }, [clearTouchStart])

  const handleTouchMove = useCallback((event) => {
    if (!touchStartRef.current || event.touches.length !== 1) return

    const touch = event.touches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const horizontalDelta = Math.abs(deltaX)
    const verticalDelta = Math.abs(deltaY)
    const hasHorizontalIntent = horizontalDelta >= HORIZONTAL_SWIPE_THRESHOLD
      && horizontalDelta > verticalDelta * HORIZONTAL_SWIPE_INTENT_RATIO

    if (!hasHorizontalIntent) return

    event.preventDefault()
  }, [])

  const handleTouchEnd = useCallback((event) => {
    const start = touchStartRef.current
    clearTouchStart()
    if (!start) return
    if (event.changedTouches.length !== 1) return
    if (swipeNavigationTimeout.current) return
    if (count <= 1 && !loop) return

    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - start.x
    const deltaY = touch.clientY - start.y
    const horizontalDelta = Math.abs(deltaX)
    const verticalDelta = Math.abs(deltaY)
    const hasHorizontalIntent = horizontalDelta >= HORIZONTAL_SWIPE_THRESHOLD
      && horizontalDelta > verticalDelta * HORIZONTAL_SWIPE_INTENT_RATIO

    if (!hasHorizontalIntent) return

    lockSwipeNavigation()

    // Swipe left → next; swipe right → back (standard gallery UX)
    if (deltaX < 0 && (loop || index < count - 1)) {
      next()
      return
    }

    if (deltaX > 0 && (loop || index > 0)) {
      back()
    }
  }, [back, clearTouchStart, count, index, lockSwipeNavigation, loop, next])

  useEffect(() => {
    const lightboxElement = lightboxRef.current
    if (!lightboxElement) return undefined

    lightboxElement.addEventListener('touchstart', handleTouchStart, { passive: true })
    lightboxElement.addEventListener('touchmove', handleTouchMove, { passive: false })
    lightboxElement.addEventListener('touchend', handleTouchEnd, { passive: true })
    lightboxElement.addEventListener('touchcancel', clearTouchStart, { passive: true })

    return () => {
      lightboxElement.removeEventListener('touchstart', handleTouchStart)
      lightboxElement.removeEventListener('touchmove', handleTouchMove)
      lightboxElement.removeEventListener('touchend', handleTouchEnd)
      lightboxElement.removeEventListener('touchcancel', clearTouchStart)
    }
  }, [clearTouchStart, handleTouchEnd, handleTouchMove, handleTouchStart, lightboxRef])

  return createElement(WrappedComponent, {
    index,
    count,
    next,
    back,
    loop,
    lightboxRef,
    ...props,
  })
}

const MediaLightboxWithDetails = withMediaLightboxDetails(MediaLightboxDisplay)
const MediaLightboxWithSwipeNavigation = withMediaLightboxSwipeNavigation(MediaLightboxWithDetails)
const MediaLightboxWithWheelNavigation = withMediaLightboxWheelNavigation(MediaLightboxWithSwipeNavigation)
const MediaLightboxWithPreview = withMediaLightboxPreview(MediaLightboxWithWheelNavigation)
const MediaLightboxWithCompare = withMediaLightboxCompare(MediaLightboxWithPreview)
const MediaLightboxWithViewSwitch = withViewSwitch(MediaLightboxWithCompare)

const MediaLightbox = ({ items = [], ...props }) => {
  return <MediaLightboxWithViewSwitch items={items} count={items.length} {...props} />
}

export default MediaLightbox
