import { gameTuning } from '../content/tuning'
import type { Sentence } from '../content/pack'
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

/**
 * Stratified arcade queue: each passed level contributes at least one sentence,
 * then fill to session size without replacement. When levels > session size,
 * pick one random sentence from each of `sessionSize` random levels.
 */
export function buildArcadeQueue(playables: Sentence[]): string[] {
  if (playables.length === 0) return []

  const targetSize = arcadeSessionSize(playables.length)
  const byLevel = new Map<string, Sentence[]>()
  for (const sentence of playables) {
    const list = byLevel.get(sentence.level_id) ?? []
    list.push(sentence)
    byLevel.set(sentence.level_id, list)
  }

  const levelIds = [...byLevel.keys()]
  const picked: string[] = []
  const usedIds = new Set<string>()

  const levelsToSample =
    levelIds.length > targetSize
      ? shuffle(levelIds).slice(0, targetSize)
      : shuffle(levelIds)

  for (const levelId of levelsToSample) {
    const sentences = byLevel.get(levelId) ?? []
    const available = sentences.filter((sentence) => !usedIds.has(sentence.id))
    const sentence = shuffle(available)[0]
    if (!sentence) continue
    picked.push(sentence.id)
    usedIds.add(sentence.id)
  }

  const remaining = shuffle(playables.filter((sentence) => !usedIds.has(sentence.id)))
  for (const sentence of remaining) {
    if (picked.length >= targetSize) break
    picked.push(sentence.id)
    usedIds.add(sentence.id)
  }

  return shuffle(picked)
}
