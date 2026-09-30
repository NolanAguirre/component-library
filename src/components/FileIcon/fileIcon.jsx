import './styles.css'

const DEFAULT_COLOR = '#9ca3af'

const iconClass = (className) => `file-icon${className ? ` ${className}` : ''}`

const Mark = ({ size, className, children }) => (
  <svg
    className={iconClass(className)}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden
  >
    {children}
  </svg>
)

const JsMark = (props) => (
  <Mark {...props}>
    <rect x="1" y="1" width="22" height="22" rx="2" fill="#f7df1e" />
    <text
      x="12.4"
      y="17.6"
      textAnchor="middle"
      fill="#323330"
      fontFamily="ui-sans-serif, system-ui, sans-serif"
      fontSize="12"
      fontWeight="800"
    >
      JS
    </text>
  </Mark>
)

const GoMark = (props) => (
  <Mark {...props}>
    <text
      x="11.6"
      y="17"
      textAnchor="middle"
      fill="#00add8"
      fontFamily="ui-sans-serif, system-ui, sans-serif"
      fontSize="15"
      fontWeight="800"
      fontStyle="italic"
    >
      Go
    </text>
  </Mark>
)

const JsonMark = (props) => (
  <Mark {...props}>
    <rect x="1.5" y="1.5" width="21" height="21" rx="4" fill="#422006" />
    <path
      d="M9.4 5.2c-2.3.2-3.2 1.7-3.2 3.4v1.6c0 .9-.4 1.4-1.4 1.8 1 .4 1.4.9 1.4 1.8v1.6c0 1.7.9 3.2 3.2 3.4"
      stroke="#fbbf24"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
    <path
      d="M14.6 5.2c2.3.2 3.2 1.7 3.2 3.4v1.6c0 .9.4 1.4 1.4 1.8-1 .4-1.4.9-1.4 1.8v1.6c0 1.7-.9 3.2-3.2 3.4"
      stroke="#fbbf24"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </Mark>
)

const PythonMark = (props) => (
  <Mark {...props}>
    <path
      fill="#3776ab"
      d="M8.2 2h7.1c2.2 0 3.5 1.6 3.5 3.7v2.4h-4.6V6.6h-2.2c-1.5 0-2.3 1-2.3 2.4v1.5H4.2V8.4C4.2 4.8 6 2 8.2 2z"
    />
    <circle cx="16.2" cy="5.4" r="1.05" fill="#fff" />
    <path
      fill="#ffd43b"
      d="M15.8 22H8.7c-2.2 0-3.5-1.6-3.5-3.7v-2.4h4.6v1.3h2.2c1.5 0 2.3-1 2.3-2.4V13.3h5.5v1.8c0 3.6-1.8 6.9-4 6.9z"
    />
    <circle cx="7.8" cy="18.6" r="1.05" fill="#3f3416" />
  </Mark>
)

const MarkdownMark = (props) => (
  <Mark {...props}>
    <path
      fill="#dbeafe"
      d="M2 18.5V5.5h3.1L8.6 10.8 12.1 5.5H15.2v13H12.2v-7.3L8.6 15.6 5 11.2v7.3H2z"
    />
    <path
      fill="#7dd3fc"
      d="M18.2 5.5h2.2V11.2h2.2L19.3 18.2 16 11.2h2.2V5.5z"
    />
  </Mark>
)

const MakeMark = (props) => (
  <Mark {...props}>
    <path
      fill="#fbbf24"
      fillRule="evenodd"
      d="M9.78 5.57L10.07 2.7 13.93 2.7 14.22 5.57 14.97 5.88 17.22 4.06 19.94 6.78 18.12 9.03 18.43 9.78 21.3 10.07 21.3 13.93 18.43 14.22 18.12 14.97 19.94 17.22 17.22 19.94 14.97 18.12 14.22 18.43 13.93 21.3 10.07 21.3 9.78 18.43 9.03 18.12 6.78 19.94 4.06 17.22 5.88 14.97 5.57 14.22 2.7 13.93 2.7 10.07 5.57 9.78 5.88 9.03 4.06 6.78 6.78 4.06 9.03 5.88ZM14.7 12a2.7 2.7 0 1 0-5.4 0 2.7 2.7 0 1 0 5.4 0z"
    />
  </Mark>
)

