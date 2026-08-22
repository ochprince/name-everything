import { describe, expect, it, beforeEach } from 'vitest'
import {
  hasLevelContentUpdate,
  isLevelUnlocked,
  levelListScoreLabel,
  levelUnlockHint,
  nextLevelAfter,
  sentenceCountForLevel,
  thresholdFor,
} from './unlock'
import {
  recordLevelScore,
  loadGrammarProgress,
  defaultGrammarProgress,
  saveGrammarProgress,
} from './storage'
import { levelsForChapter } from '../content/pack'

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
    recordLevelScore(first!.id, thresholdFor(first!), thresholdFor(first!))
    expect(isLevelUnlocked(second!, loadGrammarProgress())).toBe(true)
  })

  it('first level in next chapter locked until previous chapter is complete', () => {
    expect(isLevelUnlocked(predicateFirst!, defaultGrammarProgress())).toBe(false)
    expect(levelUnlockHint(predicateFirst!, defaultGrammarProgress())).toBe('先完成上一章')

    recordLevelScore(first!.id, thresholdFor(first!), thresholdFor(first!))
    expect(isLevelUnlocked(predicateFirst!, loadGrammarProgress())).toBe(false)

    for (const level of simpleLevels) {
      recordLevelScore(level.id, thresholdFor(level), thresholdFor(level))
    }
    expect(isLevelUnlocked(predicateFirst!, loadGrammarProgress())).toBe(true)
  })

  it('nextLevelAfter walks chapter order and skips unreleased chapters', () => {
    expect(nextLevelAfter(first!.id)?.id).toBe(second!.id)
    expect(nextLevelAfter(simpleLevels[simpleLevels.length - 1]!.id)?.id).toBe(
      predicateFirst!.id,
    )

    const predicateLevels = levelsForChapter('predicate')
    const lastPredicate = predicateLevels[predicateLevels.length - 1]
    if (lastPredicate) {
      expect(nextLevelAfter(lastPredicate.id)).toBeNull()
    }
  })

  it('shows 有更新 when sentence count grows after a pass', () => {
    const level = first!
    const total = sentenceCountForLevel(level.id)
    saveGrammarProgress({
      ...defaultGrammarProgress(),
      passedLevelIds: [level.id],
      highScores: { [level.id]: 4 },
      passedSentenceCounts: { [level.id]: total - 1 },
    })
    const progress = loadGrammarProgress()

    expect(hasLevelContentUpdate(level.id, progress)).toBe(true)
    expect(levelListScoreLabel(level, progress)).toBe(
      `最高 4/${total} · 有更新`,
    )
  })

  it('clears 有更新 after passing again on expanded content', () => {
    const level = first!
    recordLevelScore(level.id, thresholdFor(level), thresholdFor(level))
    expect(hasLevelContentUpdate(level.id, loadGrammarProgress())).toBe(false)
    expect(levelListScoreLabel(level, loadGrammarProgress())).toMatch(/已过关$/)
  })
})
