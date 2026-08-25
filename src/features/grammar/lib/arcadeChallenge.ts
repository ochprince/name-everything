import { gameTuning } from '../content/tuning'
import type { Sentence } from '../content/pack'
import { chaptersInOrder, levelsForChapter } from '../content/pack'
import { shuffle } from './engine'

export const ARCADE_SESSION_SIZE = 30
export const ARCADE_GROUP_SIZE = 5

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
export function buildArcadeQueue(playables: Sentence[]): string[] {
  if (playables.length === 0) return []

  const targetSize = arcadeSessionSize(playables.length)
  const rank = difficultyRankMap()
  const sorted = [...playables].sort(
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

  // Fill remaining slots from evenly-sliced difficulty layers of leftovers.
  const leftover = sorted.filter((sentence) => !usedIds.has(sentence.id))
  const quota = targetSize - picked.length
  for (let i = 0; i < quota; i++) {
    const start = Math.floor((i * leftover.length) / quota)
    const end = Math.floor(((i + 1) * leftover.length) / quota)
    const sentence = shuffle(leftover.slice(start, end))[0]
    if (!sentence) continue
    picked.push(sentence.id)
    usedIds.add(sentence.id)
  }

  const pickedSentences = sorted.filter((sentence) => usedIds.has(sentence.id))
  return groupByDifficulty(pickedSentences.map((sentence) => sentence.id))
}
