import { describe, expect, it, beforeEach } from 'vitest'
import {
  hasLevelContentUpdate,
  isLevelUnlocked,
  levelListScoreLabel,
  levelUnlockHint,
  nextLevelAfter,
  playableCountForLevel,
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

  it('passed level never re-locks when a new level is appended to the previous chapter', () => {
    // 回归：predicate 章末尾新增 passive-1 后，predicate 不再"全通"，
    // 但已通关的 nonfinite 首关不能被重新锁上（通过态优先于门槛）。
    const nonfiniteFirst = levelsForChapter('nonfinite')[0]!
    saveGrammarProgress({
      ...defaultGrammarProgress(),
      passedLevelIds: [nonfiniteFirst.id],
      highScores: {
        [nonfiniteFirst.id]: playableCountForLevel(nonfiniteFirst.id),
      },
    })
    const progress = loadGrammarProgress()
    // predicate 全未通过 → 章节门槛判不过，但已通关必须保持解锁
    expect(levelUnlockHint(nonfiniteFirst, progress)).toBe('')
    expect(isLevelUnlocked(nonfiniteFirst, progress)).toBe(true)
  })

  it('nextLevelAfter walks chapter order across chapters', () => {
    expect(nextLevelAfter(first!.id)?.id).toBe(second!.id)
    expect(nextLevelAfter(simpleLevels[simpleLevels.length - 1]!.id)?.id).toBe(
      predicateFirst!.id,
    )

    const predicateLevels = levelsForChapter('predicate')
    const lastPredicate = predicateLevels[predicateLevels.length - 1]
    if (lastPredicate) {
      const nonfiniteFirst = levelsForChapter('nonfinite')[0]
      // Crosses into the next released chapter; null only if no next chapter.
      expect(nextLevelAfter(lastPredicate.id)?.id ?? null).toBe(
        nonfiniteFirst?.id ?? null,
      )
    }
  })

  it('shows 有更新 when sentence count grows after a pass', () => {
    const level = first!
    const total = playableCountForLevel(level.id)
    saveGrammarProgress({
      ...defaultGrammarProgress(),
      passedLevelIds: [level.id],
      highScores: { [level.id]: total - 1 },
      passedSentenceCounts: { [level.id]: total - 1 },
    })
    const progress = loadGrammarProgress()

    expect(hasLevelContentUpdate(level.id, progress)).toBe(true)
    expect(levelListScoreLabel(level, progress)).toBe(
      `最高 ${total - 1}/${total} · 有更新`,
    )
  })

  it('shows 最高 x/y before clear and 最高 x · 已过关 when score meets total', () => {
    const level = first!
    const total = playableCountForLevel(level.id)
    expect(thresholdFor(level)).toBe(total)

    saveGrammarProgress({
      ...defaultGrammarProgress(),
      highScores: { [level.id]: Math.max(0, total - 1) },
    })
    expect(levelListScoreLabel(level, loadGrammarProgress())).toBe(
      `最高 ${Math.max(0, total - 1)}/${total}`,
    )

    recordLevelScore(level.id, total, thresholdFor(level))
    expect(levelListScoreLabel(level, loadGrammarProgress())).toBe(
      `最高 ${total} · 已过关`,
    )
  })

  it('shows 有更新 when historically passed under a lower score than current total', () => {
    const level = first!
    const total = playableCountForLevel(level.id)
    saveGrammarProgress({
      ...defaultGrammarProgress(),
      passedLevelIds: [level.id],
      highScores: { [level.id]: Math.max(1, total - 1) },
      passedSentenceCounts: { [level.id]: total },
    })
    expect(hasLevelContentUpdate(level.id, loadGrammarProgress())).toBe(true)
    expect(levelListScoreLabel(level, loadGrammarProgress())).toBe(
      `最高 ${Math.max(1, total - 1)}/${total} · 有更新`,
    )
  })

  it('clears 有更新 after passing again on expanded content', () => {
    const level = first!
    recordLevelScore(level.id, thresholdFor(level), thresholdFor(level))
    expect(hasLevelContentUpdate(level.id, loadGrammarProgress())).toBe(false)
    expect(levelListScoreLabel(level, loadGrammarProgress())).toMatch(/已过关$/)
  })
})
