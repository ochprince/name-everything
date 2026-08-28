import { describe, expect, it } from 'vitest'
import { grammarPack } from '../content/pack'
import {
  ARCADE_GROUP_SIZE,
  ARCADE_SESSION_SIZE,
  arcadeEarnedTrophy,
  arcadeFallDurationMs,
  arcadeGroupIndex,
  arcadeGroupNumber,
  arcadePoolEligibleForTrophy,
  arcadeSessionSize,
  buildArcadeQueue,
  scoreTier,
  shouldShowGroupSpeedBanner,
} from './arcadeChallenge'
import { gameTuning } from '../content/tuning'

function playablesForLevels(levelIds: string[]) {
  const set = new Set(levelIds)
  return grammarPack.sentences.filter(
    (sentence) => sentence.kind === 'playable' && set.has(sentence.level_id),
  )
}

describe('arcadeChallenge', () => {
  it('caps session size at pool length when pool is smaller than 30', () => {
    const pool = playablesForLevels(['dative-1'])
    expect(arcadeSessionSize(pool.length)).toBe(pool.length)
    expect(arcadePoolEligibleForTrophy(pool.length)).toBe(false)
  })

  it('builds a unique queue with one sentence per level when levels exceed session size', () => {
    const levelIds = grammarPack.levels.map((level) => level.id)
    const pool = playablesForLevels(levelIds)
    if (levelIds.length <= ARCADE_SESSION_SIZE) return

    const queue = buildArcadeQueue(pool)
    expect(queue).toHaveLength(ARCADE_SESSION_SIZE)
    expect(new Set(queue).size).toBe(ARCADE_SESSION_SIZE)

    const levelsInQueue = new Set(
      queue.map((id) => grammarPack.sentences.find((s) => s.id === id)!.level_id),
    )
    expect(levelsInQueue.size).toBe(ARCADE_SESSION_SIZE)
  })

  it('includes at least one sentence from each passed level before filling', () => {
    const pool = playablesForLevels(['dative-1', 'svo-1', 'sv-1'])
    const queue = buildArcadeQueue(pool)
    expect(queue.length).toBe(arcadeSessionSize(pool.length))
    expect(new Set(queue).size).toBe(queue.length)

    for (const levelId of ['dative-1', 'svo-1', 'sv-1']) {
      expect(
        queue.some(
          (id) => grammarPack.sentences.find((s) => s.id === id)?.level_id === levelId,
        ),
      ).toBe(true)
    }
  })

  it('keeps groups strictly increasing in difficulty (later groups draw from later chapters)', () => {
    const pool = playablesForLevels(grammarPack.levels.map((level) => level.id))
    const queue = buildArcadeQueue(pool)
    expect(queue.length).toBe(Math.min(ARCADE_SESSION_SIZE, pool.length))
    expect(new Set(queue).size).toBe(queue.length)

    const rankOf = (sentenceId: string) => {
      const sentence = grammarPack.sentences.find((s) => s.id === sentenceId)!
      const level = grammarPack.levels.find((l) => l.id === sentence.level_id)!
      const chapter = grammarPack.chapters.find((c) => c.id === level.chapter_id)!
      return chapter.sort_order * 100 + level.sort_order
    }
    const ranks = queue.map(rankOf)

    for (let g = 1; g < Math.ceil(ranks.length / ARCADE_GROUP_SIZE); g++) {
      const start = g * ARCADE_GROUP_SIZE
      const prevMax = Math.max(...ranks.slice(start - ARCADE_GROUP_SIZE, start))
      const curMin = Math.min(...ranks.slice(start, start + ARCADE_GROUP_SIZE))
      // 同关平行句 rank 相同，允许相等；组间不得出现难度回退
      expect(curMin).toBeGreaterThanOrEqual(prevMax)
    }
  })

  it('maps cleared counts to group index and fall duration', () => {
    expect(arcadeGroupIndex(0)).toBe(0)
    expect(arcadeGroupIndex(4)).toBe(0)
    expect(arcadeGroupIndex(5)).toBe(1)
    expect(arcadeGroupNumber(5)).toBe(2)
    expect(arcadeFallDurationMs(0)).toBe(gameTuning.fall_duration_ms)
    expect(arcadeFallDurationMs(5)).toBe(Math.round(gameTuning.fall_duration_ms * 0.9))
  })

  it('shows group banner after every full group when more sentences remain', () => {
    expect(shouldShowGroupSpeedBanner(5, true)).toBe(true)
    expect(shouldShowGroupSpeedBanner(5, false)).toBe(false)
    expect(shouldShowGroupSpeedBanner(4, true)).toBe(false)
    expect(shouldShowGroupSpeedBanner(ARCADE_GROUP_SIZE * 2, true)).toBe(true)
  })

  it('awards trophy only for full 30/30 clears when pool is large enough', () => {
    expect(arcadeEarnedTrophy(true, 12, 12)).toBe(false)
    expect(arcadeEarnedTrophy(true, 30, 45)).toBe(true)
    expect(arcadeEarnedTrophy(false, 28, 45)).toBe(false)
    expect(arcadeEarnedTrophy(true, 30, 20)).toBe(false)
  })

  it('tiers sentence scores: unmastered < new < consolidating', () => {
    expect(scoreTier(-1)).toBe(0)
    expect(scoreTier(-99)).toBe(0) // 负分不按绝对值加深，统一未掌握档
    expect(scoreTier(undefined)).toBe(1)
    expect(scoreTier(0)).toBe(1)
    expect(scoreTier(4)).toBe(2)
    expect(scoreTier(9)).toBe(2)
  })

  it('filters mastered sentences out of the challenge pool', () => {
    const pool = playablesForLevels(['dative-1', 'svo-1'])
    // 全部掌握（≥5 分）→ 池空
    const mastered: Record<string, number> = {}
    for (const sentence of pool) mastered[sentence.id] = 5
    expect(buildArcadeQueue(pool, mastered)).toEqual([])

    // 其中一句答错过（负分）→ 回到池中，其余仍被过滤
    const target = pool[0]!
    const queue = buildArcadeQueue(pool, { ...mastered, [target.id]: -3 })
    expect(queue).toContain(target.id)
    expect(queue).toHaveLength(1)
  })
})
