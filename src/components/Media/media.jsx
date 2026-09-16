import { Children, cloneElement, useRef } from 'react'
import MediaMagnifier from '../MediaMagnifier/mediaMagnifier'
import './styles.css'

// ── Icons (internal) ────────────────────────────────────────

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <circle cx="12" cy="12" r="10" fill="#000000" opacity="0.55" />
    <polygon points="10 8 16 12 10 16 10 8" />
  </svg>
)

const AudioIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
)

const DocumentIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M8 13h8" />
    <path d="M8 17h5" />
  </svg>
)

const PlaceholderIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
)

// ── Per-type renderers (internal) ───────────────────────────

const isGif = (src, extension) => {
  if (extension) return extension.toLowerCase() === 'gif'
  if (!src) return false
  return /\.gif(\?|#|$)/i.test(src)
}

const MediaImage = ({ src, extension, variant, magnify = true }) => {
  if (!src) {
    return (
      <div className="media__placeholder">
        <PlaceholderIcon />
      </div>
    )
  }

  return (
    <>
      <img
        src={src}
        alt=""
        className="media__image"
        loading={variant === 'full' ? 'eager' : 'lazy'}
        decoding="async"
      />
      {variant === 'full' && magnify && (
        <MediaMagnifier src={src} {...(typeof magnify === 'object' ? magnify : {})} />
      )}
      {variant !== 'full' && isGif(src, extension) && (
        <div className="media__overlay">
          <PlayIcon />
        </div>
      )}
    </>
  )
}

const MediaVideo = ({ src, poster, variant }) => {
  const playPromiseRef = useRef(null)

  if (!src) {
    return (
      <div className="media__placeholder">
        <PlaceholderIcon />
      </div>
    )
  }

  if (variant === 'full') {
    return <video src={src} poster={poster} className="media__video" controls autoPlay loop playsInline />
  }

  const handleEnter = (e) => {
    const p = e.target.play()
    playPromiseRef.current = p
    if (p && typeof p.catch === 'function') p.catch(() => {})
  }

  const handleLeave = (e) => {
    const video = e.target
    const pending = playPromiseRef.current
    if (pending && typeof pending.then === 'function') {
      pending
        .then(() => {
          video.pause()
          video.currentTime = 0
        })
        .catch(() => {})
    } else {
      video.pause()
      video.currentTime = 0
    }
  }

  return (
    <>
      <video
        src={src}
        poster={poster}
        className="media__video"
        muted
        loop
        playsInline
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      />
      <div className="media__overlay">
        <PlayIcon />
      </div>
    </>
  )
}

const MediaAudio = ({ src, extension, variant }) => {
  if (!src) {
    return (
      <div className="media__placeholder">
        <PlaceholderIcon />
      </div>
    )
  }

  return (
    <>
      <div className="media__placeholder">
        <AudioIcon />
        {extension && (
          <span className="media__extension">{extension.toUpperCase()}</span>
        )}
      </div>
      {variant === 'full' && (
        <audio src={src} className="media__audio" controls autoPlay />
      )}
    </>
  )
}

const MediaDocument = ({ src, extension, variant }) => (
  <>
    <div className="media__placeholder">
      <DocumentIcon />
      {extension && (
        <span className="media__extension">{extension.toUpperCase()}</span>
      )}
    </div>
    {variant === 'full' && src && (
      <a href={src} target="_blank" rel="noopener noreferrer" className="media__document-link">
        Open Document
      </a>
    )}
  </>
)

// ── Renderer map ────────────────────────────────────────────

const RENDERERS = {
  image: MediaImage,
  video: MediaVideo,
  audio: MediaAudio,
  document: MediaDocument,
}

// ── Public API ──────────────────────────────────────────────

/**
 * Media — self-contained media renderer.
 *
 * Pass a file in (src + type), get the correct display out.
 * Dispatches to a per-type renderer via the RENDERERS map.
 * Each renderer fully owns its element, overlays, and placeholder.
 *
 * Children are the operations layer (popups, reorder, tooltips, etc.);
 * each receives media:{ src, type, variant } via cloneElement.
 */
const Media = ({
  src,
  type = 'image',
  alt = '',
  variant = 'thumbnail',
  extension,
  poster,
  className,
  children,
  magnify = true,
}) => {
  const Renderer = RENDERERS[type] || RENDERERS.image

  const enhanced = children
    ? Children.map(children, (child) =>
        cloneElement(child, { media: { src, type, variant } })
      )
    : null

  return (
    <div className={`media media--${type} media--${variant}${!src ? ' media--empty' : ''}${className ? ` ${className}` : ''}`}>
      <Renderer src={src} alt={alt} variant={variant} extension={extension} poster={poster} magnify={magnify} />
      {enhanced}
    </div>
  )
}

export default Media

