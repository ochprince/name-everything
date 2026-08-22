import { useSyncExternalStore } from 'react'
import { gameTuning } from '../content/tuning'
import { sentencesForLevel } from '../content/pack'

export type ArcadeRecord = {
  id: string
  at: string
  score: number
}

export type AssetReport = {
  id: string
  asset_type: 'sentence' | 'grammar_point' | 'sentence_slot'
  asset_id: string
  level_id: string | null
  note: string
  created_at: string
}

export type GrammarProgress = {
  highScores: Record<string, number>
  passedLevelIds: string[]
  /** Sentence count in the level when the user last passed it. */
  passedSentenceCounts: Record<string, number>
  lastPlayedLevelId: string | null
  arcadeHistory: ArcadeRecord[]
}

const PROGRESS_KEY = 'grammar/progress/v1'
const REPORTS_KEY = 'grammar/reports/v1'

const progressListeners = new Set<() => void>()
const reportListeners = new Set<() => void>()

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `g-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const EMPTY_PROGRESS: GrammarProgress = {
  highScores: {},
  passedLevelIds: [],
  passedSentenceCounts: {},
  lastPlayedLevelId: null,
  arcadeHistory: [],
}
const EMPTY_REPORTS: AssetReport[] = []

export function defaultGrammarProgress(): GrammarProgress {
  return EMPTY_PROGRESS
}

function parseProgress(raw: string | null): GrammarProgress {
  if (!raw) return EMPTY_PROGRESS
  try {
    const value = JSON.parse(raw) as Partial<GrammarProgress>
    return {
      highScores: value.highScores ?? {},
      passedLevelIds: value.passedLevelIds ?? [],
      passedSentenceCounts: value.passedSentenceCounts ?? {},
      lastPlayedLevelId: value.lastPlayedLevelId ?? null,
      arcadeHistory: value.arcadeHistory ?? [],
    }
  } catch {
    return EMPTY_PROGRESS
  }
}

function parseReports(raw: string | null): AssetReport[] {
  if (!raw) return EMPTY_REPORTS
  try {
    const value = JSON.parse(raw) as AssetReport[]
    return Array.isArray(value) ? value : EMPTY_REPORTS
  } catch {
    return EMPTY_REPORTS
  }
}

let progressRaw: string | null = null
let progressCache: GrammarProgress = EMPTY_PROGRESS
let reportsRaw: string | null = null
let reportsCache: AssetReport[] = EMPTY_REPORTS

export function loadGrammarProgress(): GrammarProgress {
  const raw = localStorage.getItem(PROGRESS_KEY)
  if (raw === progressRaw) return progressCache
  progressRaw = raw
  progressCache = parseProgress(raw)
  return progressCache
}

export function loadReports(): AssetReport[] {
  const raw = localStorage.getItem(REPORTS_KEY)
  if (raw === reportsRaw) return reportsCache
  reportsRaw = raw
  reportsCache = parseReports(raw)
  return reportsCache
}

function emitProgress() {
  progressListeners.forEach((listener) => listener())
}

function emitReports() {
  reportListeners.forEach((listener) => listener())
}

export function saveGrammarProgress(next: GrammarProgress) {
  const raw = JSON.stringify(next)
  progressCache = next
  progressRaw = raw
  localStorage.setItem(PROGRESS_KEY, raw)
  emitProgress()
}

export function saveReports(next: AssetReport[]) {
  const raw = JSON.stringify(next)
  reportsCache = next
  reportsRaw = raw
  localStorage.setItem(REPORTS_KEY, raw)
  emitReports()
}

export function subscribeGrammarProgress(listener: () => void) {
  progressListeners.add(listener)
  return () => progressListeners.delete(listener)
}

export function subscribeReports(listener: () => void) {
  reportListeners.add(listener)
  return () => reportListeners.delete(listener)
}

export function useGrammarProgress(): GrammarProgress {
  return useSyncExternalStore(
    subscribeGrammarProgress,
    loadGrammarProgress,
    defaultGrammarProgress,
  )
}

export function useGrammarReports(): AssetReport[] {
  return useSyncExternalStore(subscribeReports, loadReports, () => EMPTY_REPORTS)
}

export function recordLevelScore(levelId: string, score: number, threshold: number) {
  const current = loadGrammarProgress()
  const prev = current.highScores[levelId] ?? 0
  const highScores = { ...current.highScores, [levelId]: Math.max(prev, score) }
  const passed = highScores[levelId]! >= threshold
  const passedLevelIds = current.passedLevelIds.includes(levelId)
    ? current.passedLevelIds
    : passed
      ? [...current.passedLevelIds, levelId]
      : current.passedLevelIds
  const passedSentenceCounts = { ...current.passedSentenceCounts }
  if (passed && score >= threshold) {
    passedSentenceCounts[levelId] = sentencesForLevel(levelId).length
  }
  saveGrammarProgress({
    ...current,
    highScores,
    passedLevelIds,
    passedSentenceCounts,
    lastPlayedLevelId: levelId,
  })
}

export function recordArcadeScore(score: number) {
  const current = loadGrammarProgress()
  const entry: ArcadeRecord = {
    id: newId(),
    at: new Date().toISOString(),
    score,
  }
  saveGrammarProgress({
    ...current,
    arcadeHistory: [entry, ...current.arcadeHistory].slice(0, 20),
  })
}

export function addReport(
  input: Omit<AssetReport, 'id' | 'created_at' | 'note'> & { note?: string },
) {
  const note = input.note?.trim() ?? ''
  if (!note) return

  const reports = loadReports()
  saveReports([
    {
      ...input,
      id: newId(),
      created_at: new Date().toISOString(),
      note,
    },
    ...reports,
  ])
}

export function exportReports(): string {
  return JSON.stringify(loadReports(), null, 2)
}

export function clearReports() {
  saveReports([])
}

export function passedLevelCount(progress = loadGrammarProgress()): number {
  return progress.passedLevelIds.length
}

export function levelThreshold(passThreshold?: number): number {
  return passThreshold ?? gameTuning.pass_threshold_default
}
