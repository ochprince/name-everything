const KEY = 'name-everything/progress/v1'

export type HintLang = 'en' | 'zh'

export const THINK_HOLD_OPTIONS = [3000, 5000, 10000, 15000] as const
export type ThinkHoldMs = (typeof THINK_HOLD_OPTIONS)[number]

export const THINK_HOLD_LABELS: Record<ThinkHoldMs, string> = {
  3000: '3s',
  5000: '5s',
  10000: '10s',
  15000: '15s',
}

export type WrapKind = 'none' | 'daily' | 'pack'

export type ProgressState = {
  forgotIds: string[]
  pinnedIds: string[]
  warmIds: string[]
  strongIds: string[]
  gotItToday: Record<string, string[]>
  dailyContinues: Record<string, number>
  reviewUnseenCount: number
  currentCardId: string | null
  recentPracticeTag: string | null
  streaks: { lastActiveDate: string | null; count: number }
  settings: {
    hintLang: HintLang
    autoSpeak: boolean
    thinkHoldMs: ThinkHoldMs
    uiSound: boolean
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
    warmIds: [],
    strongIds: [],
    gotItToday: {},
    dailyContinues: {},
    reviewUnseenCount: 0,
    currentCardId: null,
    recentPracticeTag: null,
    streaks: { lastActiveDate: null, count: 0 },
    settings: { hintLang: 'en', autoSpeak: false, thinkHoldMs: 5000, uiSound: true },
  }
}

function isThinkHold(value: unknown): value is ThinkHoldMs {
  return (THINK_HOLD_OPTIONS as readonly number[]).includes(value as number)
}

function migrateThinkHold(raw: {
  thinkHoldMs?: unknown
  forgetHoldMs?: unknown
}): ThinkHoldMs {
  if (isThinkHold(raw.thinkHoldMs)) return raw.thinkHoldMs
  if (isThinkHold(raw.forgetHoldMs)) return raw.forgetHoldMs
  return 5000
}

function normalizeSettings(raw: unknown): ProgressState['settings'] {
  if (!raw || typeof raw !== 'object') {
    return { hintLang: 'en', autoSpeak: false, thinkHoldMs: 5000, uiSound: true }
  }
  const settings = raw as {
    hintLang?: unknown
    expandZh?: unknown
    autoSpeak?: unknown
    thinkHoldMs?: unknown
    forgetHoldMs?: unknown
    uiSound?: unknown
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
    thinkHoldMs: migrateThinkHold(settings),
    uiSound: settings.uiSound !== false,
  }
}

function asIdList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((id): id is string => typeof id === 'string')
}

function asDayMap(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== 'object') return {}
  const out: Record<string, string[]> = {}
  for (const [key, ids] of Object.entries(value as Record<string, unknown>)) {
    out[key] = asIdList(ids)
  }
  return out
}

