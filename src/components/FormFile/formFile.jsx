import { useState, useRef } from 'react'
import './styles.css'

/**
 * FormFile — file upload input with drag-and-drop zone and preview.
 *
 * Receives field:{ name, value, onChange, onBlur } from FormField via cloneElement.
 */
const FormFile = ({
  field: { name, value, onChange, onBlur } = {},
  accept,
  multiple = false,
  ...rest
}) => {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const handleFiles = (files) => {
    if (onChange) {
      onChange({ target: { files, value: multiple ? files : files[0] } })
    }
  }

  const handleChange = (e) => {
    handleFiles(e.target.files)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  const fileName = value instanceof File
    ? value.name
    : value instanceof FileList
      ? Array.from(value).map((f) => f.name).join(', ')
      : typeof value === 'string' && value
        ? value
        : null

  return (
    <div
      className={`form-file${dragOver ? ' form-file--drag-over' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      onBlur={onBlur}
      role="button"
      tabIndex={0}
      {...rest}
    >
      <input
        ref={inputRef}
        id={name}
        name={name}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="form-file__input"
      />
      <div className="form-file__content">
        <span className="form-file__icon" aria-hidden="true">📁</span>
        {fileName ? (
          <span className="form-file__name">{fileName}</span>
        ) : (
          <span className="form-file__placeholder">
            Drop files here or click to browse
          </span>
        )}
      </div>
    </div>
  )
}

export default FormFile

