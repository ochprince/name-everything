import { describe, expect, it } from 'vitest'
import {
  buildClickablePieces,
  groupSpansByRange,
  pointsForRange,
  rangesEqual,
} from './spanGroups'
import type { SentenceSpan } from '../content/pack'

const lookup = (id: string) =>
  ({
    'gp-a': { id: 'gp-a', title_zh: 'A', body_zh: 'alpha' },
    'gp-b': { id: 'gp-b', title_zh: 'B', body_zh: 'beta' },
    'gp-v': { id: 'gp-v', title_zh: 'V', body_zh: 'verb' },
  })[id]

describe('spanGroups', () => {
  it('groups spans with the same start/end', () => {
    const spans: SentenceSpan[] = [
      { id: '1', sentence_id: 's', grammar_point_id: 'gp-a', start: 3, end: 7 },
      { id: '2', sentence_id: 's', grammar_point_id: 'gp-b', start: 3, end: 7 },
      { id: '3', sentence_id: 's', grammar_point_id: 'gp-v', start: 0, end: 2 },
    ]
    const groups = groupSpansByRange(spans)
    expect(groups.get('3:7')).toHaveLength(2)
    expect(groups.get('0:2')).toHaveLength(1)
  })

  it('builds one clickable piece per unique range', () => {
    const spans: SentenceSpan[] = [
      { id: '1', sentence_id: 's', grammar_point_id: 'gp-a', start: 0, end: 2 },
      { id: '2', sentence_id: 's', grammar_point_id: 'gp-b', start: 0, end: 2 },
      { id: '3', sentence_id: 's', grammar_point_id: 'gp-v', start: 3, end: 7 },
    ]
    const pieces = buildClickablePieces('He sent', spans)
    expect(pieces.filter((p) => p.range)).toHaveLength(2)
    expect(pieces.find((p) => p.range?.start === 0)?.text).toBe('He')
    expect(pieces.find((p) => p.range?.start === 3)?.text).toBe('sent')
  })

  it('returns all grammar points for a range in span order', () => {
    const spans: SentenceSpan[] = [
      { id: '1', sentence_id: 's', grammar_point_id: 'gp-a', start: 3, end: 7 },
      { id: '2', sentence_id: 's', grammar_point_id: 'gp-b', start: 3, end: 7 },
    ]
    const points = pointsForRange(spans, { start: 3, end: 7 }, lookup)
    expect(points.map((p) => p.id)).toEqual(['gp-a', 'gp-b'])
  })

  it('dedupes duplicate grammar_point_id on the same range', () => {
    const spans: SentenceSpan[] = [
      { id: '1', sentence_id: 's', grammar_point_id: 'gp-a', start: 3, end: 7 },
      { id: '2', sentence_id: 's', grammar_point_id: 'gp-a', start: 3, end: 7 },
    ]
    expect(pointsForRange(spans, { start: 3, end: 7 }, lookup)).toHaveLength(1)
  })

  it('compares ranges by start and end', () => {
    expect(rangesEqual({ start: 1, end: 3 }, { start: 1, end: 3 })).toBe(true)
    expect(rangesEqual({ start: 1, end: 3 }, { start: 1, end: 4 })).toBe(false)
    expect(rangesEqual(null, { start: 1, end: 3 })).toBe(false)
  })
})
