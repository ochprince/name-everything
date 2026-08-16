import type { Card } from '../types/card'
import type { ProgressState } from './storage'

function primaryTag(card: Card): string {
  return card.tags[0] ?? ''
}

export function pickNextCard(
  cards: Card[],
  progress: ProgressState,
  recentTag: string | null,
  rng: () => number = Math.random,
): { card: Card; recentTag: string } | null {
  if (cards.length === 0) return null

  const strong = new Set(progress.strongIds)
  const warmSet = new Set(progress.warmIds)
  const available = cards.filter((card) => !strong.has(card.id))
  if (available.length === 0) return null

  const cold = available.filter((card) => !warmSet.has(card.id))
  const warm = available.filter((card) => warmSet.has(card.id))
  const coldWeight = cold.length ? 5 : 0
  const warmWeight = warm.length ? 2 : 0
  const total = coldWeight + warmWeight
  let pool = rng() * total < coldWeight ? cold : warm
  if (pool.length === 0) pool = available

  if (progress.currentCardId && pool.length > 1) {
    const withoutCurrent = pool.filter(
      (card) => card.id !== progress.currentCardId,
    )
    if (withoutCurrent.length) pool = withoutCurrent
  }

  const rotated = recentTag
    ? pool.filter((card) => primaryTag(card) !== recentTag)
    : pool
  const finalPool = rotated.length ? rotated : pool
  const card = finalPool[Math.floor(rng() * finalPool.length)]
  return { card, recentTag: primaryTag(card) }
}
