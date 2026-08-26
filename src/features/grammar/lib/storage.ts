import { useSyncExternalStore } from 'react'
import { getSupabase, isSupabaseConfigured } from '../../../lib/supabase'
import { gameTuning } from '../content/tuning'
import {
  isGrammarPackLoaded,
  levelById,
  pointById,
  playablesForLevel,
  sentenceById,
  slotsForSentence,
} from '../content/pack'
import { arcadeEarnedTrophy } from './arcadeChallenge'

export type ArcadeRecord = {
  id: string
  at: string
  score: number
  total: number
  cleared: boolean
}

export type AssetReport = {
  id: string
  asset_type: 'sentence' | 'grammar_point' | 'sentence_slot' | 'picture_word'
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
  arcadeTrophyCount: number
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
  arcadeTrophyCount: 0,
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
      arcadeHistory: (value.arcadeHistory ?? []).map(normalizeArcadeRecord),
      arcadeTrophyCount: value.arcadeTrophyCount ?? 0,
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
    passedSentenceCounts[levelId] = playablesForLevel(levelId).length
  }
  saveGrammarProgress({
    ...current,
    highScores,
    passedLevelIds,
    passedSentenceCounts,
    lastPlayedLevelId: levelId,
  })
}

function normalizeArcadeRecord(
  entry: Partial<ArcadeRecord> & Pick<ArcadeRecord, 'id' | 'at' | 'score'>,
): ArcadeRecord {
  return {
    id: entry.id,
    at: entry.at,
    score: entry.score,
    total: entry.total ?? entry.score,
    cleared: entry.cleared ?? false,
  }
}

export function recordArcadeRun(
  score: number,
  total: number,
  cleared: boolean,
  poolSize: number,
) {
  const current = loadGrammarProgress()
  const entry: ArcadeRecord = {
    id: newId(),
    at: new Date().toISOString(),
    score,
    total,
    cleared,
  }
  const earnedTrophy = arcadeEarnedTrophy(cleared, total, poolSize)
  saveGrammarProgress({
    ...current,
    arcadeHistory: [entry, ...current.arcadeHistory].slice(0, 20),
    arcadeTrophyCount: current.arcadeTrophyCount + (earnedTrophy ? 1 : 0),
  })
}

export function addReport(
  input: Omit<AssetReport, 'id' | 'created_at' | 'note'> & { note?: string },
) {
  const note = input.note?.trim() ?? ''
  if (!note) return

  const report: AssetReport = {
    ...input,
    id: newId(),
    created_at: new Date().toISOString(),
    note,
  }

  const reports = loadReports()
  saveReports([report, ...reports])

  if (isSupabaseConfigured()) {
    void getSupabase()
      .from('asset_reports')
      .insert({
        id: report.id,
        asset_type: report.asset_type,
        asset_id: report.asset_id,
        level_id: report.level_id,
        note: report.note,
        created_at: report.created_at,
      })
      .then(({ error }) => {
        if (error) console.warn('asset_reports insert failed:', error.message)
      })
  }
}

/**
 * Export-time enrichment: the base report rows stay lean (id/asset/level/note),
 * but the exported JSON joins against the current grammar pack so pasted
 * reports are self-contained — sentence text, every slot's role/correct/
 * distractors, and point copy — no extra DB lookups needed to triage.
 * Only the export is enriched; localStorage / asset_reports keep the 6 fields.
 */
function enrichReport(report: AssetReport): Record<string, unknown> {
  const out: Record<string, unknown> = { ...report }
  if (!isGrammarPackLoaded()) return out

  if (report.level_id) {
    const level = levelById(report.level_id)
    const topic = level ? pointById(level.grammar_point_id) : undefined
    if (topic) out.level_title = topic.title_zh
  }

  if (report.asset_type === 'sentence') {
    const sentence = sentenceById(report.asset_id)
    if (sentence) {
      out.en = sentence.en
      out.zh = sentence.zh
    }
    const slots = slotsForSentence(report.asset_id)
    if (slots.length > 0) {
      out.slots = slots.map((slot) => ({
        // Occurrence id {sentence_id}-slot-{index}; resolves to slots via
        // sentence_slot_refs (the reusable sl-* id is not in the runtime pack).
        id: slot.id,
        slot_index: slot.slot_index,
        role: slot.role,
        correct: slot.correct,
        distractors: slot.distractors,
      }))
    }
  } else if (report.asset_type === 'sentence_slot') {
    const match = /^(.+)-slot-(\d+)$/.exec(report.asset_id)
    if (match) {
      const sentenceId = match[1]
      const slotIndex = Number(match[2])
      const sentence = sentenceById(sentenceId)
      if (sentence) {
        out.sentence_en = sentence.en
        out.sentence_zh = sentence.zh
      }
      const slot = slotsForSentence(sentenceId).find(
        (s) => s.slot_index === slotIndex,
      )
      if (slot) {
        out.slot_index = slot.slot_index
        out.role = slot.role
        out.correct = slot.correct
        out.distractors = slot.distractors
      }
    }
  } else if (report.asset_type === 'grammar_point') {
    const point = pointById(report.asset_id)
    if (point) {
      out.title_zh = point.title_zh
      out.body_zh = point.body_zh
    }
  }

  return out
}

export function exportReports(): string {
  return JSON.stringify(loadReports().map(enrichReport), null, 2)
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
