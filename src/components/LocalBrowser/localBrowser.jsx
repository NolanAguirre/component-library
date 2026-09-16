import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import Media from '../Media/media'
import MediaLightbox from '../MediaLightbox/mediaLightbox'
import { DevScope } from '../DevInspector/devInspector'
import './styles.css'

const VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', 'm4v']
const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'm4a']
const COLLAPSED_KEY = 'local-browser-overlay-collapsed'
const PATH_KEY = 'local-browser-overlay-path'
const VIEW_KEY = 'local-browser-view'
const ZOOM_KEY = 'local-browser-zoom'
const FRAME_KEY = 'local-browser-overlay-frame'
const DEFAULT_BASE = (import.meta.env.VITE_LOCAL_BROWSER_BASE || '').replace(/\/+$/, '')
const OVERLAY_MARGIN = 0.75
const MIN_OVERLAY_WIDTH = 16
const MIN_OVERLAY_HEIGHT = 12
const DEFAULT_OVERLAY_WIDTH = 24
const DEFAULT_OVERLAY_HEIGHT = 28
const MIN_ZOOM = 50
const MAX_ZOOM = 200
const ZOOM_STEP = 10
const DEFAULT_ZOOM = 100
const RESIZE_EDGES = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']

const toRelativePath = (value) => {
  const trimmed = (value || '').trim()
  if (!trimmed || trimmed === '.') return ''
  if (!DEFAULT_BASE) return trimmed
  if (trimmed === DEFAULT_BASE || trimmed === `${DEFAULT_BASE}/`) return ''
  if (trimmed.startsWith(`${DEFAULT_BASE}/`)) return trimmed.slice(DEFAULT_BASE.length + 1)
  return trimmed
}

const browseUrl = (apiBase, route, filePath) => {
  const params = new URLSearchParams()
  if (filePath) params.set('path', filePath)
  const query = params.toString()
  const path = `${apiBase}/api/browse${route}`
  return query ? `${path}?${query}` : path
}

const formatSize = (bytes) => {
  if (!bytes) return '--'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

const getMediaType = (file) => {
  const mimeType = file.mime_type || ''
  const extension = (file.extension || '').toLowerCase()
  if (mimeType.startsWith('video/') || VIDEO_EXTENSIONS.includes(extension)) return 'video'
  if (mimeType.startsWith('audio/') || AUDIO_EXTENSIONS.includes(extension)) return 'audio'
  return 'image'
}

const getMediaName = (file) => {
  let displayName = file.display_name || file.name
  if (file.extension && displayName.endsWith(`.${file.extension}`)) {
    displayName = displayName.slice(0, -(file.extension.length + 1))
  }
  const fullName = file.extension ? `${displayName}.${file.extension}` : displayName
  return { displayName, fullName }
}

const rootLabel = (root) => {
  if (!root || root === '/') return '/'
  const parts = root.split('/').filter(Boolean)
  return parts[parts.length - 1] || '/'
}

const FolderIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
  </svg>
)

const ChevronLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const ChevronIcon = ({ up }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points={up ? '6 15 12 9 18 15' : '6 9 12 15 18 9'} />
  </svg>
)

const MoveIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="5 9 2 12 5 15" />
    <polyline points="9 5 12 2 15 5" />
    <polyline points="15 19 12 22 9 19" />
    <polyline points="19 9 22 12 19 15" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="12" y1="2" x2="12" y2="22" />
  </svg>
)

const remPx = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16

const defaultOverlayFrame = () => {
  const margin = OVERLAY_MARGIN * remPx()
  const width = Math.min(DEFAULT_OVERLAY_WIDTH * remPx(), window.innerWidth - margin * 2)
  const height = Math.min(DEFAULT_OVERLAY_HEIGHT * remPx(), window.innerHeight - margin * 2)
  return {
    left: window.innerWidth - width - margin,
    top: margin,
    width,
    height,
  }
}

const clampOverlayFrame = (frame) => {
  const margin = OVERLAY_MARGIN * remPx()
  const minWidth = MIN_OVERLAY_WIDTH * remPx()
  const minHeight = MIN_OVERLAY_HEIGHT * remPx()
  const maxWidth = Math.max(minWidth, window.innerWidth - margin * 2)
  const maxHeight = Math.max(minHeight, window.innerHeight - margin * 2)
  const width = Math.min(Math.max(frame.width, minWidth), maxWidth)
  const height = Math.min(Math.max(frame.height, minHeight), maxHeight)
  const left = Math.min(Math.max(frame.left, margin), window.innerWidth - width - margin)
  const top = Math.min(Math.max(frame.top, margin), window.innerHeight - height - margin)
  return { left, top, width, height }
}

