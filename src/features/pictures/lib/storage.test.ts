import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadProgress,
  saveProgress,
  markGotIt,
  markForgot,
  markReviewGotIt,
  setPracticeCursor,
  todayKey,
  currentSetView,
  ackDailyContinue,
  clearReviewUnseen,
  defaultProgress,
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
      thinkHoldMs: 5000,
      uiSound: true,
      produceRatio: 50,
    })
  })

  it('migrates forgetHoldMs 0 to thinkHoldMs 5000, keeps 3s and 15s', () => {
    localStorage.setItem(
      'name-everything/progress/v1',
      JSON.stringify({
        ...defaultProgress(),
        settings: { hintLang: 'en', autoSpeak: false, forgetHoldMs: 0 },
      }),
    )
    expect(loadProgress().settings.thinkHoldMs).toBe(5000)

    localStorage.setItem(
      'name-everything/progress/v1',
      JSON.stringify({
        ...defaultProgress(),
        settings: { hintLang: 'en', autoSpeak: false, forgetHoldMs: 15000 },
      }),
    )
    expect(loadProgress().settings.thinkHoldMs).toBe(15000)

    localStorage.setItem(
      'name-everything/progress/v1',
      JSON.stringify({
        ...defaultProgress(),
        settings: { hintLang: 'en', autoSpeak: false, forgetHoldMs: 3000 },
      }),
    )
    expect(loadProgress().settings.thinkHoldMs).toBe(3000)
  })

  it('defaults produceRatio to 50 and keeps valid options', () => {
    // 旧数据没有 produceRatio → 默认 50
    localStorage.setItem(
      'name-everything/progress/v1',
      JSON.stringify({
        ...defaultProgress(),
        settings: {
          hintLang: 'en',
          autoSpeak: false,
          thinkHoldMs: 5000,
          uiSound: true,
        },
      }),
    )
    expect(loadProgress().settings.produceRatio).toBe(50)
    // 非法档位 → 回落 50
    localStorage.setItem(
      'name-everything/progress/v1',
      JSON.stringify({
        ...defaultProgress(),
        settings: { ...defaultProgress().settings, produceRatio: 30 },
      }),
    )
    expect(loadProgress().settings.produceRatio).toBe(50)
    // 合法档位保留（不启用 / 全部启用）
    localStorage.setItem(
      'name-everything/progress/v1',
      JSON.stringify({
        ...defaultProgress(),
        settings: { ...defaultProgress().settings, produceRatio: 0 },
      }),
    )
    expect(loadProgress().settings.produceRatio).toBe(0)
    localStorage.setItem(
      'name-everything/progress/v1',
      JSON.stringify({
        ...defaultProgress(),
        settings: { ...defaultProgress().settings, produceRatio: 100 },
      }),
    )
    expect(loadProgress().settings.produceRatio).toBe(100)
  })

  it('practice Got it graduates to strong and leaves forgot and warm', () => {
    let s = loadProgress()
    s = markForgot(s, 'cup')
    s = markReviewGotIt(s, 'cup', todayKey())
    expect(s.warmIds).toContain('cup')
    s = markGotIt(s, 'cup', todayKey())
    expect(s.strongIds).toContain('cup')
    expect(s.warmIds).not.toContain('cup')
    expect(s.forgotIds).not.toContain('cup')
    expect(s.gotItToday[todayKey()]).toContain('cup')
  })

  it('review Got it moves to warm without counting the daily set', () => {
    const today = todayKey()
    let s = markForgot(loadProgress(), 'cup', today)
    s = markReviewGotIt(s, 'cup', today)
    expect(s.forgotIds).not.toContain('cup')
    expect(s.warmIds).toContain('cup')
    expect(s.strongIds).not.toContain('cup')
    expect(s.gotItToday[today] ?? []).not.toContain('cup')
  })

  it('keeps 15s as a valid thinkHoldMs', () => {
    localStorage.setItem(
      'name-everything/progress/v1',
      JSON.stringify({
        ...defaultProgress(),
        settings: { hintLang: 'en', autoSpeak: false, thinkHoldMs: 15000 },
      }),
    )
    expect(loadProgress().settings.thinkHoldMs).toBe(15000)
  })

  it('increments reviewUnseenCount only when a card newly enters Forgot', () => {
    const today = todayKey()
    let s = markForgot(loadProgress(), 'cup', today)
    expect(s.reviewUnseenCount).toBe(1)
    s = markForgot(s, 'cup', today)
    expect(s.reviewUnseenCount).toBe(1)
    s = markForgot(s, 'door', today)
    expect(s.reviewUnseenCount).toBe(2)
    s = clearReviewUnseen(s)
    expect(s.reviewUnseenCount).toBe(0)
  })

  it('Forgot touches streak and demotes warm back to the review queue', () => {
    const today = todayKey()
    let s = markReviewGotIt(markForgot(loadProgress(), 'cup', today), 'cup', today)
    expect(s.warmIds).toContain('cup')
    s = { ...s, streaks: { lastActiveDate: null, count: 0 } }
    s = markForgot(s, 'cup', today)
    expect(s.forgotIds[0]).toBe('cup')
    expect(s.warmIds).not.toContain('cup')
    expect(s.streaks.lastActiveDate).toBe(today)
    expect(s.streaks.count).toBe(1)
  })

  it('currentSetView uses remaining pool as denom when fewer than 10 left', () => {
    const today = todayKey()
    let s = defaultProgress()
    s = markGotIt(s, 'a', today)
    s = markGotIt(s, 'b', today)
    const view = currentSetView(s, 2, today)
    expect(view).toEqual({ gotInSet: 2, denom: 4, wrap: 'none' })
  })

  it('currentSetView wraps daily at 10 when the pool still has cards', () => {
    const today = todayKey()
    let s = defaultProgress()
    for (const id of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']) {
      s = markGotIt(s, id, today)
    }
    expect(currentSetView(s, 5, today).wrap).toBe('daily')
    s = ackDailyContinue(s, today)
    expect(currentSetView(s, 5, today)).toEqual({
      gotInSet: 10,
      denom: 10,
      wrap: 'none',
    })
    s = markGotIt(s, 'k', today)
    expect(currentSetView(s, 4, today)).toEqual({
      gotInSet: 11,
      denom: 11,
      wrap: 'none',
    })
  })

  it('currentSetView wraps pack when nothing remains to practice', () => {
    const today = todayKey()
    const s = markGotIt(defaultProgress(), 'a', today)
    expect(currentSetView(s, 0, today).wrap).toBe('pack')
  })
})
