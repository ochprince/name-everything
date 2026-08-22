import type { GrammarPoint, SentenceSpan } from '../content/pack'

export type SpanRange = { start: number; end: number }

export function spanRangeKey(start: number, end: number): string {
  return `${start}:${end}`
}

export function groupSpansByRange(spans: SentenceSpan[]): Map<string, SentenceSpan[]> {
  const groups = new Map<string, SentenceSpan[]>()
  for (const span of spans) {
    const key = spanRangeKey(span.start, span.end)
    const list = groups.get(key) ?? []
    list.push(span)
    groups.set(key, list)
  }
  return groups
}

export function buildClickablePieces(
  en: string,
  spans: SentenceSpan[],
): Array<{ key: string; text: string; range?: SpanRange }> {
  const byRange = groupSpansByRange(spans)
  const uniqueRanges = [...byRange.keys()]
    .map((key) => {
      const [start, end] = key.split(':').map(Number)
      return { start: start!, end: end!, key }
    })
    .sort((a, b) => a.start - b.start || a.end - b.end)

  const pieces: Array<{ key: string; text: string; range?: SpanRange }> = []
  let cursor = 0
  for (const { start, end, key } of uniqueRanges) {
    if (start < cursor) continue
    if (start > cursor) {
      pieces.push({ key: `t-${cursor}`, text: en.slice(cursor, start) })
    }
    pieces.push({
      key,
      text: en.slice(start, end),
      range: { start, end },
    })
    cursor = end
  }
  if (cursor < en.length) {
    pieces.push({ key: `t-${cursor}`, text: en.slice(cursor) })
  }
  return pieces
}

export function pointsForRange(
  spans: SentenceSpan[],
  range: SpanRange,
  lookup: (id: string) => GrammarPoint | undefined,
): GrammarPoint[] {
  const group = groupSpansByRange(spans).get(spanRangeKey(range.start, range.end)) ?? []
  const seen = new Set<string>()
  const points: GrammarPoint[] = []
  for (const span of group) {
    if (seen.has(span.grammar_point_id)) continue
    seen.add(span.grammar_point_id)
    const point = lookup(span.grammar_point_id)
    if (point) points.push(point)
  }
  return points
}

export function rangesEqual(a: SpanRange | null, b: SpanRange | null): boolean {
  if (!a || !b) return false
  return a.start === b.start && a.end === b.end
}
