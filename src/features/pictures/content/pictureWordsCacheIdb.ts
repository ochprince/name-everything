import type { PictureWordRow } from '../mapPictureWord'

export type CachedPictureWords = {
  version: number
  rows: PictureWordRow[]
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
      return cache
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
