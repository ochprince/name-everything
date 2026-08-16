const KEY = 'name-everything/progress/v1'

export type HintLang = 'en' | 'zh'

export const FORGET_HOLD_OPTIONS = [0, 3000, 5000, 10000, 15000] as const
export type ForgetHoldMs = (typeof FORGET_HOLD_OPTIONS)[number]

export const FORGET_HOLD_LABELS: Record<ForgetHoldMs, string> = {
  0: '不停顿',
  3000: '3s',
  5000: '5s',
  10000: '10s',
  15000: '15s',
}

export type ProgressState = {
  forgotIds: string[]
  pinnedIds: string[]
  gotItToday: Record<string, string[]>
  currentCardId: string | null
  recentPracticeTag: string | null
  streaks: { lastActiveDate: string | null; count: number }
  settings: {
    hintLang: HintLang
    autoSpeak: boolean
    forgetHoldMs: ForgetHoldMs
  }
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function defaultProgress(): ProgressState {
  return {
    forgotIds: [],
    pinnedIds: [],
    gotItToday: {},
    currentCardId: null,
    recentPracticeTag: null,
    streaks: { lastActiveDate: null, count: 0 },
    settings: { hintLang: 'en', autoSpeak: false, forgetHoldMs: 5000 },
  }
}

function isForgetHold(value: unknown): value is ForgetHoldMs {
  return (FORGET_HOLD_OPTIONS as readonly number[]).includes(value as number)
}

function normalizeSettings(raw: unknown): {
  hintLang: HintLang
  autoSpeak: boolean
  forgetHoldMs: ForgetHoldMs
} {
  if (!raw || typeof raw !== 'object') {
    return { hintLang: 'en', autoSpeak: false, forgetHoldMs: 5000 }
  }
  const settings = raw as {
    hintLang?: unknown
    expandZh?: unknown
    autoSpeak?: unknown
    forgetHoldMs?: unknown
  }
  const hintLang: HintLang =
    settings.hintLang === 'en' || settings.hintLang === 'zh'
      ? settings.hintLang
      : settings.expandZh === true
        ? 'zh'
        : 'en'
  return {
    hintLang,
    autoSpeak: settings.autoSpeak === true,
    forgetHoldMs: isForgetHold(settings.forgetHoldMs)
      ? settings.forgetHoldMs
      : 5000,
  }
}

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultProgress()
    const parsed = JSON.parse(raw) as Partial<ProgressState>
    const base = defaultProgress()
    return {
      ...base,
      ...parsed,
      currentCardId:
        typeof parsed.currentCardId === 'string' ? parsed.currentCardId : null,
      recentPracticeTag:
        typeof parsed.recentPracticeTag === 'string'
          ? parsed.recentPracticeTag
          : null,
      settings: normalizeSettings(parsed.settings),
    }
  } catch {
    return defaultProgress()
  }
}

export function saveProgress(state: ProgressState): void {
  localStorage.setItem(KEY, JSON.stringify(state))
}

function uniq(ids: string[]): string[] {
  return [...new Set(ids)]
}

export function markForgot(state: ProgressState, cardId: string): ProgressState {
  return {
    ...state,
    forgotIds: uniq([cardId, ...state.forgotIds]),
  }
}

export function togglePin(state: ProgressState, cardId: string): ProgressState {
  const has = state.pinnedIds.includes(cardId)
  return {
    ...state,
    pinnedIds: has
      ? state.pinnedIds.filter((id) => id !== cardId)
      : uniq([cardId, ...state.pinnedIds]),
  }
}

export function setPracticeCursor(
  state: ProgressState,
  cardId: string | null,
  recentTag: string | null,
): ProgressState {
  return {
    ...state,
    currentCardId: cardId,
    recentPracticeTag: recentTag,
  }
}

export function markGotIt(
  state: ProgressState,
  cardId: string,
  today: string,
): ProgressState {
  const dayList = uniq([...(state.gotItToday[today] ?? []), cardId])
  let streaks = { ...state.streaks }
  if (streaks.lastActiveDate !== today) {
    const yesterday = new Date(`${today}T12:00:00`)
    yesterday.setDate(yesterday.getDate() - 1)
    const yKey = todayKey(yesterday)
    streaks = {
      lastActiveDate: today,
      count: streaks.lastActiveDate === yKey ? streaks.count + 1 : 1,
    }
  }
  return {
    ...state,
    forgotIds: state.forgotIds.filter((id) => id !== cardId),
    gotItToday: { ...state.gotItToday, [today]: dayList },
    streaks,
  }
}
