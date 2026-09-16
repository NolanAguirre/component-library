import { useCallback, useEffect, useRef, useState } from 'react'
import { randomUUID } from './randomUUID'

const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const clone = value => JSON.parse(JSON.stringify(value))

// Top-level fields are independent undoable values. A gesture can preview freely, then
// records one checkpoint. Restoring never records another checkpoint.
const useSnapshotHistory = ({ value, restore, describe, initialHistory, onChange, replay, diff }) => {
  const [history, setHistory] = useState(() => initialHistory || { base: clone(value), entries: [], index: 0 })
  const historyRef = useRef(history)
  const latest = useRef({ value, restore, describe, onChange, replay, diff })
  latest.current = { value, restore, describe, onChange, replay, diff }
  const previous = useRef(initialHistory ? null : clone(value))
  const restoring = useRef(false)
  const gesture = useRef(false)
  const timer = useRef(null)
  const [revision, setRevision] = useState(0)
  const publish = useCallback(next => {
    historyRef.current = next
    setHistory(next)
    latest.current.onChange?.(next)
  }, [])
  const capture = useCallback(() => {
    if (gesture.current || restoring.current || !previous.current) return
    const nextValue = clone(latest.current.value)
    if (equal(previous.current, nextValue)) return
    const changes = {}
    Object.keys(nextValue).forEach(key => {
      if (!equal(previous.current[key], nextValue[key])) changes[key] = nextValue[key]
    })
    const current = historyRef.current
    const entry = { id: randomUUID(), type: 'checkpoint', label: latest.current.describe(previous.current, nextValue), changes: latest.current.diff ? latest.current.diff(previous.current, nextValue, changes) : changes }
    previous.current = nextValue
    const entries = [...current.entries.slice(0, current.index), entry]
    publish({ ...current, entries, index: entries.length })
  }, [publish])
  const rebuild = useCallback((current, index) => {
    const entries = current.entries.slice(0, index)
    const omitted = new Set()
    entries.slice().reverse().forEach(entry => {
      if (!omitted.has(entry.id)) entry.omit?.forEach(id => omitted.add(id))
    })
    return entries.filter(entry => !omitted.has(entry.id) && !entry.omit).reduce(
      (result, entry) => latest.current.replay ? latest.current.replay(result, entry) : { ...result, ...entry.changes }, current.base
    )
  }, [])
  const restoreValue = useCallback(next => {
    restoring.current = true
    previous.current = clone(next)
    latest.current.restore(clone(next))
    setRevision(n => n + 1)
  }, [])
  useEffect(() => {
    if (previous.current === null) {
      restoreValue(rebuild(historyRef.current, historyRef.current.index))
      return
    }
    if (restoring.current) {
      previous.current = clone(latest.current.value)
      restoring.current = false
      return
    }
    capture()
  })
  useEffect(() => () => clearTimeout(timer.current), [])
  const begin = useCallback(() => { capture(); gesture.current = true }, [capture])
  const end = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      gesture.current = false
      setRevision(n => n + 1)
    }, 0)
  }, [])
  useEffect(() => {
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    return () => {
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }
  }, [end])
  const jump = useCallback(index => {
    gesture.current = false
    capture()
    const current = historyRef.current
    const nextIndex = Math.max(0, Math.min(current.entries.length, index))
    if (nextIndex === current.index) return
    restoreValue(rebuild(current, nextIndex))
    publish({ ...current, index: nextIndex })
  }, [capture, publish, rebuild, restoreValue])
  const undo = useCallback(() => { capture(); jump(historyRef.current.index - 1) }, [capture, jump])
  const redo = useCallback(() => jump(historyRef.current.index + 1), [jump])
  const remove = useCallback(index => {
    capture()
    const current = historyRef.current
    const target = current.entries[index]
    if (!target || index >= current.index) return
    // Keep the original entry and replay without it. Undoing this omission restores it,
    // including the drafts and selections it produced.
    const entry = { id: randomUUID(), type: 'checkpoint', label: `Delete “${target.label}”`, omit: [target.id], changes: {} }
    const nextEntries = [...current.entries.slice(0, current.index), entry]
    const next = { ...current, entries: nextEntries, index: nextEntries.length }
    restoreValue(rebuild(next, next.index))
    publish(next)
  }, [capture, publish, rebuild, restoreValue])
  const valueAt = useCallback(index => rebuild(historyRef.current, index), [rebuild])
  const recordValue = useCallback((nextValue, label) => {
    capture()
    const current = historyRef.current
    const entry = { id: randomUUID(), type: 'checkpoint', label, changes: clone(nextValue), replace: true }
    const entries = [...current.entries.slice(0, current.index), entry]
    restoreValue(nextValue)
    publish({ ...current, entries, index: entries.length })
  }, [capture, publish, restoreValue])
  const omittedIds = new Set()
  history.entries.slice(0, history.index).reverse().forEach(entry => {
    if (!omittedIds.has(entry.id)) entry.omit?.forEach(id => omittedIds.add(id))
  })
  return { ...history, omittedIds, begin, end, undo, redo, jump, remove, capture, valueAt, recordValue, revision }
}

export default useSnapshotHistory

// Image strings recur across draft and queue checkpoints. Store each once in autosaves.
const packSnapshotHistory = history => {
  const strings = []
  const indices = new Map()
  const data = JSON.parse(JSON.stringify(history, (_, value) => {
    if (typeof value !== 'string' || value.length < 256) return value
    if (!indices.has(value)) { indices.set(value, strings.length); strings.push(value) }
    return { $historyString: indices.get(value) }
  }))
  return { format: 'snapshot-history-v1', strings, data }
}
const unpackSnapshotHistory = saved => {
  if (saved?.format !== 'snapshot-history-v1') return saved
  return JSON.parse(JSON.stringify(saved.data), (_, value) => {
    if (value && typeof value === 'object' && Object.keys(value).length === 1 && Number.isInteger(value.$historyString)) return saved.strings[value.$historyString]
    return value
  })
}

export { packSnapshotHistory, unpackSnapshotHistory }
