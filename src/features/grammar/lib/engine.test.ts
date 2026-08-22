import { describe, expect, it } from 'vitest'
import { applyWrong, land, startRound, tick, applyCorrectBounce, isQueueFullyCleared, nextSentenceId } from './engine'
import { gameTuning } from '../content/tuning'

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
    expect(nextSentenceId(queue, null, [])).toBeTruthy()
    expect(nextSentenceId(queue, 'a', ['a'])).toBeTruthy()
    expect(nextSentenceId(queue, 'b', ['a', 'b'])).toBe('c')
    expect(nextSentenceId(queue, 'c', ['a', 'b', 'c'])).toBeTruthy()
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
})
