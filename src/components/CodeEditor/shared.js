import { EditorView } from '@codemirror/view'
import { LanguageDescription } from '@codemirror/language'
import { languages } from '@codemirror/language-data'

export const codeFont = 'var(--code-font, ui-monospace, SFMono-Regular, Menlo, monospace)'

export const fillTheme = EditorView.theme({
  '&': { height: '100%' },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: codeFont,
    flex: '1 1 auto',
    minHeight: '0',
    height: 'auto',
  },
  '.cm-panel.cm-search': {
    padding: '0.85rem 2.75rem 1rem 1rem',
    fontSize: '1.25rem',
    '& input, & button, & label': {
      margin: '0.4rem 0.85rem 0.4rem 0',
      fontSize: '1.125rem',
    },
    '& .cm-textfield': {
      minWidth: '18rem',
      padding: '0.55rem 0.85rem',
      fontSize: '1.25rem',
      borderRadius: '0.35rem',
    },
    '& .cm-button': {
      padding: '0.55rem 1.1rem',
      fontSize: '1.125rem',
      borderRadius: '0.35rem',
    },
    '& label': {
      fontSize: '1.05rem',
    },
    '& [name=close]': {
      top: '0.45rem',
      right: '0.55rem',
      fontSize: '1.75rem',
      lineHeight: 1,
      padding: '0.15rem 0.4rem',
    },
  },
})

export const matchLanguage = (filename) => {
  if (!filename) return null
  const base = String(filename).split(/[\\/]/).pop()
  return LanguageDescription.matchFilename(languages, base)
}
