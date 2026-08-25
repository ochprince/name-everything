import { gameTuning } from '../content/tuning'
import type { Sentence, SentenceSlot } from '../content/pack'

export type FallingMode = 'level' | 'arcade'

export type AnswerMode = 'mcq' | 'produce'

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
  answerMode: AnswerMode
}

export function pickAnswerMode(
  ratio: number = gameTuning.produce_answer_ratio,
  random: () => number = Math.random,
): AnswerMode {
  const safeRatio = Number.isFinite(ratio) ? ratio : 0.5
  return random() < safeRatio ? 'produce' : 'mcq'
}

export function fallDurationForAnswerMode(
  baseMs: number,
  mode: AnswerMode,
): number {
  if (mode === 'produce') {
    const factor = gameTuning.produce_fall_duration_factor
    const safeFactor = Number.isFinite(factor) ? factor : 1.5
    return Math.round(baseMs * safeFactor)
  }
  return baseMs
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
  // 按队列顺序取下一个（保持 buildArcadeQueue 的难度阶梯），
  // 而非随机抽样——否则简单句会出现在任意分组。
  return candidates[0] ?? null
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
  baseFallDurationMs: number = gameTuning.fall_duration_ms,
  answerMode: AnswerMode = 'mcq',
): FallingState {
  const fallDurationMs = fallDurationForAnswerMode(baseFallDurationMs, answerMode)
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
    answerMode,
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
  baseFallDurationMs = state.fallDurationMs,
  answerMode: AnswerMode = 'mcq',
): FallingState {
  const fallDurationMs = fallDurationForAnswerMode(baseFallDurationMs, answerMode)
  return {
    ...state,
    sentenceId,
    slotIndex: 0,
    remainingMs: fallDurationMs,
    fallDurationMs,
    fallSpeed: 1,
    lastWrong: false,
    answerMode,
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
