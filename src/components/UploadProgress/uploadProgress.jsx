import './styles.css'

/**
 * UploadProgress — horizontal progress bar with status-based color.
 *
 * Props:
 *   value   {number}  — percentage 0–100
 *   status  {string}  — "uploading" | "done" | "failed"
 */
const UploadProgress = ({ value = 0, status = 'uploading' }) => {
  const clampedValue = Math.min(100, Math.max(0, value))

  return (
    <div className={`upload-progress upload-progress--${status}`}>
      <div
        className="upload-progress__bar"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  )
}

export default UploadProgress
