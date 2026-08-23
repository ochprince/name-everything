import { passedLevelCount, type GrammarProgress } from '../features/grammar/lib/storage'
import {
  levelById,
  pointById,
} from '../features/grammar/content/pack'

export type PracticeTile = {
  id: string
  title: string
  detail: string
  badge?: string
  to: string | null
  available: boolean
  unavailableHint?: string
}

function recentLevelTitle(progress: GrammarProgress): string | undefined {
  const levelId = progress.lastPlayedLevelId
  if (!levelId) return undefined
  const level = levelById(levelId)
  const point = level ? pointById(level.grammar_point_id) : undefined
  return point?.title_zh
}

export function practiceTiles(progress: GrammarProgress): PracticeTile[] {
  const arcadeOpen = passedLevelCount(progress) > 0
  const recentLevel = recentLevelTitle(progress)

  return [
    {
      id: 'vocab',
      title: '词汇记忆',
      detail: '看图记词，限时回忆。',
      to: '/practice/pictures',
      available: true,
    },
    {
      id: 'grammar-learn',
      title: '语法学习',
      detail: '从例句开始学语法',
      badge: recentLevel,
      to: '/practice/grammar/learn',
      available: true,
    },
    {
      id: 'grammar-play',
      title: '语法挑战',
      detail: arcadeOpen ? '30 句限时挑战，通关赢取奖杯。' : '先去语法学习过一关。',
      to: arcadeOpen ? '/practice/grammar/play' : null,
      available: arcadeOpen,
      unavailableHint: '先去语法学习过一关',
    },
  ]
}
