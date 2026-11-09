import { useRef, useState } from 'react'
import Button from '../Button/button'
import Media from '../Media/media'
import './styles.css'

export const ImageAttachmentPreviews = ({ items = [], onRemove, onRetry, disabled = false }) => {
  if (!items.length) return null
  return (
    <ul className="image-attachments__previews" aria-label="Attached images">
      {items.map((item) => (
        <li key={item.key || item.id} className="image-attachments__item">
          {item.src ? (
            <a href={item.src} target="_blank" rel="noopener noreferrer" aria-label={`Open ${item.name}`}>
              <Media src={item.src} alt={item.name} variant="thumbnail" className="image-attachments__thumbnail" />
            </a>
          ) : <div className="image-attachments__thumbnail image-attachments__placeholder">Image</div>}
          <span className="image-attachments__name" title={item.name}>{item.name}</span>
          {item.status === 'uploading' && <span role="status">Uploading…</span>}
          {item.error && <span className="image-attachments__error" role="alert">{item.error}</span>}
          {(onRemove || (onRetry && item.canRetry)) && (
            <div className="image-attachments__item-actions">
              {onRetry && item.canRetry && <Button type="button" variant="secondary" size="sm" disabled={disabled} onClick={() => onRetry(item.key)}>Retry</Button>}
              {onRemove && <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => onRemove(item.key)} aria-label={`Remove ${item.name}`}>Remove</Button>}
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

export const ImageAttachmentsDisplay = ({
  imageAttachments: { inputRef, dragOver, onPaste, onDrop, onDragOver, onDragLeave, onChange },
  items = [], accept, disabled = false, onRemove, onRetry, error, onDismissError,
  children, className = '', hint = 'Choose images, paste, or drop them here.',
  showToolbar = true,
}) => {
  const open = () => inputRef.current?.click()
  const body = typeof children === 'function' ? children({ open, disabled }) : children
  return (
    <div
      className={`image-attachments${dragOver ? ' image-attachments--drag-over' : ''} ${className}`}
      onPaste={onPaste}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <input ref={inputRef} type="file" hidden accept={accept} multiple disabled={disabled} onChange={onChange} />
      {showToolbar && (
        <div className="image-attachments__toolbar">
          <Button type="button" variant="secondary" size="sm" disabled={disabled} onClick={open}>Attach images</Button>
          <span className="image-attachments__hint">{hint}</span>
        </div>
      )}
      <ImageAttachmentPreviews items={items} onRemove={onRemove} onRetry={onRetry} disabled={disabled} />
      {error && (
        <div className="image-attachments__error" role="alert">
          {error}
          {onDismissError && <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={onDismissError}>Dismiss</Button>}
        </div>
      )}
      {body}
    </div>
  )
}

// File selection, clipboard and drop behavior stays independent of upload APIs.
export const withImageAttachments = (WrappedComponent) => ({
  items = [], onFiles, onError, accept = 'image/png,image/jpeg,image/gif,image/webp',
  maxFiles = 5, maxFileSize = 10 * 1024 * 1024, disabled = false, ...props
}) => {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const add = (files) => {
    if (disabled || !files.length) return
    const types = accept.split(',').map((type) => type.trim())
    const errors = []
    if (files.length + items.length > maxFiles) errors.push(`Attach at most ${maxFiles} images.`)
    for (const file of files) {
      if (!types.includes(file.type)) errors.push(`${file.name}: use PNG, JPEG, GIF or WebP.`)
      if (file.size > maxFileSize) errors.push(`${file.name}: maximum size is ${maxFileSize / (1024 * 1024)} MiB.`)
    }
    // Reject the whole selection so no selected image is silently omitted.
    if (errors.length) { onError?.(errors.join(' ')); return }
    onError?.('')
    onFiles?.(files)
  }
  const imageAttachments = {
    inputRef,
    dragOver,
    onChange: (event) => {
      add(Array.from(event.target.files || []))
      event.target.value = ''
    },
    onPaste: (event) => {
      const files = Array.from(event.clipboardData?.files || [])
      if (!files.length) return
      event.preventDefault()
      add(files)
    },
    onDragOver: (event) => {
      if (!Array.from(event.dataTransfer.types).includes('Files')) return
      event.preventDefault()
      event.dataTransfer.dropEffect = disabled ? 'none' : 'copy'
      setDragOver(!disabled)
    },
    onDragLeave: (event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setDragOver(false)
    },
    onDrop: (event) => {
      if (!Array.from(event.dataTransfer.types).includes('Files')) return
      event.preventDefault()
      setDragOver(false)
      add(Array.from(event.dataTransfer.files || []))
    },
  }
  return <WrappedComponent {...props} items={items} accept={accept} disabled={disabled} imageAttachments={imageAttachments} />
}

export default withImageAttachments(ImageAttachmentsDisplay)
