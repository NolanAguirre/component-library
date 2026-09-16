import UploadProgress from '../UploadProgress/uploadProgress'
import './styles.css'

/**
 * formatSize — converts bytes to a human-readable string.
 */
const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * UploadFileRow — displays a single file entry with name, size,
 * status, progress bar, and remove/retry actions.
 *
 * Props:
 *   file    {object}    — { id, file, status, progress, error }
 *   remove  {function}  — action to remove this file from the queue
 *   retry   {function}  — action to retry a failed upload
 */
const UploadFileRow = ({ file: entry, remove, retry }) => {
  if (!entry) return null

  const { file, status, progress, error } = entry
  const showProgress = status === 'uploading' || status === 'done'

  return (
    <div className={`upload-file-row upload-file-row--${status}`}>
      <div className="upload-file-row__info">
        <span className="upload-file-row__name">{file.name}</span>
        <span className="upload-file-row__size">{formatSize(file.size)}</span>
      </div>
      {showProgress && (
        <UploadProgress value={progress} status={status} />
      )}
      {error && (
        <span className="upload-file-row__error">{error}</span>
      )}
      <div className="upload-file-row__actions">
        {status === 'failed' && retry && (
          <button className="upload-file-row__action" onClick={retry}>Retry</button>
        )}
        {remove && (
          <button className="upload-file-row__action upload-file-row__action--remove" onClick={remove}>Remove</button>
        )}
      </div>
    </div>
  )
}

export default UploadFileRow
