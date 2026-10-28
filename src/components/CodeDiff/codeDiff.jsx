import { useEffect, useRef } from 'react'
import { Compartment, EditorState } from '@codemirror/state'
import { EditorView, highlightSpecialChars, lineNumbers } from '@codemirror/view'
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { MergeView } from '@codemirror/merge'
import { oneDark } from '@codemirror/theme-one-dark'
import { DevScope } from '../DevInspector/devInspector.jsx'
import { codeFont, matchLanguage } from '../CodeEditor/shared'
import './styles.css'

const fontTheme = EditorView.theme({
  '.cm-scroller': { fontFamily: codeFont },
})

const sideExtensions = (language) => [
  lineNumbers(),
  highlightSpecialChars(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  EditorState.readOnly.of(true),
  EditorView.editable.of(false),
  oneDark,
  fontTheme,
  language.of([]),
]

/**
 * CodeDiff — read-only side-by-side diff built on @codemirror/merge.
 *
 * Props:
 *   original          {string}  — left-hand (before) text
 *   modified          {string}  — right-hand (after) text
 *   filename          {string}  — picks a language via @codemirror/language-data (lazy-loaded)
 *   collapseUnchanged {boolean} — fold long runs of unchanged lines (default true)
 *   className         {string}
 *   devId             {string}  — instance-root DevScope id
 */
const CodeDiff = ({ original = '', modified = '', filename, collapseUnchanged = true, className, devId }) => {
  const hostRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined
    const language = new Compartment()
    const view = new MergeView({
      a: { doc: original, extensions: sideExtensions(language) },
      b: { doc: modified, extensions: sideExtensions(language) },
      parent: host,
      orientation: 'a-b',
      highlightChanges: true,
      gutter: true,
      collapseUnchanged: collapseUnchanged ? { margin: 3, minSize: 6 } : undefined,
    })
    let alive = true
    const description = matchLanguage(filename)
    const apply = (support) => {
      if (!alive) return
      const effects = language.reconfigure(support)
      view.a.dispatch({ effects })
      view.b.dispatch({ effects })
    }
    if (description?.support) apply(description.support)
    else if (description) description.load().then(apply).catch(() => {})
    return () => {
      alive = false
      view.destroy()
    }
  }, [original, modified, filename, collapseUnchanged])

  const classes = ['code-diff', className].filter(Boolean).join(' ')
  const node = <div ref={hostRef} className={classes} />

  return devId ? <DevScope id={devId} state={{ filename: filename || null }}>{node}</DevScope> : node
}

export default CodeDiff
