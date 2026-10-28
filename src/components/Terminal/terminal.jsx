import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { DevScope } from '../DevInspector/devInspector.jsx'
import './terminal.css'

const THEME = {
  background: '#1e1e1e',
  foreground: '#d4d4d4',
  cursor: '#d4d4d4',
  selectionBackground: '#264f78',
}

/**
 * Terminal — presentational xterm.js wrapper with no transport knowledge.
 *
 * Refits to its container on every size change. Bytes are streamed through
 * the ref so callers never re-render per chunk.
 *
 * Ref handle:
 *   write(data) — append output
 *   clear()     — clear scrollback, keep the prompt line
 *   reset()     — full terminal reset
 *   focus()
 *
 * Props:
 *   onData    {function} — (data) on keyboard / paste input
 *   onResize  {function} — ({ cols, rows }) after mount and when the grid size changes
 *   focused   {boolean}  — refits and focuses when it becomes true
 *   fontSize  {number}
 *   className {string}
 *   devId     {string}   — instance-root DevScope id
 */
const Terminal = forwardRef(({ onData, onResize, focused = false, fontSize = 13, className, devId }, ref) => {
  const hostRef = useRef(null)
  const termRef = useRef(null)
  const fitRef = useRef(null)
  const propsRef = useRef({})
  propsRef.current = { onData, onResize }

  const fit = () => {
    const host = hostRef.current
    if (!fitRef.current || !host || !host.clientWidth || !host.clientHeight) return
    try {
      fitRef.current.fit()
    } catch {
      // The renderer may not be measurable yet.
    }
  }

  useImperativeHandle(ref, () => ({
    write: (data) => termRef.current?.write(data),
    clear: () => termRef.current?.clear(),
    reset: () => termRef.current?.reset(),
    focus: () => termRef.current?.focus(),
  }), [])

  useEffect(() => {
    const term = new XTerm({
      fontSize,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      cursorBlink: true,
      scrollback: 5000,
      theme: THEME,
    })
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(hostRef.current)
    termRef.current = term
    fitRef.current = fitAddon

    const dataSub = term.onData((data) => propsRef.current.onData?.(data))
    const resizeSub = term.onResize(({ cols, rows }) => propsRef.current.onResize?.({ cols, rows }))

    fit()
    propsRef.current.onResize?.({ cols: term.cols, rows: term.rows })

    let frame = 0
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(fit)
    })
    observer.observe(hostRef.current)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      dataSub.dispose()
      resizeSub.dispose()
      term.dispose()
      termRef.current = null
      fitRef.current = null
    }
  }, [])

  useEffect(() => {
    const term = termRef.current
    if (!term || term.options.fontSize === fontSize) return
    term.options.fontSize = fontSize
    fit()
  }, [fontSize])

  useEffect(() => {
    if (!focused) return
    fit()
    termRef.current?.focus()
  }, [focused])

  const classes = ['terminal', className].filter(Boolean).join(' ')

  const node = (
    <div className={classes}>
      <div ref={hostRef} className="terminal__host" />
    </div>
  )

  return devId ? <DevScope id={devId} state={{ focused: Boolean(focused) }}>{node}</DevScope> : node
})

Terminal.displayName = 'Terminal'

export default Terminal
