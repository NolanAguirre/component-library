import { useState, useRef, Children, cloneElement, useCallback } from 'react'
import UploadFileRow from '../UploadFileRow/uploadFileRow'
import './styles.css'

let nextId = 1

/**
 * MultiFileUploadDisplay — pure display controller.
 *
 * Renders a drag-and-drop zone and a file list below it.
 * Injects upload state into children via the `multiFileUpload` namespace.
 * When no children are provided, renders default UploadFileRow entries.
 *
 * Props (injected by withMultiFileUpload):
 *   files       {Array}     — queue entries [{ id, file, status, progress, error, response }]
 *   add         {function}  — enqueue file(s)
 *   remove      {function}  — remove a file by id
 *   retry       {function}  — retry a failed file by id
 *   clear       {function}  — remove all completed/failed entries
 *   accept      {string}    — file input accept attribute
 *   multiple    {boolean}   — allow multiple file selection
 */
export const MultiFileUploadDisplay = ({
  files = [],
  add = () => {},
  remove = () => {},
  retry = () => {},
  clear = () => {},
  accept,
  multiple = true,
  children,
}) => {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const handleFiles = (fileList) => {
    if (!fileList || fileList.length === 0) return
    add(multiple ? Array.from(fileList) : [fileList[0]])
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

  const handleChange = (e) => {
    handleFiles(e.target.files)
    e.target.value = ''
  }

  const namespace = { files, add, remove, retry, clear }

  const renderFileList = () => {
    if (children) {
      return Children.map(children, (child) =>
        cloneElement(child, { multiFileUpload: namespace })
      )
    }

    if (files.length === 0) return null

    return (
      <div className="form-file__list">
        {files.map((entry) => (
          <UploadFileRow
            key={entry.id}
            file={entry}
            remove={() => remove(entry.id)}
            retry={() => retry(entry.id)}
          />
        ))}
        {files.some((f) => f.status === 'done' || f.status === 'failed') && (
          <button className="form-file__clear" onClick={clear}>Clear finished</button>
        )}
      </div>
    )
  }

  return (
    <div className="form-file form-file--multi">
      <div
        className={`form-file__zone${dragOver ? ' form-file__zone--drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        role="button"
        tabIndex={0}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="form-file__input"
        />
        <div className="form-file__content">
          <span className="form-file__placeholder">
            Drop files here or click to browse
          </span>
        </div>
      </div>
      {renderFileList()}
    </div>
  )
}

/**
 * withMultiFileUpload — state controller HOC.
 *
 * Manages upload queue, XHR-based concurrent uploads, and per-file progress.
 *
 * Consumed props:
 *   requestUpload  {function(file) => Promise<{ url, ...meta }>}
 *   complete       {function(file, response)}
 *   fail           {function(file, error)}  — optional
 *   maxConcurrent  {number}  — default 4
 *   maxFileSize    {number}  — bytes, optional
 *   accept         {string}
 *   multiple       {boolean}
 */
export const withMultiFileUpload = (WrappedComponent) => ({
  requestUpload,
  complete,
  fail,
  maxConcurrent = 4,
  maxFileSize,
  ...props
}) => {
  const [files, setFiles] = useState([])
  const activeRef = useRef(0)
  const queueRef = useRef([])

  const updateFile = (id, patch) => {
    setFiles((prev) => prev.map((f) => f.id === id ? { ...f, ...patch } : f))
  }

  const processNext = useCallback(() => {
    if (activeRef.current >= maxConcurrent) return
    const next = queueRef.current.find((entry) => entry.status === 'queued')
    if (!next) return

    next.status = 'uploading'
    activeRef.current++
    updateFile(next.id, { status: 'uploading' })

    const doUpload = async () => {
      try {
        const { url } = await requestUpload(next.file)

        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open('PUT', url)
          xhr.setRequestHeader('Content-Type', next.file.type || 'application/octet-stream')

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100)
              updateFile(next.id, { progress })
            }
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(xhr)
            } else {
              reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`))
            }
          }

          xhr.onerror = () => reject(new Error('Network error during upload'))
          xhr.send(next.file)
        })

        updateFile(next.id, { status: 'done', progress: 100 })
        if (complete) complete(next.file, { id: next.id })
      } catch (err) {
        const message = err?.message || 'Upload failed'
        next.status = 'failed'
        updateFile(next.id, { status: 'failed', error: message })
        if (fail) fail(next.file, err)
      } finally {
        activeRef.current--
        processNext()
      }
    }

    doUpload()
    processNext()
  }, [maxConcurrent, requestUpload, complete, fail])

  const add = (fileOrFiles) => {
    const incoming = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles]
    const entries = []

    for (const file of incoming) {
      if (maxFileSize && file.size > maxFileSize) {
        const sizeMB = (maxFileSize / (1024 * 1024)).toFixed(1)
        entries.push({
          id: nextId++,
          file,
          status: 'failed',
          progress: 0,
          error: `File exceeds maximum size (${sizeMB} MB)`,
          response: null,
        })
        continue
      }

      entries.push({
        id: nextId++,
        file,
        status: 'queued',
        progress: 0,
        error: null,
        response: null,
      })
    }

    queueRef.current = [...queueRef.current, ...entries.filter((e) => e.status === 'queued')]
    setFiles((prev) => [...prev, ...entries])

    setTimeout(() => processNext(), 0)
  }

  const remove = (id) => {
    queueRef.current = queueRef.current.filter((e) => e.id !== id)
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const retry = (id) => {
    const entry = queueRef.current.find((e) => e.id === id)
    if (entry) {
      entry.status = 'queued'
    } else {
      const fileEntry = files.find((f) => f.id === id)
      if (fileEntry) {
        queueRef.current.push({ ...fileEntry, status: 'queued' })
      }
    }
    updateFile(id, { status: 'queued', progress: 0, error: null })
    setTimeout(() => processNext(), 0)
  }

  const clear = () => {
    const remaining = files.filter((f) => f.status === 'uploading' || f.status === 'queued')
    queueRef.current = queueRef.current.filter((e) => e.status === 'queued' || e.status === 'uploading')
    setFiles(remaining)
  }

  return (
    <WrappedComponent
      files={files}
      add={add}
      remove={remove}
      retry={retry}
      clear={clear}
      {...props}
    />
  )
}

const MultiFileUpload = withMultiFileUpload(MultiFileUploadDisplay)
export default MultiFileUpload
