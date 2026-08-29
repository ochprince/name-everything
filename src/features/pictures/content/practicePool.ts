import type { Card } from '../../../types/card'
import type { ProgressState } from '../lib/storage'

export const BATCH_SIZE = 10

export function buildPracticePool(
  batchCards: Card[],
  extraWarmCards: Card[],
  progress: ProgressState,
): Card[] {
  const strong = new Set(progress.strongIds)
  const forgot = new Set(progress.forgotIds)
  const byId = new Map<string, Card>()
  for (const card of [...batchCards, ...extraWarmCards]) {
    byId.set(card.id, card)
  }
  return [...byId.values()].filter(
    (card) => !strong.has(card.id) && !forgot.has(card.id),
  )
}

export function batchFullyStrong(
  batchCards: Card[],
  progress: ProgressState,
): boolean {
  if (batchCards.length === 0) return false
  const strong = new Set(progress.strongIds)
  return batchCards.every((card) => strong.has(card.id))
}

export function needsReviewPrompt(
  batchCards: Card[],
  practicePool: Card[],
  progress: ProgressState,
): boolean {
  if (practicePool.length > 0) return false
  if (batchFullyStrong(batchCards, progress)) return false
  return batchCards.length > 0
}
