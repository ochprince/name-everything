import { getSupabase } from '../../../lib/supabase'
import {
  mapPictureWordRow,
  type PictureWordRow,
} from '../content/mapPictureWord'
import {
  readCachedPictureWords,
  writeCachedPictureWords,
  type CachedPictureWords,
} from '../content/pictureWordsCacheIdb'
import type { Card } from '../../../types/card'

const PAGE_SIZE = 1000

type MemoryCatalog = {
  version: number
  cards: Card[]
  byWord: Map<string, Card>
}

export type EnsurePictureWordsDeps = {
  readCached?: () => Promise<CachedPictureWords | null>
  writeCached?: (cache: CachedPictureWords) => Promise<void>
  fetchVersion?: () => Promise<number>
  fetchAllRows?: () => Promise<PictureWordRow[]>
}

let memory: MemoryCatalog | null = null
let ensurePromise: Promise<void> | null = null
let refreshPromise: Promise<void> | null = null

export function isPictureWordsReady(): boolean {
  return memory !== null
}

export function hydratePictureWords(version: number, rows: PictureWordRow[]) {
  const sorted = [...rows].sort((a, b) => a.sort_order - b.sort_order)
  const cards = sorted.map(mapPictureWordRow)
  const byWord = new Map<string, Card>()
  for (const card of cards) byWord.set(card.word, card)
  memory = { version, cards, byWord }
}

export function getPictureWordBatch(offset: number, limit: number): Card[] {
  if (!memory) throw new Error('picture words catalog is not ready')
  return memory.cards.slice(offset, offset + limit)
}

export function getPictureWordsByWords(words: string[]): Card[] {
  if (!memory) throw new Error('picture words catalog is not ready')
  const unique = [...new Set(words.filter(Boolean))]
  const out: Card[] = []
  for (const word of unique) {
    const card = memory.byWord.get(word)
    if (card) out.push(card)
  }
  return out
}

export async function fetchPictureWordsVersion(): Promise<number> {
  const { data, error } = await getSupabase()
    .from('content_table_versions')
    .select('version')
    .eq('table_name', 'picture_words')
    .maybeSingle()
  if (error) throw error
  const version = data?.version
  if (typeof version !== 'number' || !Number.isFinite(version)) {
    throw new Error('picture_words version missing')
  }
  return version
}

export async function fetchAllPictureWordRows(): Promise<PictureWordRow[]> {
  const rows: PictureWordRow[] = []
  let from = 0
  for (;;) {
    const to = from + PAGE_SIZE - 1
    const { data, error } = await getSupabase()
      .from('picture_words')
      .select(
        'word,sort_order,word_level_id,word_audio,image_file,accent,mean_cn,mean_en,sentence_phrase,sentence,sentence_trans,sentence_audio',
      )
      .order('sort_order', { ascending: true })
      .range(from, to)
    if (error) throw error
    const page = (data ?? []) as PictureWordRow[]
    rows.push(...page)
    if (page.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  return rows
}

async function loadFresh(deps: EnsurePictureWordsDeps): Promise<void> {
  const fetchVersion = deps.fetchVersion ?? fetchPictureWordsVersion
  const fetchAllRows = deps.fetchAllRows ?? fetchAllPictureWordRows
  const writeCached = deps.writeCached ?? writeCachedPictureWords
  const [version, rows] = await Promise.all([fetchVersion(), fetchAllRows()])
  hydratePictureWords(version, rows)
  await writeCached({ version, rows })
}

async function refreshIfStale(deps: EnsurePictureWordsDeps): Promise<void> {
  if (!memory || refreshPromise) return
  refreshPromise = (async () => {
    try {
      const fetchVersion = deps.fetchVersion ?? fetchPictureWordsVersion
      const remoteVersion = await fetchVersion()
      if (!memory || remoteVersion === memory.version) return
      await loadFresh(deps)
    } catch {
      // Keep serving the in-memory catalog if background sync fails.
    } finally {
      refreshPromise = null
    }
  })()
  await refreshPromise
}

export async function ensurePictureWordsReady(
  deps: EnsurePictureWordsDeps = {},
): Promise<void> {
  if (memory) {
    void refreshIfStale(deps)
    return
  }
  if (ensurePromise) return ensurePromise

  ensurePromise = (async () => {
    const readCached = deps.readCached ?? readCachedPictureWords
    const writeCached = deps.writeCached ?? writeCachedPictureWords
    const fetchVersion = deps.fetchVersion ?? fetchPictureWordsVersion
    const fetchAllRows = deps.fetchAllRows ?? fetchAllPictureWordRows

    const cached = await readCached()
    if (cached && cached.rows.length > 0) {
      hydratePictureWords(cached.version, cached.rows)
      // Serve local catalog immediately; refresh in background if version drifted.
      void refreshIfStale({ readCached, writeCached, fetchVersion, fetchAllRows })
      return
    }

    await loadFresh({ readCached, writeCached, fetchVersion, fetchAllRows })
  })().finally(() => {
    ensurePromise = null
  })

  return ensurePromise
}

export function __resetPictureWordsCacheForTests() {
  memory = null
  ensurePromise = null
  refreshPromise = null
}
