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
  /**
   * Playable sentence ids in the level when the user last passed it。
   * 与 passedSentenceCounts 互补：counts 只能识别「句子变多」，
   * ids 快照还能识别「内容被替换」（数量不变但句子变了）。
   */
  passedSentenceIds: Record<string, string[]>
  lastPlayedLevelId: string | null
  arcadeHistory: ArcadeRecord[]
  arcadeTrophyCount: number
  /**
   * 挑战模式句子掌握度计分（sentenceId → score）。
   * 答错 -1；答对时负分归零、非负 +1；score ≥ 5 视为牢固掌握，
   * 退出挑战池（buildArcadeQueue 过滤）。只记挑战（arcade/vocab），
   * 关卡游戏不记录。
   */
  sentenceScores: Record<string, number>
}

export type ProduceCandidate = {
  id: string
  level_id: string
  en: string
  zh: string
  created_at: string
}

const PROGRESS_KEY = 'grammar/progress/v1'
const REPORTS_KEY = 'grammar/reports/v1'
const PRODUCE_CANDIDATES_KEY = 'grammar/produce-candidates/v1'

const progressListeners = new Set<() => void>()
const reportListeners = new Set<() => void>()
const produceListeners = new Set<() => void>()

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
  passedSentenceIds: {},
  lastPlayedLevelId: null,
  arcadeHistory: [],
  arcadeTrophyCount: 0,
  sentenceScores: {},
}
const EMPTY_REPORTS: AssetReport[] = []
const EMPTY_PRODUCE: ProduceCandidate[] = []

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
      passedSentenceIds: value.passedSentenceIds ?? {},
      lastPlayedLevelId: value.lastPlayedLevelId ?? null,
      arcadeHistory: (value.arcadeHistory ?? []).map(normalizeArcadeRecord),
      arcadeTrophyCount: value.arcadeTrophyCount ?? 0,
      sentenceScores: value.sentenceScores ?? {},
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

function parseProduceCandidates(raw: string | null): ProduceCandidate[] {
  if (!raw) return EMPTY_PRODUCE
  try {
    const value = JSON.parse(raw) as ProduceCandidate[]
    if (!Array.isArray(value)) return EMPTY_PRODUCE
    return value.filter(
      (row) =>
        row &&
        typeof row.id === 'string' &&
        typeof row.level_id === 'string' &&
        typeof row.en === 'string' &&
        typeof row.zh === 'string' &&
        typeof row.created_at === 'string',
    )
  } catch {
    return EMPTY_PRODUCE
  }
}

let progressRaw: string | null = null
let progressCache: GrammarProgress = EMPTY_PROGRESS
let reportsRaw: string | null = null
let reportsCache: AssetReport[] = EMPTY_REPORTS
let produceRaw: string | null = null
let produceCache: ProduceCandidate[] = EMPTY_PRODUCE

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

export function loadProduceCandidates(): ProduceCandidate[] {
  const raw = localStorage.getItem(PRODUCE_CANDIDATES_KEY)
  if (raw === produceRaw) return produceCache
  produceRaw = raw
  produceCache = parseProduceCandidates(raw)
  return produceCache
}

function emitProduce() {
  produceListeners.forEach((listener) => listener())
}

export function saveProduceCandidates(next: ProduceCandidate[]) {
  const raw = JSON.stringify(next)
  produceCache = next
  produceRaw = raw
  localStorage.setItem(PRODUCE_CANDIDATES_KEY, raw)
  emitProduce()
}

export function subscribeProduceCandidates(listener: () => void) {
  produceListeners.add(listener)
  return () => produceListeners.delete(listener)
}

export function useGrammarProduceCandidates(): ProduceCandidate[] {
  return useSyncExternalStore(
    subscribeProduceCandidates,
    loadProduceCandidates,
    () => EMPTY_PRODUCE,
  )
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
  const passedSentenceIds = { ...current.passedSentenceIds }
  if (passed && score >= threshold) {
    passedSentenceCounts[levelId] = playablesForLevel(levelId).length
    passedSentenceIds[levelId] = playablesForLevel(levelId).map((sentence) => sentence.id)
  }
  saveGrammarProgress({
    ...current,
    highScores,
    passedLevelIds,
    passedSentenceCounts,
    passedSentenceIds,
    lastPlayedLevelId: levelId,
  })
}

/**
 * 挑战模式句子计分：答错 -1；答对时负分归零、非负 +1。
 * score ≥ 5 由 buildArcadeQueue 过滤退出挑战池。
 */
export function recordSentenceOutcome(sentenceId: string, correct: boolean) {
  const current = loadGrammarProgress()
  const prev = current.sentenceScores[sentenceId] ?? 0
  const next = correct ? (prev < 0 ? 0 : prev + 1) : prev - 1
  saveGrammarProgress({
    ...current,
    sentenceScores: { ...current.sentenceScores, [sentenceId]: next },
  })
}

/** 清空句子掌握度（配合"清空学习进度"入口，让退出的句子重新进入挑战）。 */
export function resetSentenceScores() {
  const current = loadGrammarProgress()
  saveGrammarProgress({ ...current, sentenceScores: {} })
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
 * Persist an AI-passed produce sentence as a candidate asset (local + best-effort remote).
 * Returns the new id, or null if en/zh/levelId blank after trim.
 */
export function recordProduceCandidate(input: {
  levelId: string
  en: string
  zh: string
  deviceId?: string
}): string | null {
  const levelId = input.levelId.trim()
  const en = input.en.trim()
  const zh = input.zh.trim()
  if (!levelId || !en || !zh) return null

  const candidate: ProduceCandidate = {
    id: newId(),
    level_id: levelId,
    en,
    zh,
    created_at: new Date().toISOString(),
  }

  saveProduceCandidates([candidate, ...loadProduceCandidates()])

  if (isSupabaseConfigured()) {
    void getSupabase()
      .from('grammar_produce_candidates')
      .insert({
        id: candidate.id,
        level_id: candidate.level_id,
        en: candidate.en,
        zh: candidate.zh,
        device_id: input.deviceId?.trim() || null,
        created_at: candidate.created_at,
      })
      .then(({ error }) => {
        if (error) {
          console.warn('grammar_produce_candidates insert failed:', error.message)
        }
      })
  }

  return candidate.id
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

function enrichProduceCandidate(
  candidate: ProduceCandidate,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...candidate }
  if (!isGrammarPackLoaded()) return out
  const level = levelById(candidate.level_id)
  const topic = level ? pointById(level.grammar_point_id) : undefined
  if (topic) out.level_title = topic.title_zh
  return out
}

export function exportProduceCandidates(): string {
  return JSON.stringify(
    loadProduceCandidates().map(enrichProduceCandidate),
    null,
    2,
  )
}

export function clearProduceCandidates() {
  saveProduceCandidates([])
}

export function passedLevelCount(progress = loadGrammarProgress()): number {
  return progress.passedLevelIds.length
}

export function levelThreshold(passThreshold?: number): number {
  return passThreshold ?? gameTuning.pass_threshold_default
}
