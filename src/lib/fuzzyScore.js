/**
 * fuzzyScore — subsequence match score for a fuzzy filter.
 *
 * Returns null when the query characters are not all present, in order, in the
 * text. Otherwise returns a score where contiguous runs and earlier matches
 * rank higher, so the closest matches sort to the top.
 */
const fuzzyScore = (text, query) => {
  const haystack = String(text).toLowerCase()
  const needle = String(query).toLowerCase()
  let score = 0
  let searchFrom = 0
  let previousMatch = -2

  for (const char of needle) {
    const matchIndex = haystack.indexOf(char, searchFrom)
    if (matchIndex === -1) return null

    score += matchIndex === previousMatch + 1 ? 2 : 1
    score -= matchIndex * 0.01

    previousMatch = matchIndex
    searchFrom = matchIndex + 1
  }

  return score
}

export { fuzzyScore }
