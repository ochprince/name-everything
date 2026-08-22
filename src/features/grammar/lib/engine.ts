import { gameTuning } from '../content/tuning'
import type { Sentence, SentenceSlot } from '../content/pack'

export type FallingMode = 'level' | 'arcade'

export type FallingState = {
  lives: number
  score: number
  sentenceId: string | null
  slotIndex: number
  remainingMs: number
  fallDurationMs: number
  fallSpeed: number
  status: 'playing' | 'over'
  lastWrong: boolean
}

function maxFallSpeed(fallDurationMs: number): number {
  return fallDurationMs / gameTuning.min_fall_duration_ms
}

export function shuffle<T>(items: T[]): T[] {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const left = next[i]
    const right = next[j]
    if (left === undefined || right === undefined) continue
    next[i] = right
    next[j] = left
  }
  return next
}

export function buildQueue(
  mode: FallingMode,
  anchor: Sentence | undefined,
  playables: Sentence[],
): string[] {
  const playableIds = playables.map((sentence) => sentence.id)
  if (mode === 'arcade') return shuffle(playableIds)
  if (!anchor) return shuffle(playableIds)
  return [anchor.id, ...shuffle(playableIds)]
}

export function nextSentenceId(
  queue: string[],
  currentId: string | null,
  used: string[],
  clearedIds?: ReadonlySet<string>,
): string | null {
  if (queue.length === 0) return null

  const targetPool =
    clearedIds !== undefined
      ? queue.filter((id) => !clearedIds.has(id))
      : queue
  if (targetPool.length === 0) return null

  const remaining = targetPool.filter((id) => !used.includes(id))
  const pool = remaining.length > 0 ? remaining : targetPool
  const candidates =
    pool.length > 1 && currentId ? pool.filter((id) => id !== currentId) : pool
  const pick = candidates[Math.floor(Math.random() * candidates.length)]
  return pick ?? pool[0] ?? null
}

export function isQueueFullyCleared(
  queue: string[],
  clearedIds: ReadonlySet<string>,
): boolean {
  return queue.length > 0 && queue.every((id) => clearedIds.has(id))
}

export function startRound(
  firstId: string,
  lives: number = gameTuning.lives,
  fallDurationMs: number = gameTuning.fall_duration_ms,
): FallingState {
  return {
    lives,
    score: 0,
    sentenceId: firstId,
    slotIndex: 0,
    remainingMs: fallDurationMs,
    fallDurationMs,
    fallSpeed: 1,
    status: 'playing',
    lastWrong: false,
  }
}

export function tick(state: FallingState, dtMs: number): FallingState {
  if (state.status !== 'playing') return state
  if (state.remainingMs <= 0) return state
  const remainingMs = Math.max(0, state.remainingMs - dtMs * state.fallSpeed)
  return { ...state, remainingMs, lastWrong: false }
}

export function land(state: FallingState): FallingState {
  const lives = state.lives - 1
  if (lives <= 0) {
    return {
      ...state,
      lives: 0,
      remainingMs: 0,
      status: 'over',
      lastWrong: false,
    }
  }
  return {
    ...state,
    lives,
    remainingMs: 0,
    lastWrong: false,
  }
}

export function markCleared(state: FallingState): FallingState {
  return {
    ...state,
    score: state.score + 1,
    remainingMs: 0,
    lastWrong: false,
  }
}

export function applyWrong(state: FallingState): FallingState {
  const fallSpeed = Math.min(
    state.fallSpeed / gameTuning.wrong_speed_factor,
    maxFallSpeed(state.fallDurationMs),
  )
  return { ...state, fallSpeed, lastWrong: true }
}

export function applyCorrectBounce(state: FallingState): FallingState {
  const bonus = Math.round(state.fallDurationMs * gameTuning.correct_bounce_factor)
  return {
    ...state,
    remainingMs: Math.min(state.fallDurationMs, state.remainingMs + bonus),
    fallSpeed: 1,
    lastWrong: false,
  }
}

export function beginSentence(
  state: FallingState,
  sentenceId: string,
  fallDurationMs = state.fallDurationMs,
): FallingState {
  return {
    ...state,
    sentenceId,
    slotIndex: 0,
    remainingMs: fallDurationMs,
    fallDurationMs,
    fallSpeed: 1,
    lastWrong: false,
  }
}

export function advanceSlot(state: FallingState, slotCount: number): FallingState {
  const nextIndex = state.slotIndex + 1
  if (nextIndex >= slotCount) return markCleared(state)
  return { ...state, slotIndex: nextIndex, lastWrong: false }
}

export function slotOptions(slot: SentenceSlot): string[] {
  return shuffle([slot.correct, ...slot.distractors])
}
