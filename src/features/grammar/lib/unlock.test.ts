import { describe, expect, it, beforeEach } from 'vitest'
import { isLevelUnlocked } from './unlock'
import { recordLevelScore, loadGrammarProgress, defaultGrammarProgress } from './storage'
import { levelsForChapter } from '../content/pack'
import { thresholdFor } from './unlock'
import type { Level } from '../content/pack'

describe('level unlock', () => {
  const [first, second] = levelsForChapter('simple')

  beforeEach(() => {
    localStorage.clear()
  })

  it('first level in chapter is always unlocked', () => {
    expect(isLevelUnlocked(first!, defaultGrammarProgress())).toBe(true)
  })

  it('second level locked until first is passed', () => {
    expect(isLevelUnlocked(second!, defaultGrammarProgress())).toBe(false)
    recordLevelScore(first!.id, thresholdFor(first as Level), thresholdFor(first as Level))
    expect(isLevelUnlocked(second!, loadGrammarProgress())).toBe(true)
  })
})
