import { getSupabase } from '../../../lib/supabase'
import {
  mergeCachedTables,
  mergeVersions,
  readCachedGrammarContent,
  writeCachedGrammarContent,
} from './contentCacheIdb'
import {
  CONTENT_TABLE_NAMES,
  emptyVersions,
  isCompleteCache,
  tablesNeedingFetch,
  type CachedContentTables,
  type CachedGrammarContent,
  type ContentTableName,
  type ContentTableVersions,
} from './contentCacheTypes'
import { mergeGameTuning } from './loadPackFromJson'
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

type VersionRow = {
  table_name: string
  version: number
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
  return mergeGameTuning(values)
}

export function resolveSentenceSlots(
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

export async function fetchContentTableVersions(): Promise<ContentTableVersions> {
  const rows = await selectAll<VersionRow>('content_table_versions')
  const versions = emptyVersions()
  for (const row of rows) {
    if ((CONTENT_TABLE_NAMES as readonly string[]).includes(row.table_name)) {
      versions[row.table_name as ContentTableName] = Number(row.version)
    }
  }
  return versions
}

export async function fetchContentTables(
  names: ContentTableName[],
): Promise<Partial<CachedContentTables>> {
  const entries = await Promise.all(
    names.map(async (name) => [name, await selectAll(name)] as const),
  )
  return Object.fromEntries(entries) as Partial<CachedContentTables>
}

export function assembleGrammarContentFromTables(tables: CachedContentTables): {
  pack: GrammarPack
  tuning: GameTuning
} {
  const slotRows = tables.slots as SlotRow[]
  const refRows = tables.sentence_slot_refs as SentenceSlotRefRow[]
  const slotById = new Map(slotRows.map((row) => [row.id, row]))

  return {
    pack: {
      chapters: (tables.chapters as ChapterRow[]).map(mapChapter),
      grammar_points: tables.grammar_points as GrammarPoint[],
      levels: (tables.levels as LevelRow[]).map(mapLevel),
      sentences: (tables.sentences as SentenceRow[]).map(mapSentence),
      sentence_spans: (tables.sentence_spans as SentenceSpanRow[]).map(mapSpan),
      sentence_slots: resolveSentenceSlots(refRows, slotById),
    },
    tuning: mapTuning(tables.game_tuning as GameTuningRow[]),
  }
}

export async function fetchGrammarPackFromSupabase(): Promise<GrammarPack> {
  const tables = await fetchContentTables([
    'chapters',
    'grammar_points',
    'levels',
    'sentences',
    'sentence_spans',
    'slots',
    'sentence_slot_refs',
  ])
  const assembled = assembleGrammarContentFromTables({
    chapters: tables.chapters ?? [],
    grammar_points: tables.grammar_points ?? [],
    levels: tables.levels ?? [],
    sentences: tables.sentences ?? [],
    sentence_spans: tables.sentence_spans ?? [],
    slots: tables.slots ?? [],
    sentence_slot_refs: tables.sentence_slot_refs ?? [],
    game_tuning: [],
  })
  return assembled.pack
}

export async function fetchGameTuningFromSupabase(): Promise<GameTuning> {
  const tables = await fetchContentTables(['game_tuning'])
  return mapTuning((tables.game_tuning ?? []) as GameTuningRow[])
}

export async function fetchGrammarContentFromSupabase(): Promise<{
  pack: GrammarPack
  tuning: GameTuning
}> {
  const [tables, versions] = await Promise.all([
    fetchContentTables([...CONTENT_TABLE_NAMES]),
    fetchContentTableVersions(),
  ])
  const cachedTables = mergeCachedTables(null, tables)
  const cache: CachedGrammarContent = { versions, tables: cachedTables }
  await writeCachedGrammarContent(cache)
  return assembleGrammarContentFromTables(cachedTables)
}

/**
 * Apply remote versions: fetch only changed tables, write IDB, return assembled content.
 * Returns null when nothing changed (and cache was already complete).
 */
export async function syncGrammarContentCache(
  local: CachedGrammarContent | null,
): Promise<{ pack: GrammarPack; tuning: GameTuning; changed: boolean } | null> {
  const remoteVersions = await fetchContentTableVersions()
  const localVersions = local?.versions ?? emptyVersions()
  const needed = tablesNeedingFetch(localVersions, remoteVersions)

  if (needed.length === 0 && isCompleteCache(local)) {
    return {
      ...assembleGrammarContentFromTables(local.tables),
      changed: false,
    }
  }

  const fetched = await fetchContentTables(
    needed.length > 0 ? needed : [...CONTENT_TABLE_NAMES],
  )
  const tables = mergeCachedTables(local?.tables ?? null, fetched)
  const versions = mergeVersions(
    local?.versions ?? null,
    remoteVersions,
    needed.length > 0 ? needed : [...CONTENT_TABLE_NAMES],
  )
  const cache: CachedGrammarContent = { versions, tables }
  await writeCachedGrammarContent(cache)
  return {
    ...assembleGrammarContentFromTables(tables),
    changed: true,
  }
}

export async function readLocalGrammarContentCache(): Promise<CachedGrammarContent | null> {
  const cache = await readCachedGrammarContent()
  return isCompleteCache(cache) ? cache : null
}
