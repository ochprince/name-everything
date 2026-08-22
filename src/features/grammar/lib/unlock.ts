import { gameTuning } from '../content/tuning'
import type { Level } from '../content/pack'
import { levelsForChapter } from '../content/pack'
import type { GrammarProgress } from './storage'
import { levelThreshold } from './storage'

export function isLevelUnlocked(
  level: Level,
  progress: GrammarProgress,
): boolean {
  const siblings = levelsForChapter(level.chapter_id)
  const index = siblings.findIndex((item) => item.id === level.id)
  if (index <= 0) return true
  const previous = siblings[index - 1]
  return previous ? progress.passedLevelIds.includes(previous.id) : false
}

export function highScoreFor(levelId: string, progress: GrammarProgress): number {
  return progress.highScores[levelId] ?? 0
}

export function isLevelPassed(levelId: string, progress: GrammarProgress): boolean {
  return progress.passedLevelIds.includes(levelId)
}

export function livesFor(level: Level): number {
  return level.lives ?? gameTuning.lives
}

export function fallDurationFor(level: Level): number {
  return level.fall_duration_ms ?? gameTuning.fall_duration_ms
}

export function thresholdFor(level: Level): number {
  return levelThreshold(level.pass_threshold)
}
