import { useSyncExternalStore } from 'react'
import { arcadeEarnedTrophy } from '../../grammar/lib/arcadeChallenge'
import type { ArcadeRecord } from '../../grammar/lib/storage'

const KEY = 'name-everything/my-challenge/v1'

export type MyChallengeProgress = {
  history: ArcadeRecord[]
  trophyCount: number
}

const listeners = new Set<() => void>()
let rawCache: string | null = null
let cache: MyChallengeProgress = { history: [], trophyCount: 0 }

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `mc-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function emit() {
  listeners.forEach((listener) => listener())
}

function parse(raw: string | null): MyChallengeProgress {
  if (!raw) return { history: [], trophyCount: 0 }
  try {
    const value = JSON.parse(raw) as Partial<MyChallengeProgress>
    return {
      history: Array.isArray(value.history) ? value.history : [],
      trophyCount: typeof value.trophyCount === 'number' ? value.trophyCount : 0,
    }
  } catch {
    return { history: [], trophyCount: 0 }
  }
}

export function loadMyChallengeProgress(): MyChallengeProgress {
  const raw = localStorage.getItem(KEY)
  if (raw === rawCache) return cache
  rawCache = raw
  cache = parse(raw)
  return cache
}

function save(next: MyChallengeProgress) {
  localStorage.setItem(KEY, JSON.stringify(next))
  rawCache = JSON.stringify(next)
  cache = next
  emit()
}

export function recordMyChallengeRun(
  score: number,
  total: number,
  cleared: boolean,
  poolSize: number,
) {
  const current = loadMyChallengeProgress()
  const entry: ArcadeRecord = {
    id: newId(),
    at: new Date().toISOString(),
    score,
    total,
    cleared,
  }
  const earnedTrophy = arcadeEarnedTrophy(cleared, total, poolSize)
  save({
    history: [entry, ...current.history].slice(0, 20),
    trophyCount: current.trophyCount + (earnedTrophy ? 1 : 0),
  })
}

export function useMyChallengeProgress(): MyChallengeProgress {
  return useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange)
      return () => {
        listeners.delete(onStoreChange)
      }
    },
    loadMyChallengeProgress,
    () => ({ history: [], trophyCount: 0 }),
  )
}
