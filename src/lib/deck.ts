import type { Card } from '../types/card'
import { todayKey, type ProgressState } from './storage'

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
  const today = todayKey()
  const got = new Set(progress.gotItToday[today] ?? [])
  const forgotSet = new Set(progress.forgotIds)

  const byId = new Map(cards.map((c) => [c.id, c]))
  const forgotCards = progress.forgotIds
    .map((id) => byId.get(id))
    .filter((c): c is Card => Boolean(c))

  const fresh = cards.filter((c) => !got.has(c.id) && !forgotSet.has(c.id))
  const gotCards = cards.filter((c) => got.has(c.id))

  let pool: Card[] = []
  if (forgotCards.length && rng() < 0.3) {
    pool = forgotCards
  } else if (fresh.length) {
    pool = fresh
  } else if (forgotCards.length) {
    pool = forgotCards
  } else {
    pool = gotCards.length ? gotCards : cards
  }

  const rotated = recentTag
    ? pool.filter((c) => primaryTag(c) !== recentTag)
    : pool
  const finalPool = rotated.length ? rotated : pool
  const card = finalPool[Math.floor(rng() * finalPool.length)]
  return { card, recentTag: primaryTag(card) }
}
