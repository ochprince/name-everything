import { gameTuning } from '../content/tuning'
import type { Level } from '../content/pack'
import { chaptersInOrder, levelsForChapter } from '../content/pack'
import type { GrammarProgress } from './storage'
import { levelThreshold } from './storage'

function isPreviousChapterComplete(level: Level, progress: GrammarProgress): boolean {
  const chapters = chaptersInOrder()
  const chapterIndex = chapters.findIndex((chapter) => chapter.id === level.chapter_id)
  if (chapterIndex <= 0) return true
  const prevLevels = levelsForChapter(chapters[chapterIndex - 1]!.id)
  return prevLevels.every((prev) => progress.passedLevelIds.includes(prev.id))
}

function hasPreviousChapter(level: Level): boolean {
  const chapters = chaptersInOrder()
  const chapterIndex = chapters.findIndex((chapter) => chapter.id === level.chapter_id)
  return chapterIndex > 0
}

export function levelUnlockHint(level: Level, progress: GrammarProgress): string {
  if (isLevelUnlocked(level, progress)) return ''
  const siblings = levelsForChapter(level.chapter_id)
  const index = siblings.findIndex((item) => item.id === level.id)
  if (index === 0 && hasPreviousChapter(level)) return '先完成上一章'
  return '先过上一关'
}

export function isLevelUnlocked(
  level: Level,
  progress: GrammarProgress,
): boolean {
  const siblings = levelsForChapter(level.chapter_id)
  const index = siblings.findIndex((item) => item.id === level.id)
  if (index < 0) return false
  if (index === 0) {
    return isPreviousChapterComplete(level, progress)
  }
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
