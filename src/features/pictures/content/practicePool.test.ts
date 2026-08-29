import { describe, it, expect } from 'vitest'
import type { Card } from '../../../types/card'
import {
  BATCH_SIZE,
  batchFullyStrong,
  buildPracticePool,
  needsReviewPrompt,
} from './practicePool'
import { defaultProgress, markForgot, markGotIt, markReviewGotIt, todayKey } from '../lib/storage'

function card(id: string): Card {
  return {
    id,
    word: id,
    sentence: `${id}.`,
    image: `/img/${id}.jpg`,
    imageSource: 'baicizhan',
    tags: [],
    tier: 'T1',
  }
}

describe('practicePool', () => {
  const batch = [card('a'), card('b'), card('c')]

  it('excludes strong and forgot; keeps warm and cold', () => {
    const t = todayKey()
    let p = markGotIt(defaultProgress(), 'a', t)
    p = markForgot(p, 'b', t)
    const pool = buildPracticePool(batch, [], p)
    expect(pool.map((c) => c.id)).toEqual(['c'])
  })

  it('includes warm words from outside the batch', () => {
    const t = todayKey()
    let p = markForgot(defaultProgress(), 'x', t)
    p = markReviewGotIt(p, 'x', t)
    const pool = buildPracticePool(batch, [card('x')], p)
    expect(pool.map((c) => c.id).sort()).toEqual(['a', 'b', 'c', 'x'])
  })

  it('does not include forgot-only outside words even if passed in', () => {
    const t = todayKey()
    const p = markForgot(defaultProgress(), 'x', t)
    const pool = buildPracticePool(batch, [card('x')], p)
    expect(pool.map((c) => c.id)).not.toContain('x')
  })

  it('batchFullyStrong is true only when every batch word is strong', () => {
    const t = todayKey()
    let p = markGotIt(defaultProgress(), 'a', t)
    p = markGotIt(p, 'b', t)
    expect(batchFullyStrong(batch, p)).toBe(false)
    p = markGotIt(p, 'c', t)
    expect(batchFullyStrong(batch, p)).toBe(true)
  })

  it('needsReviewPrompt when batch incomplete but practice pool empty', () => {
    const t = todayKey()
    let p = markForgot(defaultProgress(), 'a', t)
    p = markForgot(p, 'b', t)
    p = markForgot(p, 'c', t)
    expect(needsReviewPrompt(batch, buildPracticePool(batch, [], p), p)).toBe(true)
  })

  it('exports BATCH_SIZE 10', () => {
    expect(BATCH_SIZE).toBe(10)
  })
})
