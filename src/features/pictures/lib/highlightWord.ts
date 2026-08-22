export type HighlightPart = { text: string; highlight: boolean }

export function highlightParts(sentence: string, word: string): HighlightPart[] {
  const trimmed = word.trim()
  if (!trimmed) return [{ text: sentence, highlight: false }]
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = sentence.match(new RegExp(`\\b(${escaped}(?:es|s)?)\\b`, 'i'))
  if (!match || match.index === undefined) {
    return [{ text: sentence, highlight: false }]
  }
  const start = match.index
  const end = start + match[0].length
  const parts: HighlightPart[] = []
  if (start > 0) parts.push({ text: sentence.slice(0, start), highlight: false })
  parts.push({ text: sentence.slice(start, end), highlight: true })
  if (end < sentence.length) {
    parts.push({ text: sentence.slice(end), highlight: false })
  }
  return parts
}
