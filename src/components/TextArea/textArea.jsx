import { useLayoutEffect, useRef } from 'react'
import './styles.css'

// Box and text metrics the backdrop copies so its text wraps like the textarea's.
const MIRRORED = [
  'boxSizing', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
  'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius',
  'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing',
  'wordSpacing', 'textIndent', 'tabSize',
]

const dataAttributes = data => Object.fromEntries(Object.entries(data)
  .filter(([, value]) => value != null && typeof value !== 'object')
  .map(([key, value]) => [`data-${key.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`)}`, value]))

// Splits text into plain strings and highlighted `<mark>` ranges.
const segments = (text, highlights) => {
  const out = []
  let last = 0
  highlights.forEach(({ start, end, ...data }, i) => {
    if (start < last || end <= start) return
    if (start > last) out.push(text.slice(last, start))
    out.push(<mark key={i} {...dataAttributes(data)}>{text.slice(start, end)}</mark>)
    last = end
  })
  out.push(text.slice(last))
  return out
}

/**
 * TextArea — textarea with optional highlight backdrop and Ctrl/⌘+Enter submit.
 * `highlights` is `[{ start, end, ...data }]`; each range renders as `<mark data-*>`
 * behind the text. The backdrop copies the textarea's computed box, so any
 * textarea class lines up. `children` render below the field.
 */
const TextArea = ({ value, onChange, onKeyDown, onInput, onScroll, onSubmit, highlights, children, ...rest }) => {
  const fieldRef = useRef(null)
  const backdropRef = useRef(null)
  const text = value == null ? '' : String(value)
  const highlighted = Array.isArray(highlights)

  // Value changes can add or remove the scrollbar, so this also reruns on `text`.
  useLayoutEffect(() => {
    const textarea = fieldRef.current
    const backdrop = backdropRef.current
    if (!textarea || !backdrop) return
    const sync = () => {
      textarea.style.backgroundColor = ''
      const style = getComputedStyle(textarea)
      MIRRORED.forEach(name => { backdrop.style[name] = style[name] })
      backdrop.style.backgroundColor = style.backgroundColor
      textarea.style.backgroundColor = 'transparent'
      // A vertical scrollbar narrows the textarea's text box; pad the backdrop to match.
      const scrollbar = textarea.offsetWidth - textarea.clientWidth
        - parseFloat(style.borderLeftWidth) - parseFloat(style.borderRightWidth)
      backdrop.style.paddingRight = `${parseFloat(style.paddingRight) + Math.max(0, scrollbar)}px`
      backdrop.scrollTop = textarea.scrollTop
      backdrop.scrollLeft = textarea.scrollLeft
    }
    sync()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(sync)
    observer?.observe(textarea)
    return () => {
      observer?.disconnect()
      textarea.style.backgroundColor = ''
    }
  }, [highlighted, text])

  const handleKeyDown = event => {
    onKeyDown?.(event)
    if (event.defaultPrevented || !onSubmit) return
    if (event.key !== 'Enter' || !(event.ctrlKey || event.metaKey) || event.nativeEvent?.isComposing) return
    event.preventDefault()
    onSubmit(event)
  }

  const handleScroll = event => {
    onScroll?.(event)
    if (!backdropRef.current) return
    backdropRef.current.scrollTop = event.target.scrollTop
    backdropRef.current.scrollLeft = event.target.scrollLeft
  }

  return (
    <div className="text-area">
      <div className="text-area__field">
        {highlighted && (
          <div className="text-area__backdrop" ref={backdropRef} aria-hidden="true">
            {segments(text, highlights)}
            {/* A trailing newline needs a character after it to take up a line. */}
            {text.endsWith('\n') ? ' ' : null}
          </div>
        )}
        <textarea
          {...rest}
          ref={fieldRef}
          value={value}
          onChange={onChange}
          onInput={onInput}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
        />
      </div>
      {children}
    </div>
  )
}

export default TextArea
