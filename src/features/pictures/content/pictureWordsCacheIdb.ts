import type { PictureWordRow } from './mapPictureWord'

export type CachedPictureWords = {
  version: number
  rows: PictureWordRow[]
  /** true=全量词库（loadFresh 写入）；false=仅增量批次合并（词汇记忆可用，按词查不可靠） */
  complete: boolean
}

const DB_NAME = 'name-everything-picture-words'
const DB_VERSION = 1
const STORE = 'catalog'

type CacheRecord = CachedPictureWords & { id: 'current' }

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

export async function readCachedPictureWords(): Promise<CachedPictureWords | null> {
  try {
    const db = await openDb()
    try {
      const tx = db.transaction(STORE, 'readonly')
      const row = await idbRequest(tx.objectStore(STORE).get('current'))
      if (!row) return null
      const { id: _id, ...cache } = row as CacheRecord
      if (!Array.isArray(cache.rows) || !Number.isFinite(cache.version)) return null
      // 旧缓存无 complete 字段：历史写入都是全量，视为 complete
      return { ...cache, complete: cache.complete !== false }
    } finally {
      db.close()
    }
  } catch {
    return null
  }
}

export async function writeCachedPictureWords(cache: CachedPictureWords): Promise<void> {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readwrite')
    await idbRequest(tx.objectStore(STORE).put({ id: 'current', ...cache }))
  } finally {
    db.close()
  }
}

/**
 * 把一批增量词条合并进 IDB 缓存（按 word 去重，complete 保持 false）。
 * 用于词汇记忆增量加载：重进同一批次不再联网。
 */
export async function mergeCachedPictureWords(rows: PictureWordRow[]): Promise<void> {
  if (rows.length === 0) return
  const existing = await readCachedPictureWords()
  const byWord = new Map<string, PictureWordRow>()
  if (existing) {
    for (const row of existing.rows) byWord.set(row.word, row)
    // 已是全量缓存则不再增量合并（避免稀释 complete 状态）
    if (existing.complete) return
  }
  for (const row of rows) byWord.set(row.word, row)
  await writeCachedPictureWords({
    version: existing?.version ?? 0,
    rows: [...byWord.values()],
    complete: false,
  })
}
