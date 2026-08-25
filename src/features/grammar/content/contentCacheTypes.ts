import type { GameTuning, GrammarPack } from './types'

export const CONTENT_TABLE_NAMES = [
  'chapters',
  'grammar_points',
  'levels',
  'sentences',
  'sentence_spans',
  'slots',
  'sentence_slot_refs',
  'game_tuning',
] as const

export type ContentTableName = (typeof CONTENT_TABLE_NAMES)[number]

export type ContentTableVersions = Record<ContentTableName, number>

export type CachedContentTables = {
  chapters: unknown[]
  grammar_points: unknown[]
  levels: unknown[]
  sentences: unknown[]
  sentence_spans: unknown[]
  slots: unknown[]
  sentence_slot_refs: unknown[]
  game_tuning: unknown[]
}

export type CachedGrammarContent = {
  versions: ContentTableVersions
  tables: CachedContentTables
}

export function emptyVersions(): ContentTableVersions {
  return {
    chapters: 0,
    grammar_points: 0,
    levels: 0,
    sentences: 0,
    sentence_spans: 0,
    slots: 0,
    sentence_slot_refs: 0,
    game_tuning: 0,
  }
}

export function isCompleteCache(
  cache: CachedGrammarContent | null,
): cache is CachedGrammarContent {
  if (!cache) return false
  for (const name of CONTENT_TABLE_NAMES) {
    if (!Array.isArray(cache.tables[name])) return false
    if (!Number.isFinite(cache.versions[name])) return false
  }
  return true
}

/** Tables whose remote version differs from local (including missing local). */
export function tablesNeedingFetch(
  local: ContentTableVersions,
  remote: ContentTableVersions,
): ContentTableName[] {
  return CONTENT_TABLE_NAMES.filter((name) => local[name] !== remote[name])
}

export type AssembledGrammarContent = {
  pack: GrammarPack
  tuning: GameTuning
}
