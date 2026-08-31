import { gameTuning } from '../content/tuning'
import type { Level } from '../content/pack'
import { chaptersInOrder, levelById, levelsForChapter, playablesForLevel } from '../content/pack'
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
  // 已通关的关卡永远不再上锁：即使上一章末尾新增了 level（本章
  // "全通"门槛因此失效），已通过的下一章首关也必须保持解锁。
  if (progress.passedLevelIds.includes(level.id)) return true
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

/** 游戏可玩句数 = 练习句数（anchor 标杆句不进游戏环节，门槛/进度只数练习句）。 */
export function playableCountForLevel(levelId: string): number {
  return playablesForLevel(levelId).length
}

function passedSentenceBaseline(levelId: string, progress: GrammarProgress): number {
  return progress.passedSentenceCounts[levelId] ?? playableCountForLevel(levelId)
}

/** True when a passed level is no longer fully cleared on current content. */
export function hasLevelContentUpdate(
  levelId: string,
  progress: GrammarProgress,
): boolean {
  if (!isLevelPassed(levelId, progress)) return false
  const total = playableCountForLevel(levelId)
  const score = highScoreFor(levelId, progress)
  if (score < total) return true
  // 句子被替换（数量不变但内容变了）：用通关时的句子 id 快照识别。
  // 无快照的老数据回退到数量基线判断（只有「句子变多」一种情况）。
  const passedIds = progress.passedSentenceIds?.[levelId]
  if (passedIds) {
    const currentIds = playablesForLevel(levelId).map((sentence) => sentence.id)
    return !(
      currentIds.length === passedIds.length &&
      currentIds.every((id, index) => id === passedIds[index])
    )
  }
  return total > passedSentenceBaseline(levelId, progress)
}

export function levelListScoreLabel(level: Level, progress: GrammarProgress): string {
  const score = highScoreFor(level.id, progress)
  const total = playableCountForLevel(level.id)

  // 有更新优先：内容变动（新增/替换）后即使分数仍达到总数（如替换后
  // 重刷满分），也要显示「有更新」而非直接「已过关」。
  if (hasLevelContentUpdate(level.id, progress)) {
    return `最高 ${score}/${total} · 有更新`
  }
  if (score >= total && total > 0) {
    return `最高 ${score} · 已过关`
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
  const total = playableCountForLevel(levelId)
  return total > 0 && highScoreFor(levelId, progress) >= total
}

/** Single in-progress cue for list rows (day + rose「进行中」). */
export function isLevelInProgress(
  level: Level,
  progress: GrammarProgress,
): boolean {
  if (!isLevelUnlocked(level, progress) || isLevelClearedOnContent(level.id, progress)) {
    return false
  }
  if (progress.lastPlayedLevelId === level.id) return true
  if (progress.lastPlayedLevelId) {
    const last = levelById(progress.lastPlayedLevelId)
    if (
      last &&
      isLevelUnlocked(last, progress) &&
      !isLevelClearedOnContent(last.id, progress)
    ) {
      return false
    }
  }
  for (const chapter of chaptersInOrder()) {
    for (const candidate of levelsForChapter(chapter.id)) {
      if (
        isLevelUnlocked(candidate, progress) &&
        !isLevelClearedOnContent(candidate.id, progress)
      ) {
        return candidate.id === level.id
      }
    }
  }
  return false
}

export function livesFor(level: Level): number {
  return level.lives ?? gameTuning.lives
}

export function fallDurationFor(level: Level): number {
  return level.fall_duration_ms ?? gameTuning.fall_duration_ms
}

/** 过关门槛 = 关卡练习句数（anchor 不进游戏环节）。 */
export function thresholdFor(level: Level): number {
  return playableCountForLevel(level.id)
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
