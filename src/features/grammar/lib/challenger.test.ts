import { describe, expect, it } from 'vitest'
import {
  loadBestChallengerStreak,
  updateBestChallengerStreak,
} from './challenger'

describe('challenger streak record', () => {
  it('reads zero when empty and updates on higher defeated', () => {
    localStorage.clear()
    expect(loadBestChallengerStreak()).toBe(0)
    expect(updateBestChallengerStreak(3)).toBe(true)
    expect(loadBestChallengerStreak()).toBe(3)
    expect(updateBestChallengerStreak(2)).toBe(false)
    expect(loadBestChallengerStreak()).toBe(3)
    expect(updateBestChallengerStreak(3)).toBe(false)
    localStorage.clear()
  })

  it('survives corrupted storage', () => {
    localStorage.clear()
    localStorage.setItem('name-everything/challenger/bestStreak', 'abc')
    expect(loadBestChallengerStreak()).toBe(0)
    localStorage.clear()
  })
})