const ShellMark = (props) => (
  <Mark {...props}>
    <rect x="1.5" y="3" width="21" height="18" rx="3" fill="#022c22" />
    <rect x="1.5" y="3" width="21" height="18" rx="3" stroke="#4ade80" strokeWidth="1.4" />
    <path
      d="M6.2 9.4 10.1 12.2 6.2 15"
      stroke="#4ade80"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M12 15.3h5.8" stroke="#4ade80" strokeWidth="1.7" strokeLinecap="round" />
  </Mark>
)

const ImageMark = (props) => (
  <Mark {...props}>
    <rect x="2" y="4" width="20" height="16" rx="2.5" fill="#0f3d3e" />
    <circle cx="8" cy="9" r="1.7" fill="#fbbf24" />
    <path fill="#2dd4bf" d="M4 15.4 8.5 11.4 12 14.2 16.2 10.1 20 14.8V17.5H4Z" />
    <rect x="2" y="4" width="20" height="16" rx="2.5" stroke="#5eead4" strokeWidth="1.25" />
  </Mark>
)

const TYPES = {
  js: { color: '#facc15', badge: 'JS', mark: JsMark },
  ts: { color: '#60a5fa', badge: 'TS' },
  json: { color: '#f59e0b', badge: '{}', mark: JsonMark },
  css: { color: '#c084fc', badge: '#' },
  html: { color: '#fb923c', badge: '<>' },
  md: { color: '#7dd3fc', badge: 'M', mark: MarkdownMark },
  py: { color: '#60a5fa', accent: '#facc15', badge: 'PY', mark: PythonMark },
  go: { color: '#22d3ee', badge: 'GO', mark: GoMark },
  rs: { color: '#fb923c', badge: 'RS' },
  shell: { color: '#4ade80', badge: '$', mark: ShellMark },
  make: { color: '#fbbf24', badge: 'MK', mark: MakeMark },
  docker: { color: '#38bdf8', badge: 'DK' },
  config: { color: '#f472b6' },
  sql: { color: '#a3e635', badge: 'SQL' },
  image: { color: '#2dd4bf', mark: ImageMark },
  lock: { color: '#6b7280' },
  env: { color: '#fde047', accent: '#6b7280' },
  git: { color: '#f87171' },
  text: { color: DEFAULT_COLOR },
}

const EXTENSIONS = {
  js: TYPES.js,
  jsx: TYPES.js,
  mjs: TYPES.js,
  cjs: TYPES.js,
  ts: TYPES.ts,
  tsx: TYPES.ts,
  mts: TYPES.ts,
  cts: TYPES.ts,
  json: TYPES.json,
  jsonc: TYPES.json,
  json5: TYPES.json,
  css: TYPES.css,
  scss: TYPES.css,
  sass: TYPES.css,
  less: TYPES.css,
  html: TYPES.html,
  htm: TYPES.html,
  md: TYPES.md,
  mdx: TYPES.md,
  markdown: TYPES.md,
  py: TYPES.py,
  pyi: TYPES.py,
  pyw: TYPES.py,
  go: TYPES.go,
  rs: TYPES.rs,
  sh: TYPES.shell,
  bash: TYPES.shell,
  zsh: TYPES.shell,
  ksh: TYPES.shell,
  mk: TYPES.make,
  mak: TYPES.make,
  yml: TYPES.config,
  yaml: TYPES.config,
  toml: TYPES.config,
  ini: TYPES.config,
  conf: TYPES.config,
  sql: TYPES.sql,
  png: TYPES.image,
  jpg: TYPES.image,
  jpeg: TYPES.image,
  jpe: TYPES.image,
  gif: TYPES.image,
  webp: TYPES.image,
  avif: TYPES.image,
  svg: TYPES.image,
  ico: TYPES.image,
  bmp: TYPES.image,
  tif: TYPES.image,
  tiff: TYPES.image,
  heic: TYPES.image,
  heif: TYPES.image,
  lock: TYPES.lock,
  txt: TYPES.text,
  log: TYPES.text,
}

