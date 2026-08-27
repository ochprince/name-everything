import { gameTuning } from '../content/tuning'
import type { Sentence, SentenceSlot } from '../content/pack'

export type FallingMode = 'level' | 'arcade'

export type AnswerMode = 'mcq' | 'produce'

/**
 * 每格最多允许选错一次：第 2 次选错立即失败（防连点试答案刷分，
 * 同时作为统一难度规则）。错第 1 次仍按旧行为加速下落。
 */
export const MAX_WRONG_PER_SENTENCE = 2

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
  /** 当前格已选错次数（最多允许选错一次，错第二次立即失败） */
  wrongCount: number
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
    const safeFactor = Number.isFinite(factor) ? factor : 2
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

/** 关卡游戏队列：只含练习句（anchor 标杆句不进游戏环节，仅作学习页/轮播参考）。 */
export function buildQueue(playables: Sentence[]): string[] {
  return shuffle(playables.map((sentence) => sentence.id))
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
    wrongCount: 0,
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
  // 本格选错计数 +1；是否达到上限立即失败由页面判定（需联动出结果页）
  return { ...state, fallSpeed, lastWrong: true, wrongCount: state.wrongCount + 1 }
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
    wrongCount: 0,
    answerMode,
  }
}

export function advanceSlot(state: FallingState, slotCount: number): FallingState {
  const nextIndex = state.slotIndex + 1
  if (nextIndex >= slotCount) return markCleared(state)
  // 进入新格：重置本格选错计数（每格最多允许选错一次）
  return { ...state, slotIndex: nextIndex, lastWrong: false, wrongCount: 0 }
}

export function slotOptions(slot: SentenceSlot): string[] {
  return shuffle([slot.correct, ...slot.distractors])
}
