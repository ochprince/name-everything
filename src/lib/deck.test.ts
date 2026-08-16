import { describe, it, expect } from 'vitest'
import { pickNextCard } from './deck'
import type { Card } from '../types/card'
import {
  defaultProgress,
  markForgot,
  markGotIt,
  markReviewGotIt,
  todayKey,
} from './storage'

const cards: Card[] = [
  { id: 'a', word: 'a', sentence: 'A.', image: '/images/cards/a.jpg', imageSource: 'curated', tags: ['home'], tier: 'T1' },
  { id: 'b', word: 'b', sentence: 'B.', image: '/images/cards/b.jpg', imageSource: 'curated', tags: ['street'], tier: 'T1' },
  { id: 'c', word: 'c', sentence: 'C.', image: '/images/cards/c.jpg', imageSource: 'curated', tags: ['food'], tier: 'T1' },
]

describe('pickNextCard', () => {
  it('returns null for empty catalog', () => {
    expect(pickNextCard([], defaultProgress(), null)).toBeNull()
  })

  it('returns null when every card is 较好记忆', () => {
    const t = todayKey()
    let p = defaultProgress()
    p = markGotIt(p, 'a', t)
    p = markGotIt(p, 'b', t)
    p = markGotIt(p, 'c', t)
    expect(pickNextCard(cards, p, null, () => 0.9)).toBeNull()
  })

  it('never recycles a strong card while cold or warm remain', () => {
    const t = todayKey()
    let p = markGotIt(defaultProgress(), 'a', t)
    p = markForgot(p, 'b', t)
    const result = pickNextCard(cards, p, null, () => 0.9)
    expect(result?.card.id).not.toBe('a')
  })

  it('picks warm when rng lands in the warm band', () => {
    const t = todayKey()
    let p = markForgot(defaultProgress(), 'b', t)
    p = markReviewGotIt(p, 'b', t)
    const result = pickNextCard(cards, p, null, () => 0.8)
    expect(result?.card.id).toBe('b')
  })

  it('picks cold when rng lands in the cold band', () => {
    const t = todayKey()
    let p = markForgot(defaultProgress(), 'b', t)
    p = markReviewGotIt(p, 'b', t)
    const result = pickNextCard(cards, p, null, () => 0.1)
    expect(result?.card.id).not.toBe('b')
  })

  it('avoids same tag as recent when alternatives exist', () => {
    const result = pickNextCard(cards, defaultProgress(), 'home', () => 0.9)
    expect(result?.card.tags[0]).not.toBe('home')
  })
})
