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

  it('persists to localStorage', () => {
    let s = loadProgress()
    s = togglePin(s, 'bag')
    saveProgress(s)
    const again = loadProgress()
    expect(again.pinnedIds).toContain('bag')
  })
})