const loadOverlayFrame = () => {
  try {
    const raw = localStorage.getItem(FRAME_KEY)
    if (!raw) return defaultOverlayFrame()
    const parsed = JSON.parse(raw)
    if (![parsed.left, parsed.top, parsed.width, parsed.height].every(Number.isFinite)) {
      return defaultOverlayFrame()
    }
    return clampOverlayFrame(parsed)
  } catch {
    return defaultOverlayFrame()
  }
}

const saveOverlayFrame = (frame) => {
  localStorage.setItem(FRAME_KEY, JSON.stringify(frame))
}

const nextOverlayFrame = (start, dx, dy, edges) => {
  if (!edges) {
    return clampOverlayFrame({
      ...start,
      left: start.left + dx,
      top: start.top + dy,
    })
  }

  const right = start.left + start.width
  const bottom = start.top + start.height
  let width = start.width
  let height = start.height
  let left = start.left
  let top = start.top

  if (edges.includes('e')) width = start.width + dx
  if (edges.includes('s')) height = start.height + dy
  if (edges.includes('w')) {
    width = start.width - dx
    left = right - width
  }
  if (edges.includes('n')) {
    height = start.height - dy
    top = bottom - height
  }

  const clamped = clampOverlayFrame({ left, top, width, height })
  if (edges.includes('w')) clamped.left = right - clamped.width
  if (edges.includes('n')) clamped.top = bottom - clamped.height
  return clampOverlayFrame(clamped)
}

const ImageIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
)

const GridIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
)

const ListIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <rect x="3" y="4" width="3" height="3" rx="0.5" />
    <rect x="3" y="10.5" width="3" height="3" rx="0.5" />
    <rect x="3" y="17" width="3" height="3" rx="0.5" />
  </svg>
)

const MinusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const FolderPlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    <line x1="12" y1="11" x2="12" y2="17" />
    <line x1="9" y1="14" x2="15" y2="14" />
  </svg>
)

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </svg>
)

const clampZoom = (value) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(Number(value) / ZOOM_STEP) * ZOOM_STEP))

const DeleteButton = ({ onDelete }) => {
  const handleClick = (event) => {
    event.stopPropagation()
    onDelete()
  }

  return (
    <button
      className="local-browser__delete"
      type="button"
      onClick={handleClick}
      title="Delete"
      aria-label="Delete"
    >
      <TrashIcon />
    </button>
  )
}

const FolderCard = ({ item: dir, onOpen, onDelete }) => {
  const handleClick = useCallback(() => onOpen(dir.path), [onOpen, dir.path])

  return (
    <div className="local-browser__card local-browser__card--folder" onClick={handleClick}>
      <DeleteButton onDelete={() => onDelete(dir)} />
      <div className="local-browser__card-image local-browser__card-image--folder">
        <FolderIcon />
      </div>
      <div className="local-browser__card-footer">
        <span className="local-browser__card-name" title={dir.name}>{dir.name}</span>
      </div>
    </div>
  )
}

const BrowseCard = ({ item: file, index, onSelect, onDelete, apiBase }) => {
  const handleClick = useCallback(() => onSelect(index), [onSelect, index])
  const { fullName } = getMediaName(file)

  return (
    <div className="local-browser__card" onClick={handleClick}>
      <DeleteButton onDelete={() => onDelete(file)} />
      <div className="local-browser__card-image">
        <Media
          className="local-browser__media"
          src={browseUrl(apiBase, '/preview', file.path)}
          type="image"
          variant="thumbnail"
          alt={fullName}
        />
      </div>
      <div className="local-browser__card-footer">
        <span className="local-browser__card-name" title={fullName}>{fullName}</span>
      </div>
    </div>
  )
}

const BrowseRow = ({ item, index, onSelect, onOpen, onDelete, apiBase }) => {
  const isDir = item.kind === 'directory'
  const handleClick = useCallback(() => {
    if (isDir) onOpen(item.path)
    else onSelect(index)
  }, [isDir, onOpen, onSelect, item.path, index])
  const name = isDir ? item.name : getMediaName(item).fullName

  return (
    <div className="local-browser__row" onClick={handleClick}>
      <div className="local-browser__row-icon">
        {isDir ? (
          <FolderIcon />
        ) : (
          <Media
            className="local-browser__media"
            src={browseUrl(apiBase, '/preview', item.path)}
            type="image"
            variant="thumbnail"
            alt={name}
          />
        )}
      </div>
      <span className="local-browser__row-name" title={name}>{name}</span>
      {!isDir && (
        <span className="local-browser__row-size">{formatSize(item.bytes)}</span>
      )}
      <DeleteButton onDelete={() => onDelete(item)} />
    </div>
  )
}

