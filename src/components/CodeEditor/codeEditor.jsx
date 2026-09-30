import { useCallback, useEffect, useRef } from 'react'
import { Annotation, Compartment, EditorSelection, EditorState, Prec } from '@codemirror/state'
import {
  EditorView,
  crosshairCursor,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
} from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import {
  LanguageDescription,
  bracketMatching,
  defaultHighlightStyle,
  foldGutter,
  foldKeymap,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language'
import { languages } from '@codemirror/language-data'
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import { oneDark } from '@codemirror/theme-one-dark'
import { DevScope } from '../DevInspector/devInspector.jsx'
import './styles.css'

const external = Annotation.define()

const fillTheme = EditorView.theme({
  '&': { height: '100%' },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: 'var(--code-font, ui-monospace, SFMono-Regular, Menlo, monospace)',
  },
})

const baseExtensions = [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  foldGutter(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  crosshairCursor(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...completionKeymap,
    indentWithTab,
  ]),
  oneDark,
  fillTheme,
]

const readOnlyExtension = (readOnly) => [
  EditorState.readOnly.of(Boolean(readOnly)),
  EditorView.editable.of(!readOnly),
]

const emptyState = () => EditorState.create({ extensions: [fillTheme, ...readOnlyExtension(true)] })

const matchLanguage = (filename) => {
  if (!filename) return null
  const base = String(filename).split(/[\\/]/).pop()
  return LanguageDescription.matchFilename(languages, base)
}

const keysSignature = (keys = []) =>
  keys
    .map((binding) => [
      binding.key,
      binding.mac,
      binding.win,
      binding.linux,
      binding.shift ? 's' : '',
      binding.preventDefault ? 'p' : '',
    ].join(':'))
    .join('|')

const diffChange = (from, to) => {
  const max = Math.min(from.length, to.length)
  let start = 0
  while (start < max && from.charCodeAt(start) === to.charCodeAt(start)) start++
  let endFrom = from.length
  let endTo = to.length
  while (endFrom > start && endTo > start && from.charCodeAt(endFrom - 1) === to.charCodeAt(endTo - 1)) {
    endFrom--
    endTo--
  }
  return { from: start, to: endFrom, insert: to.slice(start, endTo) }
}

/**
 * CodeEditor — CodeMirror 6 wrapper with per-document state caching.
 *
 * One EditorView is kept alive; switching `docId` swaps in that document's
 * cached EditorState so undo history, selection and scroll survive tab
 * switches.
 *
 * Props:
 *   docId          {string}   — identity of the open document (null renders an empty container)
 *   value          {string}   — content; seeds a new doc, and replaces it when changed externally
 *   filename       {string}   — picks a language via @codemirror/language-data (lazy-loaded)
 *   readOnly       {boolean}  — disables editing
 *   docIds         {string[]} — optional; cached states for ids not listed are dropped
 *   keys           {object[]} — extra CodeMirror key bindings, highest precedence
 *   onChange       {function} — (value, docId) on document edits
 *   onCursorChange {function} — ({ line, col, selected }) 1-based, selected = selected char count
 *   reveal         {object}   — { line, column, token } moves the cursor when token changes
 *   className      {string}
 *   devId          {string}   — instance-root DevScope id
 */
