import { describe, it, expect } from 'vitest'
import { loadCards } from './loadCards'

const CDN = /^https:\/\/ali\.bczcdn\.com\/r\//

describe('loadCards', () => {
  it('returns at least 30 T1 baicizhan-placeholder cards with required fields', () => {
    const cards = loadCards()
    expect(cards.length).toBeGreaterThanOrEqual(30)
    for (const c of cards) {
      expect(c.id).toBeTruthy()
      expect(c.word).toBeTruthy()
      expect(c.sentence).toBeTruthy()
      expect(c.image).toMatch(CDN)
      expect(c.wordAudio).toMatch(CDN)
      expect(c.sentenceAudio).toMatch(CDN)
      expect(c.imageSource).toBe('baicizhan')
      expect(c.tier).toBe('T1')
      expect(Array.isArray(c.tags)).toBe(true)
      expect(c.tags.length).toBeGreaterThan(0)
      expect(c.sentence.toLowerCase()).not.toContain('baicizhan')
    }
    const ids = new Set(cards.map((c) => c.id))
    expect(ids.size).toBe(cards.length)
  })
})
