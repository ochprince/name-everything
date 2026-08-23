import { getSupabase } from '../../../lib/supabase'
import type {
  Chapter,
  GameTuning,
  GrammarPack,
  GrammarPoint,
  Level,
  Sentence,
  SentenceSlot,
  SentenceSpan,
} from './types'

type ChapterRow = {
  id: string
  title_zh: string
  description_zh: string | null
  sort_order: number
  released: boolean
}

type LevelRow = {
  id: string
  chapter_id: string
  sort_order: number
  grammar_point_id: string
  pass_threshold: number | null
  lives: number | null
  fall_duration_ms: number | null
}

type SentenceRow = {
  id: string
  level_id: string
  kind: 'anchor' | 'playable'
  en: string
  zh: string
  prompt_kind: 'zh' | 'image'
  image_url: string | null
  sort_order: number
}

type SentenceSpanRow = {
  id: string
  sentence_id: string
  grammar_point_id: string
  start: number
  end: number
}

type SlotRow = {
  id: string
  role: string
  correct: string
  distractors: string[]
}

type SentenceSlotRefRow = {
  sentence_id: string
  slot_index: number
  slot_id: string
}

type GameTuningRow = {
  key: string
  value: number
}

function mapChapter(row: ChapterRow): Chapter {
  return {
    id: row.id,
    title_zh: row.title_zh,
    description_zh: row.description_zh ?? undefined,
    sort_order: row.sort_order,
    released: row.released,
  }
}

function mapLevel(row: LevelRow): Level {
  return {
    id: row.id,
    chapter_id: row.chapter_id,
    sort_order: row.sort_order,
    grammar_point_id: row.grammar_point_id,
    pass_threshold: row.pass_threshold ?? undefined,
    lives: row.lives ?? undefined,
    fall_duration_ms: row.fall_duration_ms ?? undefined,
  }
}

function mapSentence(row: SentenceRow): Sentence {
  return {
    id: row.id,
    level_id: row.level_id,
    kind: row.kind,
    en: row.en,
    zh: row.zh,
    prompt_kind: row.prompt_kind,
    image_url: row.image_url ?? undefined,
    sort_order: row.sort_order,
  }
}

function mapSpan(row: SentenceSpanRow): SentenceSpan {
  return {
    id: row.id,
    sentence_id: row.sentence_id,
    grammar_point_id: row.grammar_point_id,
    start: row.start,
    end: row.end,
  }
}

function mapTuning(rows: GameTuningRow[]): GameTuning {
  const values = Object.fromEntries(rows.map((row) => [row.key, row.value]))
  return values as GameTuning
}

function resolveSentenceSlots(
  refs: SentenceSlotRefRow[],
  slotById: Map<string, SlotRow>,
): SentenceSlot[] {
  return [...refs]
    .sort(
      (a, b) =>
        a.sentence_id.localeCompare(b.sentence_id) || a.slot_index - b.slot_index,
    )
    .map((ref) => {
      const slot = slotById.get(ref.slot_id)
      if (!slot) {
        throw new Error(
          `sentence_slot_refs: missing slots.id "${ref.slot_id}" for ${ref.sentence_id}#${ref.slot_index}`,
        )
      }
      const distractors = Array.isArray(slot.distractors)
        ? slot.distractors
        : JSON.parse(String(slot.distractors))
      return {
        // Occurrence id keeps reports/UI stable per blank; slot_id is reusable definition.
        id: `${ref.sentence_id}-slot-${ref.slot_index}`,
        sentence_id: ref.sentence_id,
        slot_index: ref.slot_index,
        role: slot.role,
        correct: slot.correct,
        distractors,
      }
    })
}

async function selectAll<T>(table: string): Promise<T[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase.from(table).select('*')
  if (error) throw new Error(`${table}: ${error.message}`)
  return (data ?? []) as T[]
}

export async function fetchGrammarPackFromSupabase(): Promise<GrammarPack> {
  const [
    chapterRows,
    grammarPointRows,
    levelRows,
    sentenceRows,
    spanRows,
    slotRows,
    refRows,
  ] = await Promise.all([
    selectAll<ChapterRow>('chapters'),
    selectAll<GrammarPoint>('grammar_points'),
    selectAll<LevelRow>('levels'),
    selectAll<SentenceRow>('sentences'),
    selectAll<SentenceSpanRow>('sentence_spans'),
    selectAll<SlotRow>('slots'),
    selectAll<SentenceSlotRefRow>('sentence_slot_refs'),
  ])

  const slotById = new Map(slotRows.map((row) => [row.id, row]))

  return {
    chapters: chapterRows.map(mapChapter),
    grammar_points: grammarPointRows,
    levels: levelRows.map(mapLevel),
    sentences: sentenceRows.map(mapSentence),
    sentence_spans: spanRows.map(mapSpan),
    sentence_slots: resolveSentenceSlots(refRows, slotById),
  }
}

export async function fetchGameTuningFromSupabase(): Promise<GameTuning> {
  const rows = await selectAll<GameTuningRow>('game_tuning')
  return mapTuning(rows)
}

export async function fetchGrammarContentFromSupabase(): Promise<{
  pack: GrammarPack
  tuning: GameTuning
}> {
  const [pack, tuning] = await Promise.all([
    fetchGrammarPackFromSupabase(),
    fetchGameTuningFromSupabase(),
  ])
  return { pack, tuning }
}
