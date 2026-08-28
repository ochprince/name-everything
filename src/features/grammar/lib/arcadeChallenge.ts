import { gameTuning } from '../content/tuning'
import type { Sentence } from '../content/pack'
import { chaptersInOrder, levelsForChapter } from '../content/pack'
import { shuffle } from './engine'

export const ARCADE_SESSION_SIZE = 30
export const ARCADE_GROUP_SIZE = 5

/** 句子分达到此值视为牢固掌握，退出挑战池（不再出现）。 */
export const MASTERED_SCORE = 5

/**
 * 句子掌握度档位：未掌握(0) > 新句/归零(1) > 巩固中(2)。
 * 负分不按绝对值加权（错 5 次 ≠ 5 倍优先级），统一归"未掌握"一档。
 */
export function scoreTier(score: number | undefined): 0 | 1 | 2 {
  const value = score ?? 0
  if (value < 0) return 0
  if (value === 0) return 1
  return 2
}

/** 从同难度层内按掌握度档位优先取一句（同档随机）。 */
function pickByTier(
  items: Sentence[],
  sentenceScores: Record<string, number>,
): Sentence | undefined {
  if (items.length === 0) return undefined
  const bestTier = Math.min(...items.map((s) => scoreTier(sentenceScores[s.id])))
  const best = items.filter((s) => scoreTier(sentenceScores[s.id]) === bestTier)
  return shuffle(best)[0]
}

/** Fall-duration multipliers per group (group 0 = sentences 1–5). Lower = faster. */
export const ARCADE_GROUP_SPEED_FACTORS = [1, 0.9, 0.8, 0.7, 0.65, 0.6] as const

export function arcadeSessionSize(poolSize: number): number {
  return Math.min(ARCADE_SESSION_SIZE, poolSize)
}

export function arcadePoolEligibleForTrophy(poolSize: number): boolean {
  return poolSize >= ARCADE_SESSION_SIZE
}

export function arcadeEarnedTrophy(
  cleared: boolean,
  total: number,
  poolSize: number,
): boolean {
  return cleared && total >= ARCADE_SESSION_SIZE && arcadePoolEligibleForTrophy(poolSize)
}

export function arcadeGroupIndex(clearedCount: number): number {
  return Math.floor(clearedCount / ARCADE_GROUP_SIZE)
}

export function arcadeGroupNumber(clearedCount: number): number {
  return arcadeGroupIndex(clearedCount) + 1
}

export function arcadeFallDurationMs(
  clearedCount: number,
  baseMs: number = gameTuning.fall_duration_ms,
): number {
  const groupIndex = arcadeGroupIndex(clearedCount)
  const factor =
    ARCADE_GROUP_SPEED_FACTORS[
      Math.min(groupIndex, ARCADE_GROUP_SPEED_FACTORS.length - 1)
    ] ?? 0.6
  return Math.round(baseMs * factor)
}

export function shouldShowGroupSpeedBanner(
  clearedCount: number,
  hasMoreSentences: boolean,
): boolean {
  return (
    clearedCount > 0 &&
    clearedCount % ARCADE_GROUP_SIZE === 0 &&
    hasMoreSentences
  )
}

/** Difficulty rank: chapter order first, then level order (monotonic). */
function difficultyRankMap(): Map<string, number> {
  const rank = new Map<string, number>()
  let i = 0
  for (const chapter of chaptersInOrder()) {
    for (const level of levelsForChapter(chapter.id)) {
      rank.set(level.id, i++)
    }
  }
  return rank
}

/** Pick `count` items spread evenly across a sorted array (middle of each layer). */
function pickEvenly<T>(items: T[], count: number): T[] {
  const picked: T[] = []
  for (let i = 0; i < count; i++) {
    const start = Math.floor((i * items.length) / count)
    const end = Math.floor(((i + 1) * items.length) / count)
    picked.push(items[Math.floor((start + end) / 2)]!)
  }
  return picked
}

/** Slice difficulty-ordered ids into 5-sentence groups; shuffle inside a group only. */
function groupByDifficulty(ids: string[]): string[] {
  const result: string[] = []
  for (let i = 0; i < ids.length; i += ARCADE_GROUP_SIZE) {
    result.push(...shuffle(ids.slice(i, i + ARCADE_GROUP_SIZE)))
  }
  return result
}

/**
 * Stratified arcade queue by difficulty:
 * 1. Order the pool by (chapter order, level order).
 * 2. If the pool fits in the session size, keep everything.
 *    Otherwise guarantee one sentence per passed level, then fill the
 *    remaining slots with one random sentence from each evenly-sliced
 *    difficulty layer of the leftovers (many levels: spread the
 *    one-per-level guarantee evenly across difficulty instead).
 * 3. Slice the picked sentences — kept in difficulty order — into groups of
 *    5, shuffling inside each group. Group order is strictly increasing in
 *    difficulty, so later groups draw from later chapters/levels.
 */
export function buildArcadeQueue(
  playables: Sentence[],
  sentenceScores: Record<string, number> = {},
): string[] {
  if (playables.length === 0) return []

  // 牢固掌握（score ≥ MASTERED_SCORE）的句子退出挑战池。
  const eligible = playables.filter(
    (sentence) => (sentenceScores[sentence.id] ?? 0) < MASTERED_SCORE,
  )
  if (eligible.length === 0) return []

  const targetSize = arcadeSessionSize(eligible.length)
  const rank = difficultyRankMap()
  const sorted = [...eligible].sort(
    (a, b) => (rank.get(a.level_id) ?? 0) - (rank.get(b.level_id) ?? 0),
  )

  if (sorted.length <= targetSize) {
    return groupByDifficulty(sorted.map((sentence) => sentence.id))
  }

  const byLevel = new Map<string, Sentence[]>()
  for (const sentence of sorted) {
    const list = byLevel.get(sentence.level_id) ?? []
    list.push(sentence)
    byLevel.set(sentence.level_id, list)
  }

  const levelIds = [...byLevel.keys()] // already in difficulty order
  const picked: string[] = []
  const usedIds = new Set<string>()

  // One random sentence from every passed level (spread evenly when many).
  const levelsToSample =
    levelIds.length > targetSize ? pickEvenly(levelIds, targetSize) : levelIds

  for (const levelId of levelsToSample) {
    const sentence = shuffle(byLevel.get(levelId) ?? [])[0]
    if (!sentence) continue
    picked.push(sentence.id)
    usedIds.add(sentence.id)
  }

  // Fill remaining slots from evenly-sliced difficulty layers of leftovers,
  // preferring mastered-tier order (unmastered > new > consolidating) inside
  // each layer — difficulty spread stays intact, focus lands on weak sentences.
  const leftover = sorted.filter((sentence) => !usedIds.has(sentence.id))
  const quota = targetSize - picked.length
  for (let i = 0; i < quota; i++) {
    const start = Math.floor((i * leftover.length) / quota)
    const end = Math.floor(((i + 1) * leftover.length) / quota)
    const sentence = pickByTier(leftover.slice(start, end), sentenceScores)
    if (!sentence) continue
    picked.push(sentence.id)
    usedIds.add(sentence.id)
  }

  const pickedSentences = sorted.filter((sentence) => usedIds.has(sentence.id))
  return groupByDifficulty(pickedSentences.map((sentence) => sentence.id))
}
