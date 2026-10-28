import { EditorView } from '@codemirror/view'
import { LanguageDescription } from '@codemirror/language'
import { languages } from '@codemirror/language-data'

export const codeFont = 'var(--code-font, ui-monospace, SFMono-Regular, Menlo, monospace)'

export const fillTheme = EditorView.theme({
  '&': { height: '100%' },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: codeFont,
  },
})

export const matchLanguage = (filename) => {
  if (!filename) return null
  const base = String(filename).split(/[\\/]/).pop()
  return LanguageDescription.matchFilename(languages, base)
}