const BrowseListingItem = ({ item, onSelect, onOpenFolder, onDelete, apiBase, view = 'cards' }) => {
  if (view === 'list') {
    return (
      <BrowseRow
        item={item}
        index={item.fileIndex}
        onSelect={onSelect}
        onOpen={onOpenFolder}
        onDelete={onDelete}
        apiBase={apiBase}
      />
    )
  }
  if (item.kind === 'directory') {
    return <FolderCard item={item} onOpen={onOpenFolder} onDelete={onDelete} />
  }
  return <BrowseCard item={item} index={item.fileIndex} onSelect={onSelect} onDelete={onDelete} apiBase={apiBase} />
}

const BrowseLightboxInfo = ({ mediaLightbox: { item: file } = {} }) => {
  if (!file) return null
  const { fullName } = getMediaName(file)

  return (
    <DevScope id="kbf3oyw">
      <div className="local-browser__lightbox-info">
        <span className="local-browser__lightbox-name" title={fullName}>{fullName}</span>
        <span className="local-browser__lightbox-size">{formatSize(file.bytes)}</span>
      </div>
    </DevScope>
  )
}

/**
 * LocalBrowser — filesystem media browser against `/api/browse`.
 *
 * Props:
 *   devId        {string}   — DevScope id for this instance
 *   apiBase      {string}   — origin/prefix for the browse API (e.g. `/lft`)
 *   compact      {boolean}  — tighter layout for overlay use
 *   path         {string}   — controlled relative path from browse root
 *   onPathChange {function} — controlled path setter
 *   storageKey   {string}   — persist path when uncontrolled
 */
