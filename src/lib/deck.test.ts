import { describe, it, expect } from 'vitest'
import { pickNextCard } from './deck'
import type { Card } from '../types/card'
import { defaultProgress, markForgot, markGotIt, todayKey } from './storage'

const cards: Card[] = [
  { id: 'a', word: 'a', sentence: 'A.', image: '/images/cards/a.jpg', imageSource: 'curated', tags: ['home'], tier: 'T1' },
  { id: 'b', word: 'b', sentence: 'B.', image: '/images/cards/b.jpg', imageSource: 'curated', tags: ['street'], tier: 'T1' },
  { id: 'c', word: 'c', sentence: 'C.', image: '/images/cards/c.jpg', imageSource: 'curated', tags: ['food'], tier: 'T1' },
]

describe('pickNextCard', () => {
  it('returns null for empty catalog', () => {
    expect(pickNextCard([], defaultProgress(), null)).toBeNull()
  })

  it('can force-pick from forgot when rng says so', () => {
    let p = markForgot(defaultProgress(), 'b')
    const result = pickNextCard(cards, p, null, () => 0.1)
    expect(result?.card.id).toBe('b')
  })

  it('avoids same tag as recent when alternatives exist', () => {
    const result = pickNextCard(cards, defaultProgress(), 'home', () => 0.9)
    expect(result?.card.tags[0]).not.toBe('home')
  })

  it('falls back to got-it cards only when needed', () => {
    let p = defaultProgress()
    const t = todayKey()
    p = markGotIt(p, 'a', t)
    p = markGotIt(p, 'b', t)
    p = markGotIt(p, 'c', t)
    const result = pickNextCard(cards, p, null, () => 0.9)
    expect(result).not.toBeNull()
  })
})
