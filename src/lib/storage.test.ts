import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadProgress,
  saveProgress,
  markGotIt,
  markForgot,
  togglePin,
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

  it('togglePin pins and unpins without touching forgot', () => {
    let s = loadProgress()
    s = markForgot(s, 'door')
    s = togglePin(s, 'door')
    expect(s.pinnedIds).toContain('door')
    expect(s.forgotIds).toContain('door')
    s = togglePin(s, 'door')
    expect(s.pinnedIds).not.toContain('door')
    expect(s.forgotIds).toContain('door')
  })

  it('togglePin keeps newest ids first', () => {
    let s = loadProgress()
    s = togglePin(s, 'cup')
    s = togglePin(s, 'door')
    expect(s.pinnedIds).toEqual(['door', 'cup'])
  })

  it('togglePin puts a re-pinned id at the front', () => {
    let s = loadProgress()
    s = togglePin(s, 'cup')
    s = togglePin(s, 'door')
    s = togglePin(s, 'cup')
    s = togglePin(s, 'cup')
    expect(s.pinnedIds).toEqual(['cup', 'door'])
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

  it('persists to localStorage', () => {
    let s = loadProgress()
    s = togglePin(s, 'bag')
    saveProgress(s)
    const again = loadProgress()
    expect(again.pinnedIds).toContain('bag')
  })
})