const CodeEditor = ({
  docId,
  value = '',
  filename,
  readOnly = false,
  docIds,
  keys,
  onChange,
  onCursorChange,
  reveal,
  className,
  devId,
}) => {
  const hostRef = useRef(null)
  const viewRef = useRef(null)
  const docIdRef = useRef(null)
  const statesRef = useRef(new Map())
  const scrollRef = useRef(new Map())
  const emittedRef = useRef(new Map())
  const languageNamesRef = useRef(new Map())
  const compartmentsRef = useRef(null)
  if (!compartmentsRef.current) {
    compartmentsRef.current = {
      language: new Compartment(),
      readOnly: new Compartment(),
      keys: new Compartment(),
    }
  }

  const propsRef = useRef({})
  propsRef.current = { value, filename, readOnly, keys, onChange, onCursorChange }

  const signature = keysSignature(keys)

  const buildKeys = () => {
    const list = propsRef.current.keys || []
    const current = (index) => (propsRef.current.keys || [])[index] || {}
    return Prec.highest(keymap.of(list.map((binding, index) => ({
      key: binding.key,
      mac: binding.mac,
      win: binding.win,
      linux: binding.linux,
      preventDefault: binding.preventDefault,
      run: (view) => current(index).run?.(view) ?? false,
      shift: binding.shift ? (view) => current(index).shift?.(view) ?? false : undefined,
    }))))
  }

  const emitCursor = (state) => {
    const handler = propsRef.current.onCursorChange
    if (!handler || docIdRef.current == null) return
    const { main, ranges } = state.selection
    const line = state.doc.lineAt(main.head)
    const selected = ranges.reduce((count, range) => count + range.to - range.from, 0)
    handler({ line: line.number, col: main.head - line.from + 1, selected })
  }

  const reconfigureDoc = (id, effects) => {
    const view = viewRef.current
    if (!view) return
    if (docIdRef.current === id) {
      view.dispatch({ effects })
      return
    }
    const cached = statesRef.current.get(id)
    if (cached) statesRef.current.set(id, cached.update({ effects }).state)
  }

  const resolveLanguage = (id, name) => {
    languageNamesRef.current.set(id, name)
    const description = matchLanguage(name)
    if (!description) return []
    if (description.support) return description.support
    description
      .load()
      .then((support) => {
        if (languageNamesRef.current.get(id) !== name) return
        reconfigureDoc(id, compartmentsRef.current.language.reconfigure(support))
      })
      .catch(() => {})
    return []
  }

  const listener = EditorView.updateListener.of((update) => {
    const id = docIdRef.current
    if (id == null) return
    if (update.docChanged) {
      const text = update.state.doc.toString()
      emittedRef.current.set(id, text)
      const isExternal = update.transactions.some((tr) => tr.annotation(external))
      if (!isExternal) propsRef.current.onChange?.(text, id)
    }
    if (update.docChanged || update.selectionSet) emitCursor(update.state)
  })

  const createState = (id, text, name) => {
    const { language, readOnly: readOnlyCompartment, keys: keysCompartment } = compartmentsRef.current
    emittedRef.current.set(id, text)
    return EditorState.create({
      doc: text,
      extensions: [
        baseExtensions,
        language.of(resolveLanguage(id, name)),
        readOnlyCompartment.of(readOnlyExtension(propsRef.current.readOnly)),
        keysCompartment.of(buildKeys()),
        listener,
      ],
    })
  }

  const swapDoc = (nextId) => {
    const view = viewRef.current
    const prevId = docIdRef.current
    if (prevId != null) {
      statesRef.current.set(prevId, view.state)
      scrollRef.current.set(prevId, { top: view.scrollDOM.scrollTop, left: view.scrollDOM.scrollLeft })
    }
    docIdRef.current = nextId ?? null
    if (nextId == null) {
      view.setState(emptyState())
      return
    }

    const { value: text, filename: name, readOnly: isReadOnly } = propsRef.current
    const { readOnly: readOnlyCompartment, keys: keysCompartment } = compartmentsRef.current
    const cached = statesRef.current.get(nextId)
    statesRef.current.delete(nextId)
    view.setState(cached || createState(nextId, text ?? '', name))
    if (cached) {
      view.dispatch({
        effects: [
          readOnlyCompartment.reconfigure(readOnlyExtension(isReadOnly)),
          keysCompartment.reconfigure(buildKeys()),
        ],
      })
    }
    view.focus()
    emitCursor(view.state)

    const scroll = scrollRef.current.get(nextId)
    if (scroll) {
      requestAnimationFrame(() => {
        const current = viewRef.current
        if (!current || docIdRef.current !== nextId) return
        current.scrollDOM.scrollTop = scroll.top
        current.scrollDOM.scrollLeft = scroll.left
      })
    }
  }

  const syncValue = () => {
    const view = viewRef.current
    const id = docIdRef.current
    const text = propsRef.current.value ?? ''
    if (!view || id == null) return
    const current = view.state.doc.toString()
    if (text === current || text === emittedRef.current.get(id)) return
    view.dispatch({
      changes: diffChange(current, text),
      annotations: external.of(true),
    })
  }

  const setHost = useCallback((node) => {
    hostRef.current = node
    const view = viewRef.current
    if (node && view && view.dom.parentNode !== node) node.appendChild(view.dom)
  }, [])

  useEffect(() => {
    const { value: text, filename: name } = propsRef.current
    docIdRef.current = docId ?? null
    const view = new EditorView({
      state: docId == null ? emptyState() : createState(docId, text ?? '', name),
    })
    viewRef.current = view
    hostRef.current?.appendChild(view.dom)
    if (docId != null) emitCursor(view.state)

    return () => {
      view.destroy()
      viewRef.current = null
      docIdRef.current = null
      statesRef.current.clear()
      scrollRef.current.clear()
      emittedRef.current.clear()
      languageNamesRef.current.clear()
    }
  }, [])

  useEffect(() => {
    if (!viewRef.current) return
    if (docIdRef.current !== (docId ?? null)) swapDoc(docId)
    syncValue()
  }, [docId, value])

  useEffect(() => {
    const view = viewRef.current
    if (!view || docId == null || !reveal || reveal.token == null) return
    let frames = 0
    let frame = 0
    const apply = () => {
      frames += 1
      if (frames < 2) {
        frame = requestAnimationFrame(apply)
        return
      }
      const current = viewRef.current
      if (!current || docIdRef.current !== docId) return
      const doc = current.state.doc
      const lineNo = Math.min(Math.max(Number(reveal.line) || 1, 1), doc.lines)
      const lineObj = doc.line(lineNo)
      const col = Math.max((Number(reveal.column) || 1) - 1, 0)
      const pos = Math.min(lineObj.from + col, lineObj.to)
      current.dispatch({
        selection: EditorSelection.cursor(pos),
        scrollIntoView: true,
      })
      current.focus()
    }
    frame = requestAnimationFrame(apply)
    return () => cancelAnimationFrame(frame)
  }, [docId, reveal && reveal.token, reveal && reveal.line, reveal && reveal.column])

  useEffect(() => {
    const view = viewRef.current
    if (!view || docId == null) return
    if (languageNamesRef.current.get(docId) === filename) return
    view.dispatch({ effects: compartmentsRef.current.language.reconfigure(resolveLanguage(docId, filename)) })
  }, [docId, filename])

  useEffect(() => {
    const view = viewRef.current
    if (!view || docIdRef.current == null) return
    view.dispatch({ effects: compartmentsRef.current.readOnly.reconfigure(readOnlyExtension(readOnly)) })
  }, [readOnly])

  useEffect(() => {
    const view = viewRef.current
    if (!view || docIdRef.current == null) return
    view.dispatch({ effects: compartmentsRef.current.keys.reconfigure(buildKeys()) })
  }, [signature])

  const docIdsKey = docIds ? docIds.join('\u0000') : null

  useEffect(() => {
    if (!docIds) return
    const keep = new Set(docIds)
    const maps = [statesRef.current, scrollRef.current, emittedRef.current, languageNamesRef.current]
    maps.forEach((map) => {
      Array.from(map.keys()).forEach((id) => {
        if (id !== docIdRef.current && !keep.has(id)) map.delete(id)
      })
    })
  }, [docIdsKey])

  const classes = [
    'code-editor',
    docId == null && 'code-editor--empty',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const node = <div ref={setHost} className={classes} />

  return devId ? <DevScope id={devId} state={{ docId: docId ?? null, readOnly }}>{node}</DevScope> : node
}

export default CodeEditor
