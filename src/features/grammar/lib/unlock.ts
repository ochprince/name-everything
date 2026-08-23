import { gameTuning } from '../content/tuning'
import type { Level } from '../content/pack'
import { chaptersInOrder, levelById, levelsForChapter, sentencesForLevel } from '../content/pack'
import type { GrammarProgress } from './storage'

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

export function sentenceCountForLevel(levelId: string): number {
  return sentencesForLevel(levelId).length
}

function passedSentenceBaseline(levelId: string, progress: GrammarProgress): number {
  return progress.passedSentenceCounts[levelId] ?? sentenceCountForLevel(levelId)
}

/** True when a passed level is no longer fully cleared on current content. */
export function hasLevelContentUpdate(
  levelId: string,
  progress: GrammarProgress,
): boolean {
  if (!isLevelPassed(levelId, progress)) return false
  const total = sentenceCountForLevel(levelId)
  const score = highScoreFor(levelId, progress)
  if (score < total) return true
  return total > passedSentenceBaseline(levelId, progress)
}

export function levelListScoreLabel(level: Level, progress: GrammarProgress): string {
  const score = highScoreFor(level.id, progress)
  const total = sentenceCountForLevel(level.id)

  if (score >= total && total > 0) {
    return `最高 ${score} · 已过关`
  }
  if (hasLevelContentUpdate(level.id, progress)) {
    return `最高 ${score}/${total} · 有更新`
  }
  return `最高 ${score}/${total}`
}

/** List subtitle tone: only the「有更新」suffix is highlighted. */
export function levelListScoreTone(
  level: Level,
  progress: GrammarProgress,
): 'default' | 'update' {
  return hasLevelContentUpdate(level.id, progress) ? 'update' : 'default'
}

/** Fully cleared on current sentence count (trophy / 已过关). */
export function isLevelClearedOnContent(
  levelId: string,
  progress: GrammarProgress,
): boolean {
  const total = sentenceCountForLevel(levelId)
  return total > 0 && highScoreFor(levelId, progress) >= total
}

export function livesFor(level: Level): number {
  return level.lives ?? gameTuning.lives
}

export function fallDurationFor(level: Level): number {
  return level.fall_duration_ms ?? gameTuning.fall_duration_ms
}

/** Pass bar = number of sentences in the level (anchor + playables). */
export function thresholdFor(level: Level): number {
  return sentenceCountForLevel(level.id)
}

/** Next level in chapter order; crosses into the next released chapter when needed. */
export function nextLevelAfter(levelId: string): Level | null {
  const level = levelById(levelId)
  if (!level) return null

  const siblings = levelsForChapter(level.chapter_id)
  const index = siblings.findIndex((item) => item.id === levelId)
  if (index >= 0 && index < siblings.length - 1) {
    return siblings[index + 1] ?? null
  }

  const releasedChapters = chaptersInOrder().filter((chapter) => chapter.released)
  const chapterIndex = releasedChapters.findIndex(
    (chapter) => chapter.id === level.chapter_id,
  )
  const nextChapter = releasedChapters[chapterIndex + 1]
  if (!nextChapter) return null

  return levelsForChapter(nextChapter.id)[0] ?? null
}