function asContinueMap(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object') return {}
  const out: Record<string, number> = {}
  for (const [key, count] of Object.entries(value as Record<string, unknown>)) {
    if (typeof count === 'number' && Number.isFinite(count) && count >= 0) {
      out[key] = Math.floor(count)
    }
  }
  return out
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
      forgotIds: asIdList(parsed.forgotIds),
      pinnedIds: asIdList(parsed.pinnedIds),
      warmIds: asIdList(parsed.warmIds),
      strongIds: asIdList(parsed.strongIds),
      gotItToday: asDayMap(parsed.gotItToday),
      dailyContinues: asContinueMap(parsed.dailyContinues),
      reviewUnseenCount:
        typeof parsed.reviewUnseenCount === 'number' &&
        Number.isFinite(parsed.reviewUnseenCount) &&
        parsed.reviewUnseenCount > 0
          ? Math.floor(parsed.reviewUnseenCount)
          : 0,
      currentCardId:
        typeof parsed.currentCardId === 'string' ? parsed.currentCardId : null,
      recentPracticeTag:
        typeof parsed.recentPracticeTag === 'string'
          ? parsed.recentPracticeTag
          : null,
      streaks:
        parsed.streaks && typeof parsed.streaks === 'object'
          ? {
              lastActiveDate:
                typeof parsed.streaks.lastActiveDate === 'string'
                  ? parsed.streaks.lastActiveDate
                  : null,
              count:
                typeof parsed.streaks.count === 'number'
                  ? parsed.streaks.count
                  : 0,
            }
          : base.streaks,
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

export function touchStreak(
  state: ProgressState,
  today: string,
): ProgressState {
  if (state.streaks.lastActiveDate === today) return state
  const yesterday = new Date(`${today}T12:00:00`)
  yesterday.setDate(yesterday.getDate() - 1)
  const yKey = todayKey(yesterday)
  return {
    ...state,
    streaks: {
      lastActiveDate: today,
      count: state.streaks.lastActiveDate === yKey ? state.streaks.count + 1 : 1,
    },
  }
}

export function markForgot(
  state: ProgressState,
  cardId: string,
  today: string = todayKey(),
): ProgressState {
  const next = touchStreak(state, today)
  const isNew = !next.forgotIds.includes(cardId)
  return {
    ...next,
    forgotIds: uniq([cardId, ...next.forgotIds]),
    warmIds: next.warmIds.filter((id) => id !== cardId),
    strongIds: next.strongIds.filter((id) => id !== cardId),
    reviewUnseenCount: isNew ? next.reviewUnseenCount + 1 : next.reviewUnseenCount,
  }
}

export function clearReviewUnseen(state: ProgressState): ProgressState {
  if (state.reviewUnseenCount === 0) return state
  return { ...state, reviewUnseenCount: 0 }
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
  const next = touchStreak(state, today)
  const dayList = uniq([...(next.gotItToday[today] ?? []), cardId])
  return {
    ...next,
    forgotIds: next.forgotIds.filter((id) => id !== cardId),
    warmIds: next.warmIds.filter((id) => id !== cardId),
    strongIds: uniq([cardId, ...next.strongIds]),
    gotItToday: { ...next.gotItToday, [today]: dayList },
  }
}

export function markReviewGotIt(
  state: ProgressState,
  cardId: string,
  today: string,
): ProgressState {
  const next = touchStreak(state, today)
  if (next.strongIds.includes(cardId)) {
    return {
      ...next,
      forgotIds: next.forgotIds.filter((id) => id !== cardId),
    }
  }
  return {
    ...next,
    forgotIds: next.forgotIds.filter((id) => id !== cardId),
    warmIds: uniq([cardId, ...next.warmIds]),
  }
}

export function ackDailyContinue(
  state: ProgressState,
  today: string,
): ProgressState {
  return {
    ...state,
    dailyContinues: {
      ...state.dailyContinues,
      [today]: (state.dailyContinues[today] ?? 0) + 1,
    },
  }
}

export function currentSetView(
  state: ProgressState,
  remainingCount: number,
  today: string = todayKey(),
): { gotInSet: number; denom: number; wrap: WrapKind } {
  const gotToday = state.gotItToday[today] ?? []
  const continues = state.dailyContinues[today] ?? 0
  const gotInSet = gotToday.length
  if (remainingCount <= 0) {
    return { gotInSet, denom: Math.max(gotInSet, 0), wrap: 'pack' }
  }
  const target = (continues + 1) * 10
  if (gotInSet >= target) {
    return { gotInSet, denom: gotInSet, wrap: 'daily' }
  }
  const denom = Math.max(gotInSet, Math.min(10, gotInSet + remainingCount))
  return { gotInSet, denom, wrap: 'none' }
}

export function remainingPracticeCount(
  cards: { id: string }[],
  state: ProgressState,
): number {
  const strong = new Set(state.strongIds)
  return cards.filter((card) => !strong.has(card.id)).length
}
