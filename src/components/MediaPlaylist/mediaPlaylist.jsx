import { Children, cloneElement, isValidElement, useState } from 'react'
import Media from '../Media/media'
import { withViewSwitch } from '../ViewSwitch/viewSwitch'
import './styles.css'

const getDefaultMedia = (item) => item || {}
const getDefaultItemKey = (item, index) => item?.id ?? index
const getDefaultTitle = (item, index) => item?.title || `Video ${index + 1}`

// ── Icons (internal) ────────────────────────────────────────

const PreviousIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <polygon points="19 5 9 12 19 19 19 5" />
    <rect x="5" y="5" width="2.5" height="14" />
  </svg>
)

const NextIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <polygon points="5 5 15 12 5 19 5 5" />
    <rect x="16.5" y="5" width="2.5" height="14" />
  </svg>
)

const AutoPlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M17 2l4 4-4 4" />
    <path d="M3 11V9a3 3 0 0 1 3-3h15" />
    <path d="M7 22l-4-4 4-4" />
    <path d="M21 13v2a3 3 0 0 1-3 3H3" />
  </svg>
)

const PlaylistIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="3" y1="6" x2="15" y2="6" />
    <line x1="3" y1="12" x2="15" y2="12" />
    <line x1="3" y1="18" x2="11" y2="18" />
    <polygon points="16 14 22 17.5 16 21 16 14" fill="currentColor" />
  </svg>
)

// ── Parts ───────────────────────────────────────────────────

/**
 * MediaPlaylistPlayer — the active video, rendered through Media.
 *
 * Remounts per track so each video starts from the beginning, and
 * calls advance() when playback ends.
 */
export const MediaPlaylistPlayer = ({
  mediaPlaylist: { item, index = 0, advance = () => {}, getMedia = getDefaultMedia } = {},
}) => (
  <div className="media-playlist__player">
    {item && (
      <Media
        key={index}
        type="video"
        {...getMedia(item, index)}
        variant="full"
        loop={false}
        onEnded={advance}
      />
    )}
  </div>
)

/**
 * MediaPlaylistControls — previous / next, now playing, and the
 * autoplay + playlist view toggles.
 */
export const MediaPlaylistControls = ({
  mediaPlaylist: {
    item,
    index = 0,
    count = 0,
    next = () => {},
    back = () => {},
    hasPrevious = false,
    hasNext = false,
    isAutoPlay = true,
    toggleAutoPlay = () => {},
    isQueueOpen = true,
    toggleQueue = () => {},
    getTitle = getDefaultTitle,
  } = {},
}) => (
  <div className="media-playlist__controls">
    <button
      type="button"
      className="media-playlist__button"
      onClick={back}
      disabled={!hasPrevious}
      aria-label="Previous video"
    >
      <PreviousIcon />
    </button>
    <button
      type="button"
      className="media-playlist__button"
      onClick={next}
      disabled={!hasNext}
      aria-label="Next video"
    >
      <NextIcon />
    </button>
    <div className="media-playlist__now-playing">
      <span className="media-playlist__title">{item ? getTitle(item, index) : ''}</span>
      <span className="media-playlist__counter">{count ? `${index + 1} / ${count}` : '0 / 0'}</span>
    </div>
    <button
      type="button"
      className={`media-playlist__button media-playlist__button--toggle${isAutoPlay ? ' media-playlist__button--active' : ''}`}
      onClick={toggleAutoPlay}
      aria-pressed={isAutoPlay}
      title="Autoplay next video"
    >
      <AutoPlayIcon />
      <span>Autoplay</span>
    </button>
    <button
      type="button"
      className={`media-playlist__button media-playlist__button--toggle${isQueueOpen ? ' media-playlist__button--active' : ''}`}
      onClick={toggleQueue}
      aria-pressed={isQueueOpen}
      title={isQueueOpen ? 'Hide playlist' : 'Show playlist'}
    >
      <PlaylistIcon />
      <span>Playlist</span>
    </button>
  </div>
)

/**
 * MediaPlaylistQueue — the playlist view. Lists every video with a
 * hover-preview thumbnail; clicking one jumps to it.
 */