const FILENAMES = {
  makefile: TYPES.make,
  gnumakefile: TYPES.make,
  bsdmakefile: TYPES.make,
  dockerfile: TYPES.docker,
  containerfile: TYPES.docker,
  '.gitignore': TYPES.git,
  '.gitattributes': TYPES.git,
  '.gitmodules': TYPES.git,
  '.dockerignore': TYPES.docker,
  '.editorconfig': TYPES.config,
  '.npmrc': TYPES.config,
  '.nvmrc': TYPES.config,
  '.bashrc': TYPES.shell,
  '.bash_profile': TYPES.shell,
  '.zshrc': TYPES.shell,
  '.zprofile': TYPES.shell,
  '.profile': TYPES.shell,
  'go.mod': TYPES.go,
  'go.work': TYPES.go,
  'package-lock.json': TYPES.lock,
  'pnpm-lock.yaml': TYPES.lock,
  'yarn.lock': TYPES.lock,
  'cargo.lock': TYPES.lock,
  'go.sum': TYPES.lock,
}

const typeFor = (name = '') => {
  const lower = String(name).toLowerCase()
  if (FILENAMES[lower]) return FILENAMES[lower]
  if (lower === '.env' || lower.startsWith('.env.') || lower.endsWith('.env')) return TYPES.env
  if (lower.startsWith('dockerfile.')) return TYPES.docker
  const dot = lower.lastIndexOf('.')
  if (dot < 0) return null
  return EXTENSIONS[lower.slice(dot + 1)] ?? null
}

/**
 * FileIcon — stateless glyph for a file name.
 *
 * Known types (JS, JSON, Python, Go, Markdown, Make, shell, images) render a
 * logo. Everything else is a document tinted by extension.
 *
 * Props:
 *   name      {string} — file name used to pick the mark (e.g. `app.jsx`, `Makefile`)
 *   size      {number} — rendered size in px (default: 16); document badges show from 24px up
 *   className {string} — extra class on the svg
 */
const FileIcon = ({ name, size = 16, className = '' }) => {
  const type = typeFor(name)
  if (type?.mark) {
    const Logo = type.mark
    return <Logo size={size} className={className} />
  }

  const color = type?.color ?? DEFAULT_COLOR
  const accent = type?.accent ?? color
  const badge = size >= 24 ? type?.badge : null

  return (
    <svg
      className={iconClass(className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color }}
      aria-hidden
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" fill="currentColor" fillOpacity="0.14" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" stroke={accent} />
      {badge && (
        <text className="file-icon__badge" x="12" y="18" textAnchor="middle" fill="currentColor" stroke="none">
          {badge}
        </text>
      )}
    </svg>
  )
}

/**
 * FolderIcon — stateless folder / open-folder glyph.
 *
 * Props:
 *   open      {boolean} — render the open folder (default: false)
 *   size      {number}  — rendered size in px (default: 16)
 *   className {string}  — extra class on the svg
 */
export const FolderIcon = ({ open = false, size = 16, className = '' }) => (
  <svg
    className={`file-icon file-icon--folder${open ? ' file-icon--open' : ''}${className ? ` ${className}` : ''}`}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {open ? (
      <path
        d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"
        fill="currentColor"
        fillOpacity="0.14"
      />
    ) : (
      <path
        d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
        fill="currentColor"
        fillOpacity="0.14"
      />
    )}
  </svg>
)

export default FileIcon