export const LocalBrowser = ({
  devId,
  apiBase = '',
  compact = false,
  path: pathProp,
  onPathChange,
  storageKey,
}) => {
  const [internalPath, setInternalPath] = useState(() => {
    if (pathProp !== undefined) return toRelativePath(pathProp)
    if (storageKey) return toRelativePath(localStorage.getItem(storageKey) || '')
    return ''
  })
  const browsePath = toRelativePath(pathProp !== undefined ? pathProp : internalPath)
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPath, setSelectedPath] = useState(null)
  const [folderFilter, setFolderFilter] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('untitled folder')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [reloadToken, setReloadToken] = useState(0)
  const [view, setView] = useState(() => (localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'cards'))
  const [zoom, setZoom] = useState(() => {
    const stored = Number(localStorage.getItem(ZOOM_KEY))
    return Number.isFinite(stored) ? clampZoom(stored) : DEFAULT_ZOOM
  })
  const listingRef = useRef(null)

  const setBrowseView = (nextView) => {
    setView(nextView)
    localStorage.setItem(VIEW_KEY, nextView)
  }

  const setBrowseZoom = (nextZoom) => {
    setZoom((current) => {
      const value = clampZoom(typeof nextZoom === 'function' ? nextZoom(current) : nextZoom)
      localStorage.setItem(ZOOM_KEY, String(value))
      return value
    })
  }

  const setBrowsePath = useCallback((nextPath) => {
    const value = toRelativePath(nextPath)
    if (onPathChange) onPathChange(value)
    if (pathProp !== undefined) return
    setInternalPath(value)
    if (storageKey) localStorage.setItem(storageKey, value)
  }, [onPathChange, pathProp, storageKey])

  useEffect(() => {
    setSelectedPath(null)
    setFolderFilter('')
    setCreatingFolder(false)
    setPendingDelete(null)
    setActionError(null)
  }, [browsePath])

  useEffect(() => {
    const element = listingRef.current
    if (!element) return undefined
    const handleWheel = (event) => {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      setBrowseZoom((current) => current + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP))
    }
    element.addEventListener('wheel', handleWheel, { passive: false })
    return () => element.removeEventListener('wheel', handleWheel)
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(browseUrl(apiBase, '', browsePath), { cache: 'no-store' })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to browse')
        }
        const data = await res.json()
        if (!cancelled) {
          setListing(data)
          const relative = data.path || ''
          if (relative !== browsePath) setBrowsePath(relative)
        }
      } catch (err) {
        if (!cancelled) {
          setListing(null)
          setError(err.message)
          if (browsePath) setBrowsePath('')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [apiBase, browsePath, reloadToken])

  const files = listing?.files || []
  const directories = listing?.directories || []

  let selectedIndex = null
  if (selectedPath !== null) {
    const idx = files.findIndex((file) => file.path === selectedPath)
    if (idx >= 0) selectedIndex = idx
  }

  const handleSelect = (index) => {
    if (index >= 0 && index < files.length) {
      setSelectedPath(files[index].path)
    }
  }

  const reloadListing = () => setReloadToken((current) => current + 1)

  const readError = async (res, fallback) => {
    const data = await res.json().catch(() => ({}))
    return data.error || fallback
  }

  const handleCreateFolder = async (event) => {
    if (event) event.preventDefault()
    const name = newFolderName.trim()
    if (!name) return
    setActionError(null)
    try {
      const res = await fetch(browseUrl(apiBase, '/directory'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: browsePath, name }),
      })
      if (!res.ok) throw new Error(await readError(res, 'Failed to create folder'))
      setCreatingFolder(false)
      setNewFolderName('untitled folder')
      reloadListing()
    } catch (err) {
      setActionError(err.message)
    }
  }

  const requestDelete = (item) => {
    setActionError(null)
    setPendingDelete(item)
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return
    setActionError(null)
    try {
      const res = await fetch(browseUrl(apiBase, '', pendingDelete.path), { method: 'DELETE' })
      if (!res.ok) throw new Error(await readError(res, 'Failed to delete'))
      if (selectedPath === pendingDelete.path) setSelectedPath(null)
      setPendingDelete(null)
      reloadListing()
    } catch (err) {
      setActionError(err.message)
    }
  }

  const filterQuery = folderFilter.trim().toLowerCase()
  const visibleDirectories = filterQuery
    ? directories.filter((dir) => dir.name.toLowerCase().includes(filterQuery))
    : directories
  const listingItems = [
    ...visibleDirectories.map((dir) => ({ kind: 'directory', ...dir })),
    ...files.map((file, fileIndex) => ({ kind: 'file', fileIndex, ...file })),
  ]

  const crumbs = []
  if (listing) {
    crumbs.push({ label: rootLabel(listing.root), path: '' })
    if (listing.path) {
      const segments = listing.path.split('/').filter(Boolean)
      let accumulated = ''
      segments.forEach((segment) => {
        accumulated = accumulated ? `${accumulated}/${segment}` : segment
        crumbs.push({ label: segment, path: accumulated })
      })
    }
  }

  const getBrowseMedia = (file) => {
    const { fullName } = getMediaName(file)
    return {
      src: browseUrl(apiBase, '/file', file.path),
      type: getMediaType(file),
      extension: file.extension,
      alt: fullName
    }
  }

  return (
    <DevScope id={devId} state={{ path: browsePath, loading, error: Boolean(error), compact, view, zoom }}>
      <div
        className={`local-browser${compact ? ' local-browser--compact' : ''}`}
        style={{ '--local-browser-zoom': zoom / 100 }}
      >
        <DevScope id="mj03dvw">
          <div className="local-browser__bar">
            {listing && listing.parent !== null && (
              <button
                className="local-browser__up"
                type="button"
                onClick={() => setBrowsePath(listing.parent)}
                title="Parent directory"
              >
                <ChevronLeftIcon />
              </button>
            )}
            <nav className="local-browser__crumbs" aria-label="Path">
              {crumbs.map((crumb, index) => {
                const isLast = index === crumbs.length - 1
                return (
                  <span key={`${crumb.path}-${index}`} className="local-browser__crumb">
                    {index > 0 && <span className="local-browser__crumb-sep">/</span>}
                    {isLast ? (
                      <span className="local-browser__crumb-current">{crumb.label}</span>
                    ) : (
                      <button
                        className="local-browser__crumb-link"
                        type="button"
                        onClick={() => setBrowsePath(crumb.path)}
                      >{crumb.label}</button>
                    )}
                  </span>
                )
              })}
            </nav>
            <DevScope id="h9q3m1x" state={{ view }}>
              <div className="local-browser__views">
                <button
                  className={`local-browser__view${view === 'cards' ? ' local-browser__view--active' : ''}`}
                  type="button"
                  onClick={() => setBrowseView('cards')}
                  aria-pressed={view === 'cards'}
                  title="Cards"
                  aria-label="Cards view"
                >
                  <GridIcon />
                </button>
                <button
                  className={`local-browser__view${view === 'list' ? ' local-browser__view--active' : ''}`}
                  type="button"
                  onClick={() => setBrowseView('list')}
                  aria-pressed={view === 'list'}
                  title="List"
                  aria-label="List view"
                >
                  <ListIcon />
                </button>
              </div>
            </DevScope>
            <DevScope id="w8k2p5n" state={{ zoom }}>
              <div className="local-browser__zoom">
                <button
                  className="local-browser__zoom-button"
                  type="button"
                  onClick={() => setBrowseZoom(zoom - ZOOM_STEP)}
                  disabled={zoom <= MIN_ZOOM}
                  title="Zoom out"
                  aria-label="Zoom out"
                >
                  <MinusIcon />
                </button>
                <input
                  className="local-browser__zoom-range"
                  type="range"
                  min={MIN_ZOOM}
                  max={MAX_ZOOM}
                  step={ZOOM_STEP}
                  value={zoom}
                  onChange={(event) => setBrowseZoom(Number(event.target.value))}
                  title={`${zoom}%`}
                  aria-label="Zoom"
                />
                <button
                  className="local-browser__zoom-button"
                  type="button"
                  onClick={() => setBrowseZoom(zoom + ZOOM_STEP)}
                  disabled={zoom >= MAX_ZOOM}
                  title="Zoom in"
                  aria-label="Zoom in"
                >
                  <PlusIcon />
                </button>
              </div>
            </DevScope>
            {listing && (
              <DevScope id="a8k3n2w">
                {creatingFolder ? (
                  <form className="local-browser__create" onSubmit={handleCreateFolder}>
                    <input
                      className="local-browser__filter"
                      type="text"
                      value={newFolderName}
                      onChange={(event) => setNewFolderName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') setCreatingFolder(false)
                      }}
                      placeholder="Folder name"
                      autoFocus
                      onFocus={(event) => event.target.select()}
                    />
                    <button className="local-browser__up" type="submit" title="Create folder">
                      <PlusIcon />
                    </button>
                  </form>
                ) : (
                  <button
                    className="local-browser__up"
                    type="button"
                    onClick={() => {
                      setCreatingFolder(true)
                      setNewFolderName('untitled folder')
                      setPendingDelete(null)
                    }}
                    title="New folder"
                    aria-label="New folder"
                  >
                    <FolderPlusIcon />
                  </button>
                )}
              </DevScope>
            )}
            {listing && (
              <DevScope id="eh2e3oq">
                <div className="local-browser__folders">
                  <input
                    className="local-browser__filter"
                    type="text"
                    value={folderFilter}
                    onChange={(event) => setFolderFilter(event.target.value)}
                    placeholder="Filter folders..."
                  />
                </div>
              </DevScope>
            )}
          </div>
        </DevScope>
        {(actionError || pendingDelete) && (
          <DevScope id="d9w3k6n">
            <div className="local-browser__confirm">
              {actionError && (
                <span className="local-browser__confirm-error">{actionError}</span>
              )}
              {pendingDelete && (
                <>
                  <span className="local-browser__confirm-label">
                    {pendingDelete.kind === 'directory'
                      ? `Delete folder "${pendingDelete.name}" and its contents?`
                      : `Delete "${getMediaName(pendingDelete).fullName}"?`}
                  </span>
                  <button
                    className="local-browser__confirm-cancel"
                    type="button"
                    onClick={() => setPendingDelete(null)}
                  >Cancel</button>
                  <button
                    className="local-browser__confirm-delete"
                    type="button"
                    onClick={handleConfirmDelete}
                  >Delete</button>
                </>
              )}
            </div>
          </DevScope>
        )}
        <div className="local-browser__listing" ref={listingRef}>
          {loading && (
            <DevScope id="lbc4ao5">
              <div className="local-browser__status">Loading...</div>
            </DevScope>
          )}
          {error && (
            <DevScope id="1jk5w55">
              <div className="local-browser__status local-browser__status--error">{error}</div>
            </DevScope>
          )}
          {!loading && !error && listing && (
            <DevScope id="kdc8d15" state={{ view, zoom }}>
              {listingItems.length > 0 ? (
                <div className={view === 'list' ? 'local-browser__rows' : 'local-browser__cards'}>
                  {listingItems.map((item) => (
                    <BrowseListingItem
                      key={item.path}
                      item={item}
                      view={view}
                      onSelect={handleSelect}
                      onOpenFolder={setBrowsePath}
                      onDelete={requestDelete}
                      apiBase={apiBase}
                    />
                  ))}
                </div>
              ) : (
                <div className="local-browser__empty">
                  {filterQuery ? (
                    <p>No matching folders</p>
                  ) : (
                    <>
                      <ImageIcon />
                      <p>No images or videos in this folder</p>
                    </>
                  )}
                </div>
              )}
            </DevScope>
          )}
        </div>
        {selectedIndex !== null && (
          <MediaLightbox
            items={files}
            defaultIndex={selectedIndex}
            getMedia={getBrowseMedia}
            getItemKey={(item) => item.path}
            close={() => setSelectedPath(null)}
          >
            <BrowseLightboxInfo />
          </MediaLightbox>
        )}
      </div>
    </DevScope>
  )
}

