import { passedLevelCount, type GrammarProgress } from '../features/grammar/lib/storage'
import {
  levelById,
  pointById,
} from '../features/grammar/content/pack'
import { challengeWordCount } from '../features/pictures/lib/challengeCollection'

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
  const grammarArcadeOpen = passedLevelCount(progress) > 0
  const mineOpen = challengeWordCount() > 0
  const challengeOpen = grammarArcadeOpen || mineOpen
  const recentLevel = recentLevelTitle(progress)

  let challengeDetail = '先去语法学习过一关，或收藏词汇例句。'
  if (grammarArcadeOpen && mineOpen) challengeDetail = '语法综合局，或我的例句挑战。'
  else if (grammarArcadeOpen) challengeDetail = '限时挑战，赢取奖杯'
  else if (mineOpen) challengeDetail = '用收藏的例句开局挑战'

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
      title: '挑战模式',
      detail: challengeDetail,
      to: challengeOpen ? '/practice/challenge' : null,
      available: challengeOpen,
      unavailableHint: '先去语法学习过一关，或在词汇记忆加入例句',
    },
  ]
}
