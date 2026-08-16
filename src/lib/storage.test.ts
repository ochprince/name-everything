import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadProgress,
  saveProgress,
  markGotIt,
  markForgot,
  setPracticeCursor,
  todayKey,
} from './storage'

beforeEach(() => {
  localStorage.clear()
})

describe('progress storage', () => {
  it('markForgot adds id and markGotIt removes it from forgot', () => {
    let s = loadProgress()
    s = markForgot(s, 'cup')
    expect(s.forgotIds).toContain('cup')
    s = markGotIt(s, 'cup', todayKey())
    expect(s.forgotIds).not.toContain('cup')
    expect(s.gotItToday[todayKey()]).toContain('cup')
  })

  it('markForgot keeps newest ids first', () => {
    let s = loadProgress()
    s = markForgot(s, 'cup')
    s = markForgot(s, 'door')
    expect(s.forgotIds).toEqual(['door', 'cup'])
  })

  it('markForgot moves an existing id back to the front', () => {
    let s = loadProgress()
    s = markForgot(s, 'cup')
    s = markForgot(s, 'door')
    s = markForgot(s, 'bag')
    s = markForgot(s, 'door')
    expect(s.forgotIds).toEqual(['door', 'bag', 'cup'])
  })

  it('setPracticeCursor stores the active card and recent tag', () => {
    let s = loadProgress()
    s = setPracticeCursor(s, 'cup', 'home')
    expect(s.currentCardId).toBe('cup')
    expect(s.recentPracticeTag).toBe('home')
    s = setPracticeCursor(s, null, null)
    expect(s.currentCardId).toBeNull()
    expect(s.recentPracticeTag).toBeNull()
  })

  it('defaults and persists currentCardId', () => {
    expect(loadProgress().currentCardId).toBeNull()
    let s = loadProgress()
    s = setPracticeCursor(s, 'bag', 'travel')
    saveProgress(s)
    const again = loadProgress()
    expect(again.currentCardId).toBe('bag')
    expect(again.recentPracticeTag).toBe('travel')
  })

  it('migrates expandZh true to hintLang zh', () => {
    localStorage.setItem(
      'name-everything/progress/v1',
      JSON.stringify({
        forgotIds: [],
        pinnedIds: [],
        gotItToday: {},
        streaks: { lastActiveDate: null, count: 0 },
        settings: { expandWord: false, expandZh: true },
      }),
    )
    expect(loadProgress().settings).toEqual({
      hintLang: 'zh',
      autoSpeak: false,
      forgetHoldMs: 5000,
    })
  })
})
