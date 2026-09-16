/**
 * Global tag-color registry.
 *
 * Each entry in COLOR_MAP is an object with two variants:
 *   filled   — colored background, contrasting text
 *   inverted — contrasting background, colored text
 *
 * Assignment uses a global counter n (window.__tagColorCount):
 *   base index = n % 45        → selects one of the 45 color entries
 *   family     = baseIndex % 9 → which hue family
 *   shade      = ⌊baseIndex/9⌋ → which shade within the family
 *   inverted   = n >= 45       → filled pill (0–44) or inverted pill (45–89)
 *
 * window.__tagColorRegistry — Map<label, styleObject>  persists assignments.
 * window.__tagColorCount    — integer counter of unique labels assigned so far.
 */

// Contrast backgrounds used across all shades.
// D = dark bg  — pairs with light hex colors (shades 0–1)
// L = light bg — pairs with dark hex colors  (shades 2–4)
const D = '#334155'
const L = '#cbd5e1'

// Each shade entry: { hex, text, invertedBg }
//   hex        — the accent color (filled bg / inverted text / border)
//   text       — text color for the filled variant
//   invertedBg — background color for the inverted variant
const COLOR_MAP = {
  green: [
    { hex: '#86efac', text: D, invertedBg: D },
    { hex: '#4ade80', text: D, invertedBg: D },
    { hex: '#22c55e', text: D, invertedBg: D },
    { hex: '#16a34a', text: L, invertedBg: D },
    { hex: '#15803d', text: L, invertedBg: D },
  ],
  yellow: [
    { hex: '#fef08a', text: D, invertedBg: D },
    { hex: '#fde047', text: D, invertedBg: D },
    { hex: '#facc15', text: D, invertedBg: D },
    { hex: '#eab308', text: D, invertedBg: D },
    { hex: '#ca8a04', text: L, invertedBg: D },
  ],
  orange: [
    { hex: '#fed7aa', text: D, invertedBg: D },
    { hex: '#fdba74', text: D, invertedBg: D },
    { hex: '#fb923c', text: D, invertedBg: D },
    { hex: '#f97316', text: D, invertedBg: D },
    { hex: '#ea580c', text: L, invertedBg: D },
  ],
  red: [
    { hex: '#fca5a5', text: D, invertedBg: D },
    { hex: '#f87171', text: D, invertedBg: D },
    { hex: '#ef4444', text: D, invertedBg: D },
    { hex: '#dc2626', text: L, invertedBg: D },
    { hex: '#b91c1c', text: L, invertedBg: D },
  ],
  pink: [
    { hex: '#f9a8d4', text: D, invertedBg: D },
    { hex: '#f472b6', text: D, invertedBg: D },
    { hex: '#ec4899', text: D, invertedBg: D },
    { hex: '#db2777', text: L, invertedBg: D },
    { hex: '#be185d', text: L, invertedBg: D },
  ],
  cyan: [
    { hex: '#a5f3fc', text: D, invertedBg: D },
    { hex: '#67e8f9', text: D, invertedBg: D },
    { hex: '#22d3ee', text: D, invertedBg: D },
    { hex: '#06b6d4', text: L, invertedBg: D },
    { hex: '#0891b2', text: L, invertedBg: D },
  ],
  blue: [
    { hex: '#93c5fd', text: D, invertedBg: D },
    { hex: '#60a5fa', text: D, invertedBg: D },
    { hex: '#3b82f6', text: L, invertedBg: D },
    { hex: '#2563eb', text: L, invertedBg: L },
    { hex: '#1d4ed8', text: L, invertedBg: L },
  ],
  purple: [
    { hex: '#d8b4fe', text: D, invertedBg: D },
    { hex: '#c084fc', text: D, invertedBg: D },
    { hex: '#a855f7', text: D, invertedBg: D },
    { hex: '#9333ea', text: L, invertedBg: L },
    { hex: '#7c3aed', text: L, invertedBg: L },
  ],
  brown: [
    { hex: '#d6b899', text: D, invertedBg: D },
    { hex: '#c4a07a', text: D, invertedBg: D },
    { hex: '#a07850', text: L, invertedBg: D },
    { hex: '#7c5c38', text: L, invertedBg: L },
    { hex: '#5c4028', text: L, invertedBg: L },
  ],
  black: [
    { hex: '#9ca3af', text: D, invertedBg: D },
    { hex: '#6b7280', text: D, invertedBg: L },
    { hex: '#4b5563', text: L, invertedBg: L },
    { hex: '#374151', text: L, invertedBg: L },
    { hex: '#1f2937', text: L, invertedBg: L },
  ],
}

const COLOR_FAMILIES = Object.values(COLOR_MAP)
const NUM_FAMILIES   = COLOR_FAMILIES.length    // 9
const NUM_SHADES     = COLOR_FAMILIES[0].length // 5
const NUM_BASE       = NUM_FAMILIES * NUM_SHADES // 50
const NUM_TOTAL      = NUM_BASE * 2              // 100

const initRegistry = () => {
  if (!window.__tagColorRegistry) window.__tagColorRegistry = new Map()
  if (window.__tagColorCount === undefined) window.__tagColorCount = 0
}

export const resolveStyles = (label) => {
  initRegistry()
  const registry = window.__tagColorRegistry
  if (registry.has(label)) return registry.get(label)

  const n         = window.__tagColorCount % NUM_TOTAL
  const baseIndex = n % NUM_BASE
  const family    = baseIndex % NUM_FAMILIES
  const shade     = Math.floor(baseIndex / NUM_FAMILIES)
  const inverted  = n >= NUM_BASE
  const { hex, text, invertedBg } = COLOR_FAMILIES[family][shade]
  const styles = inverted
    ? { background: invertedBg, color: hex,  border: `1px solid ${hex}` }
    : { background: hex,        color: text, border: `1px solid ${hex}` }
  window.__tagColorCount++

  registry.set(label, styles)
  return styles
}

export default resolveStyles
