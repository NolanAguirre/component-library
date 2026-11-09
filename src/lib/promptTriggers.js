// Client copy of harness/packages/prompt-triggers matching. The library can't
// import that package, so triggers arrive as data (see GET /prompt-triggers).

// `{ triggers: [{ patterns: [{ source, flags }] }] }` → triggers with RegExp
// patterns. matchAll needs the `g` flag, so it is added when missing.
export const parseTriggers = json => (Array.isArray(json) ? json : json?.triggers || []).map(trigger => ({
  ...trigger,
  patterns: (trigger.patterns || []).map(({ source, flags = '' }) =>
    new RegExp(source, flags.includes('g') ? flags : `${flags}g`)),
}))

// Matches from every applicable trigger, sorted by position. When matches
// overlap, the earlier (then longer) one wins. `first: false` skips triggers
// scoped to an agent's first prompt.
export const findTriggers = (text, triggers, { first = true } = {}) => {
  if (typeof text !== 'string' || !text || !triggers?.length) return []
  const matches = []
  for (const trigger of triggers) {
    if (!first && trigger.scope === 'first') continue
    for (const pattern of trigger.patterns) {
      for (const match of text.matchAll(pattern)) {
        if (!match[0]) continue
        matches.push({ id: trigger.id, start: match.index, end: match.index + match[0].length, text: match[0] })
      }
    }
  }
  matches.sort((a, b) => a.start - b.start || b.end - a.end)
  const out = []
  for (const match of matches) {
    if (out.length && match.start < out[out.length - 1].end) continue
    out.push(match)
  }
  return out
}
