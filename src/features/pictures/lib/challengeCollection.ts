import { useSyncExternalStore } from 'react'

const KEY = 'name-everything/challenge-words/v1'

const listeners = new Set<() => void>()

let rawCache: string | null = null
let wordsCache: string[] = []

function emit() {
  listeners.forEach((listener) => listener())
}

function parse(raw: string | null): string[] {
  if (!raw) return []
  try {
    const value = JSON.parse(raw) as unknown
    if (!Array.isArray(value)) return []
    return value.filter((word): word is string => typeof word === 'string' && word.length > 0)
  } catch {
    return []
  }
}

function read(): string[] {
  const raw = localStorage.getItem(KEY)
  if (raw === rawCache) return wordsCache
  rawCache = raw
  wordsCache = parse(raw)
  return wordsCache
}

function write(words: string[]) {
  const next = [...words]
  localStorage.setItem(KEY, JSON.stringify(next))
  rawCache = JSON.stringify(next)
  wordsCache = next
  emit()
}

export function loadChallengeWords(): string[] {
  return read()
}

export function hasChallengeWord(word: string): boolean {
  return read().includes(word)
}

export function addChallengeWord(word: string) {
  const trimmed = word.trim()
  if (!trimmed) return
  const next = [trimmed, ...read().filter((item) => item !== trimmed)]
  write(next)
}

export function removeChallengeWord(word: string) {
  write(read().filter((item) => item !== word))
}

/** @returns true when the word is in the collection after the toggle */
export function toggleChallengeWord(word: string): boolean {
  if (hasChallengeWord(word)) {
    removeChallengeWord(word)
    return false
  }
  addChallengeWord(word)
  return true
}

export function clearChallengeWords() {
  localStorage.removeItem(KEY)
  rawCache = null
  wordsCache = []
  emit()
}

export function challengeWordCount(): number {
  return read().length
}

export function useChallengeWords(): string[] {
  return useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange)
      return () => {
        listeners.delete(onStoreChange)
      }
    },
    () => {
      read()
      return wordsCache
    },
    () => wordsCache,
  )
}