/**
 * LocalBrowserOverlay — collapsible floating panel wrapping LocalBrowser.
 *
 * Props:
 *   apiBase {string} — origin/prefix for the browse API (e.g. `/lft`)
 */
export const LocalBrowserOverlay = ({ apiBase = '' }) => {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === 'true')
  const [frame, setFrame] = useState(loadOverlayFrame)
  const [dragging, setDragging] = useState(false)
  const frameRef = useRef(frame)
  const dragRef = useRef(null)
  frameRef.current = frame

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current
      localStorage.setItem(COLLAPSED_KEY, String(next))
      return next
    })
  }

  useEffect(() => {
    const handleResize = () => {
      setFrame((current) => {
        const next = clampOverlayFrame(current)
        saveOverlayFrame(next)
        return next
      })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!dragging) return undefined

    const handleMove = (event) => {
      const drag = dragRef.current
      if (!drag) return
      const next = nextOverlayFrame(
        drag.start,
        event.clientX - drag.x,
        event.clientY - drag.y,
        drag.edges
      )
      frameRef.current = next
      setFrame(next)
    }

    const handleUp = () => {
      saveOverlayFrame(frameRef.current)
      dragRef.current = null
      setDragging(false)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('pointercancel', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('pointercancel', handleUp)
    }
  }, [dragging])

  const startPointer = (edges) => (event) => {
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    dragRef.current = {
      edges,
      x: event.clientX,
      y: event.clientY,
      start: { ...frameRef.current },
    }
    setDragging(true)
  }

  const overlayStyle = {
    left: `${frame.left}px`,
    top: `${frame.top}px`,
    width: `${frame.width}px`,
    height: `${frame.height}px`,
  }

  const toggleSize = 1.75 * remPx()
  const toggleStyle = {
    left: `${frame.left + frame.width - toggleSize}px`,
    top: `${frame.top}px`,
  }

  if (collapsed) {
    return createPortal(
      <DevScope id="m5c9w1t" state={{ collapsed }}>
        <button
          type="button"
          className="local-browser-overlay__toggle"
          style={toggleStyle}
          onClick={toggleCollapsed}
          title="Expand local browser"
          aria-label="Expand local browser"
        >
          <FolderIcon />
        </button>
      </DevScope>,
      document.body
    )
  }

  return createPortal(
    <DevScope id="8q2n7vk" state={{ collapsed, dragging }}>
      <div
        className={`local-browser-overlay${dragging ? ' local-browser-overlay--dragging' : ''}`}
        style={overlayStyle}
      >
        {RESIZE_EDGES.map((edges) => (
          <DevScope id="s2h9c4v" key={edges}>
            <div
              className={`local-browser-overlay__handle local-browser-overlay__handle--${edges}`}
              onPointerDown={startPointer(edges)}
            />
          </DevScope>
        ))}
        <DevScope id="h4p6r8x">
          <div className="local-browser-overlay__header">
            <DevScope id="p3w6k8n">
              <button
                type="button"
                className="local-browser-overlay__action local-browser-overlay__action--move"
                onPointerDown={startPointer(null)}
                title="Move"
                aria-label="Move local browser"
              >
                <MoveIcon />
              </button>
            </DevScope>
            <span className="local-browser-overlay__title">local browser</span>
            <button
              type="button"
              className="local-browser-overlay__action"
              onClick={toggleCollapsed}
              title="Collapse"
              aria-label="Collapse local browser"
            >
              <ChevronIcon up />
            </button>
          </div>
        </DevScope>
        <div className="local-browser-overlay__body">
          <LocalBrowser
            devId="j7d2b0n"
            apiBase={apiBase}
            compact
            storageKey={PATH_KEY}
          />
        </div>
      </div>
    </DevScope>,
    document.body
  )
}

export default LocalBrowser
