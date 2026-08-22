import { describe, expect, it, beforeEach } from 'vitest'
import { isLevelUnlocked, levelUnlockHint, thresholdFor } from './unlock'
import { recordLevelScore, loadGrammarProgress, defaultGrammarProgress } from './storage'
import { levelsForChapter } from '../content/pack'
import type { Level } from '../content/pack'

describe('level unlock', () => {
  const simpleLevels = levelsForChapter('simple')
  const [first, second] = simpleLevels
  const [predicateFirst] = levelsForChapter('predicate')

  beforeEach(() => {
    localStorage.clear()
  })

  it('first level in first chapter is always unlocked', () => {
    expect(isLevelUnlocked(first!, defaultGrammarProgress())).toBe(true)
  })

  it('second level locked until first is passed', () => {
    expect(isLevelUnlocked(second!, defaultGrammarProgress())).toBe(false)
    recordLevelScore(first!.id, thresholdFor(first as Level), thresholdFor(first as Level))
    expect(isLevelUnlocked(second!, loadGrammarProgress())).toBe(true)
  })

  it('first level in next chapter locked until previous chapter is complete', () => {
    expect(isLevelUnlocked(predicateFirst!, defaultGrammarProgress())).toBe(false)
    expect(levelUnlockHint(predicateFirst!, defaultGrammarProgress())).toBe('先完成上一章')

    recordLevelScore(first!.id, thresholdFor(first as Level), thresholdFor(first as Level))
    expect(isLevelUnlocked(predicateFirst!, loadGrammarProgress())).toBe(false)

    for (const level of simpleLevels) {
      recordLevelScore(level.id, thresholdFor(level), thresholdFor(level))
    }
    expect(isLevelUnlocked(predicateFirst!, loadGrammarProgress())).toBe(true)
  })
})
