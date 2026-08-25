import type {
  CachedContentTables,
  CachedGrammarContent,
  ContentTableName,
  ContentTableVersions,
} from './contentCacheTypes'
import { CONTENT_TABLE_NAMES, emptyVersions } from './contentCacheTypes'

const DB_NAME = 'grammar-content-cache'
const DB_VERSION = 1
const STORE = 'pack'

type CacheRecord = CachedGrammarContent & { id: 'current' }

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error ?? new Error('indexedDB open failed'))
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
  })
}

function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('indexedDB request failed'))
  })
}

export async function readCachedGrammarContent(): Promise<CachedGrammarContent | null> {
  try {
    const db = await openDb()
    try {
      const tx = db.transaction(STORE, 'readonly')
      const row = await idbRequest(tx.objectStore(STORE).get('current'))
      if (!row) return null
      const { id: _id, ...cache } = row as CacheRecord
      return cache
    } finally {
      db.close()
    }
  } catch {
    return null
  }
}

export async function writeCachedGrammarContent(
  cache: CachedGrammarContent,
): Promise<void> {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readwrite')
    await idbRequest(tx.objectStore(STORE).put({ id: 'current', ...cache }))
  } finally {
    db.close()
  }
}

export function mergeCachedTables(
  previous: CachedContentTables | null,
  updates: Partial<CachedContentTables>,
): CachedContentTables {
  const base =
    previous ??
    ({
      chapters: [],
      grammar_points: [],
      levels: [],
      sentences: [],
      sentence_spans: [],
      slots: [],
      sentence_slot_refs: [],
      game_tuning: [],
    } satisfies CachedContentTables)

  const next = { ...base }
  for (const name of CONTENT_TABLE_NAMES) {
    const rows = updates[name]
    if (rows !== undefined) next[name] = rows
  }
  return next
}

export function mergeVersions(
  previous: ContentTableVersions | null,
  remote: ContentTableVersions,
  fetched: ContentTableName[],
): ContentTableVersions {
  const next = { ...(previous ?? emptyVersions()) }
  for (const name of fetched) {
    next[name] = remote[name]
  }
  return next
}
