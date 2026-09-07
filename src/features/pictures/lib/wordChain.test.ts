import { describe, expect, it } from 'vitest'
import {
  CHAIN_RARE_ENDINGS,
  chainReasonCopy,
  checkChainWord,
  loadBestChain,
  normalizeWord,
  pickStartWord,
  rareEndingBonus,
  updateBestChain,
} from './wordChain'

const known = new Set(['time', 'egg', 'gate', 'eight', 'tea', 'cat', 'quiz'])

describe('checkChainWord', () => {
  it('accepts a word that starts with the last letter', () => {
    expect(checkChainWord('Time', 't', new Set(), known)).toEqual({
      ok: true,
      word: 'time',
      score: 1,
    })
  })

  it('is case-insensitive for the leading letter', () => {
    expect(checkChainWord('Time', 'T', new Set(), known).ok).toBe(true)
  })

  it('rejects a wrong first letter', () => {
    expect(checkChainWord('cat', 'e', new Set(), known)).toEqual({
      ok: false,
      reason: 'letter',
    })
  })

  it('rejects words outside the dictionary', () => {
    expect(checkChainWord('tiger', 't', new Set(), known)).toEqual({
      ok: false,
      reason: 'unknown',
    })
  })

  it('rejects words already used this round', () => {
    expect(checkChainWord('time', 't', new Set(['time']), known)).toEqual({
      ok: false,
      reason: 'repeat',
    })
  })

  it('rejects empty input', () => {
    expect(checkChainWord('   ', 'e', new Set(), known)).toEqual({
      ok: false,
      reason: 'letter',
    })
  })

  it('doubles score for rare endings', () => {
    expect(checkChainWord('quiz', 'q', new Set(), known)).toEqual({
      ok: true,
      word: 'quiz',
      score: 2,
    })
  })
})

describe('helpers', () => {
  it('normalizes case and trims', () => {
    expect(normalizeWord('  Time  ')).toBe('time')
  })

  it('flags rare endings', () => {
    expect(CHAIN_RARE_ENDINGS).toContain('z')
    expect(rareEndingBonus('z')).toBe(true)
    expect(rareEndingBonus('a')).toBe(false)
  })

  it('maps reasons to copy', () => {
    expect(chainReasonCopy('letter')).toMatch(/首字母/)
    expect(chainReasonCopy('unknown')).toMatch(/词库/)
    expect(chainReasonCopy('repeat')).toMatch(/用过/)
  })

  it('picks from the highest-frequency pool only', () => {
    const zipf = (w: string) => ({ time: 6, egg: 5, gate: 1 })[w] ?? 0
    const seen = new Set<string>()
    for (let i = 0; i < 40; i += 1) seen.add(pickStartWord(['gate', 'egg', 'time'], zipf, 2)!)
    expect(seen.has('gate')).toBe(false)
    expect(seen.size).toBe(2)
  })

  it('returns null for an empty candidate list', () => {
    expect(pickStartWord([], () => 0)).toBeNull()
  })
})

describe('best record', () => {
  it('reads and updates the record with score priority', () => {
    localStorage.clear()
    expect(loadBestChain()).toBeNull()

    const first = updateBestChain({ length: 3, score: 4 })
    expect(first.isNew).toBe(true)
    expect(loadBestChain()).toEqual({ length: 3, score: 4 })

    // same length but higher score -> new record
    expect(updateBestChain({ length: 3, score: 5 }).isNew).toBe(true)
    // lower score -> not a record even with longer chain
    expect(updateBestChain({ length: 4, score: 3 }).isNew).toBe(false)
    expect(loadBestChain()).toEqual({ length: 3, score: 5 })
    localStorage.clear()
  })

  it('survives corrupted storage', () => {
    localStorage.clear()
    localStorage.setItem('name-everything/wordChain/best', '{oops')
    expect(loadBestChain()).toBeNull()
    localStorage.clear()
  })
})
