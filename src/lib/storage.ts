const KEY = 'name-everything/progress/v1'

export type ProgressState = {
  forgotIds: string[]
  pinnedIds: string[]
  gotItToday: Record<string, string[]>
  streaks: { lastActiveDate: string | null; count: number }
  settings: { expandWord: boolean; expandZh: boolean }
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
    streaks: { lastActiveDate: null, count: 0 },
    settings: { expandWord: false, expandZh: false },
  }
}

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultProgress()
    return { ...defaultProgress(), ...JSON.parse(raw) }
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
    forgotIds: uniq([...state.forgotIds, cardId]),
  }
}

export function togglePin(state: ProgressState, cardId: string): ProgressState {
  const has = state.pinnedIds.includes(cardId)
  return {
    ...state,
    pinnedIds: has
      ? state.pinnedIds.filter((id) => id !== cardId)
      : uniq([...state.pinnedIds, cardId]),
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
