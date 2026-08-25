import { describe, expect, it } from 'vitest'
import {
  applyWrong,
  beginSentence,
  land,
  startRound,
  tick,
  applyCorrectBounce,
  isQueueFullyCleared,
  nextSentenceId,
  buildQueue,
  fallDurationForAnswerMode,
  pickAnswerMode,
} from './engine'
import { buildArcadeQueue } from './arcadeChallenge'
import { gameTuning } from '../content/tuning'
import { anchorForLevel, playablesForLevel, grammarPack } from '../content/pack'

describe('falling engine', () => {
  it('speeds up on wrong pick without jumping remaining time upward', () => {
    const state = startRound('s1', 3, 8000)
    const next = applyWrong(state)
    expect(next.remainingMs).toBe(8000)
    expect(next.fallSpeed).toBeCloseTo(1 / gameTuning.wrong_speed_factor, 5)

    const nearBottom = { ...startRound('s1', 3, 8000), remainingMs: 500 }
    const wrongNearBottom = applyWrong(nearBottom)
    expect(wrongNearBottom.remainingMs).toBe(500)
    expect(wrongNearBottom.fallSpeed).toBeGreaterThan(1)
  })

  it('caps wrong-pick acceleration at min fall duration', () => {
    let current = startRound('s1', 3, 8000)
    for (let i = 0; i < 10; i += 1) current = applyWrong(current)
    expect(current.fallSpeed).toBeCloseTo(8000 / gameTuning.min_fall_duration_ms, 5)
  })

  it('tick applies fallSpeed smoothly each frame', () => {
    const state = { ...startRound('s1', 3, 8000), fallSpeed: 2 }
    const next = tick(state, 100)
    expect(next.remainingMs).toBe(7800)
  })

  it('landing spends a life and ending the last life closes the round', () => {
    const oneLife = startRound('s1', 1, 1000)
    const over = land(oneLife)
    expect(over.status).toBe('over')
    expect(over.lives).toBe(0)
    const two = land(startRound('s1', 2, 1000))
    expect(two.status).toBe('playing')
    expect(two.lives).toBe(1)
  })

  it('tick clamps remaining time at zero without spending lives', () => {
    const next = tick(startRound('s1', 2, 400), 400)
    expect(next.remainingMs).toBe(0)
    expect(next.lives).toBe(2)
  })

  it('applyCorrectBounce restores fall time without exceeding the cap', () => {
    const state = { ...startRound('s1', 3, 8000), remainingMs: 2000 }
    const bounced = applyCorrectBounce(state)
    expect(bounced.remainingMs).toBe(2000 + Math.round(8000 * gameTuning.correct_bounce_factor))
    const nearTop = { ...state, remainingMs: 7500 }
    expect(applyCorrectBounce(nearTop).remainingMs).toBe(8000)
  })

  it('nextSentenceId walks the queue in order when clearedIds is omitted', () => {
    const queue = ['a', 'b', 'c']
    expect(nextSentenceId(queue, null, [])).toBe('a')
    expect(nextSentenceId(queue, 'a', ['a'])).toBe('b')
    expect(nextSentenceId(queue, 'b', ['a', 'b'])).toBe('c')
    // 全部出过：回绕到队列头（跳过当前句）
    expect(nextSentenceId(queue, 'c', ['a', 'b', 'c'])).toBe('a')
  })

  it('nextSentenceId walks in order skipping cleared sentences', () => {
    const queue = ['a', 'b', 'c', 'd']
    const cleared = new Set(['b'])
    expect(nextSentenceId(queue, 'a', ['a'], cleared)).toBe('c')
    expect(nextSentenceId(queue, 'c', ['a', 'c'], cleared)).toBe('d')
  })

  it('nextSentenceId replays uncleared sentences before ending', () => {
    const queue = ['a', 'b', 'c']
    const cleared = new Set(['a', 'c'])
    expect(nextSentenceId(queue, 'c', ['a', 'b', 'c'], cleared)).toBe('b')
    expect(nextSentenceId(queue, 'b', ['a', 'b', 'c'], new Set(['a', 'b', 'c']))).toBeNull()
  })

  it('isQueueFullyCleared tracks successful clears across the queue', () => {
    const queue = ['a', 'b', 'c']
    expect(isQueueFullyCleared(queue, new Set(['a']))).toBe(false)
    expect(isQueueFullyCleared(queue, new Set(['a', 'b', 'c']))).toBe(true)
  })

  it('level queue starts with anchor then shuffled playables', () => {
    const levelId = 'dative-1'
    const anchor = anchorForLevel(levelId)!
    const playables = playablesForLevel(levelId)
    const queue = buildQueue('level', anchor, playables)
    expect(queue[0]).toBe(anchor.id)
    expect(queue.slice(1).sort()).toEqual(playables.map((p) => p.id).sort())
  })

  it('arcade queue uses stratified playable sentences without anchors', () => {
    const passedIds = new Set(['dative-1'])
    const pool = grammarPack.sentences.filter(
      (s) => s.kind === 'playable' && passedIds.has(s.level_id),
    )
    const queue = buildArcadeQueue(pool)
    expect(queue.every((id) => pool.some((p) => p.id === id))).toBe(true)
    expect(new Set(queue).size).toBe(queue.length)
    expect(
      queue.some(
        (id) => grammarPack.sentences.find((s) => s.id === id)?.kind === 'anchor',
      ),
    ).toBe(false)
  })

  it('pickAnswerMode uses ratio against random()', () => {
    expect(pickAnswerMode(0.5, () => 0.49)).toBe('produce')
    expect(pickAnswerMode(0.5, () => 0.5)).toBe('mcq')
    expect(pickAnswerMode(0, () => 0)).toBe('mcq')
    expect(pickAnswerMode(1, () => 0.99)).toBe('produce')
  })

  it('fallDurationForAnswerMode stretches produce rounds', () => {
    expect(fallDurationForAnswerMode(8000, 'mcq')).toBe(8000)
    expect(fallDurationForAnswerMode(8000, 'produce')).toBe(
      Math.round(8000 * gameTuning.produce_fall_duration_factor),
    )
  })

  it('startRound defaults to mcq and preserves base duration', () => {
    const state = startRound('s1', 3, 8000)
    expect(state.answerMode).toBe('mcq')
    expect(state.fallDurationMs).toBe(8000)
    expect(state.remainingMs).toBe(8000)
  })

  it('startRound and beginSentence apply produce duration factor', () => {
    const started = startRound('s1', 3, 8000, 'produce')
    expect(started.answerMode).toBe('produce')
    expect(started.fallDurationMs).toBe(
      Math.round(8000 * gameTuning.produce_fall_duration_factor),
    )
    expect(started.remainingMs).toBe(started.fallDurationMs)

    const next = beginSentence(started, 's2', 8000, 'produce')
    expect(next.sentenceId).toBe('s2')
    expect(next.answerMode).toBe('produce')
    expect(next.slotIndex).toBe(0)
    expect(next.fallSpeed).toBe(1)
    expect(next.fallDurationMs).toBe(
      Math.round(8000 * gameTuning.produce_fall_duration_factor),
    )
  })
})
