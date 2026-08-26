import { describe, it, expect, beforeEach } from 'vitest'
import {
  addChallengeWord,
  clearChallengeWords,
  hasChallengeWord,
  loadChallengeWords,
  removeChallengeWord,
  toggleChallengeWord,
} from './challengeCollection'

describe('challengeCollection', () => {
  beforeEach(() => {
    localStorage.clear()
    clearChallengeWords()
  })

  it('starts empty', () => {
    expect(loadChallengeWords()).toEqual([])
  })

  it('adds unique words newest-first', () => {
    addChallengeWord('dish')
    addChallengeWord('cup')
    expect(loadChallengeWords()).toEqual(['cup', 'dish'])
    addChallengeWord('dish')
    expect(loadChallengeWords()).toEqual(['dish', 'cup'])
  })

  it('removes a word', () => {
    addChallengeWord('dish')
    addChallengeWord('cup')
    removeChallengeWord('dish')
    expect(loadChallengeWords()).toEqual(['cup'])
    expect(hasChallengeWord('dish')).toBe(false)
  })

  it('toggle adds then removes', () => {
    expect(toggleChallengeWord('dish')).toBe(true)
    expect(hasChallengeWord('dish')).toBe(true)
    expect(toggleChallengeWord('dish')).toBe(false)
    expect(hasChallengeWord('dish')).toBe(false)
  })
})