export const MediaPlaylistQueue = ({
  mediaPlaylist: {
    items = [],
    index = 0,
    select = () => {},
    isQueueOpen = true,
    getMedia = getDefaultMedia,
    getItemKey = getDefaultItemKey,
    getTitle = getDefaultTitle,
  } = {},
}) => {
  if (!isQueueOpen) return null

  return (
    <ol className="media-playlist__queue">
      {items.map((item, itemIndex) => {
        const { src, poster } = getMedia(item, itemIndex)
        const isActive = itemIndex === index

        return (
          <li key={getItemKey(item, itemIndex)}>
            <button
              type="button"
              className={`media-playlist__queue-item${isActive ? ' media-playlist__queue-item--active' : ''}`}
              onClick={() => select(itemIndex)}
              aria-current={isActive ? 'true' : undefined}
            >
              <span className="media-playlist__queue-index">{itemIndex + 1}</span>
              <span className="media-playlist__queue-thumb">
                <Media src={src} poster={poster} type="video" />
              </span>
              <span className="media-playlist__queue-title">{getTitle(item, itemIndex)}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

// ── Display ─────────────────────────────────────────────────

/**
 * MediaPlaylistDisplay — pure display controller.
 *
 * Children receive mediaPlaylist:{ items, item, index, count, select, next,
 * back, hasPrevious, hasNext, advance, isAutoPlay, toggleAutoPlay,
 * isQueueOpen, toggleQueue, getMedia, getItemKey, getTitle } via cloneElement.
 * With no children, renders Player, Controls, and Queue.
 */
export const MediaPlaylistDisplay = ({
  items = [],
  getMedia = getDefaultMedia,
  getItemKey = getDefaultItemKey,
  getTitle = getDefaultTitle,
  index = 0,
  count = 0,
  select = () => {},
  next = () => {},
  back = () => {},
  loop = false,
  isAutoPlay = true,
  toggleAutoPlay = () => {},
  isQueueOpen = true,
  toggleQueue = () => {},
  className,
  children,
}) => {
  const item = items[index]
  const hasPrevious = count > 1 && (loop || index > 0)
  const hasNext = count > 1 && (loop || index < count - 1)
  const advance = () => {
    if (isAutoPlay && hasNext) next()
  }

  const mediaPlaylist = {
    items, item, index, count, select, next, back, hasPrevious, hasNext, advance,
    isAutoPlay, toggleAutoPlay, isQueueOpen, toggleQueue, getMedia, getItemKey, getTitle,
  }

  const parts = children ?? [
    <MediaPlaylistPlayer key="player" />,
    <MediaPlaylistControls key="controls" />,
    <MediaPlaylistQueue key="queue" />,
  ]
  const enhanced = Children.map(parts, (child) =>
    isValidElement(child) ? cloneElement(child, { mediaPlaylist }) : child
  )

  return (
    <div className={`media-playlist${isQueueOpen ? '' : ' media-playlist--queue-closed'}${className ? ` ${className}` : ''}`}>
      {enhanced}
    </div>
  )
}

// ── State ───────────────────────────────────────────────────

export const withMediaPlaylist = (WrappedComponent) => ({ defaultAutoPlay = true, defaultQueueOpen = true, ...props }) => {
  const [isAutoPlay, setIsAutoPlay] = useState(defaultAutoPlay)
  const [isQueueOpen, setIsQueueOpen] = useState(defaultQueueOpen)

  const toggleAutoPlay = () => setIsAutoPlay((prev) => !prev)
  const toggleQueue = () => setIsQueueOpen((prev) => !prev)

  return (
    <WrappedComponent
      isAutoPlay={isAutoPlay}
      toggleAutoPlay={toggleAutoPlay}
      isQueueOpen={isQueueOpen}
      toggleQueue={toggleQueue}
      {...props}
    />
  )
}

const MediaPlaylistWithViewSwitch = withViewSwitch(withMediaPlaylist(MediaPlaylistDisplay))

/**
 * MediaPlaylist — plays an array of videos in order.
 *
 * items: [{ src, poster?, title? }] (or map with getMedia / getTitle)
 * Supports defaultIndex, controlled index + onSelect, loop,
 * defaultAutoPlay, and defaultQueueOpen.
 */
const MediaPlaylist = ({ items = [], ...props }) => (
  <MediaPlaylistWithViewSwitch items={items} count={items.length} {...props} />
)

export default MediaPlaylist
