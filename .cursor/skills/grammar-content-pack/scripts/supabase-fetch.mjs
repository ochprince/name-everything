#!/usr/bin/env node
/**
 * Shared Supabase Data API helpers for grammar pack validators.
 * Loads URL + publishable key from env / .env.local and retries on transient errors.
 */

import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '../../../../')

function loadDotEnvLocal() {
  const path = join(REPO_ROOT, '.env.local')
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
}

loadDotEnvLocal()

export function supabaseConfig() {
  const url = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ''
  ).replace(/\/$/, '')
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    ''
  if (!url || !key) {
    throw new Error(
      'Missing Supabase env. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (e.g. in .env.local).',
    )
  }
  return { url, key }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryable(status, body) {
  if (status === 404 || status === 408 || status === 425 || status === 429) return true
  if (status >= 500) return true
  if (typeof body === 'string' && /schema cache|PGRST205|PGRST002/i.test(body)) return true
  return false
}

/**
 * Fetch all rows from a public table (paginated). Retries on schema-cache / network blips.
 */
export async function fetchTable(table, { retries = 8, delayMs = 2000 } = {}) {
  const { url, key } = supabaseConfig()
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: 'application/json',
  }

  let lastError
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const rows = []
      let from = 0
      const pageSize = 1000
      for (;;) {
        const endpoint = `${url}/rest/v1/${table}?select=*&offset=${from}&limit=${pageSize}`
        const res = await fetch(endpoint, { headers })
        const text = await res.text()
        if (!res.ok) {
          if (isRetryable(res.status, text) && attempt < retries) {
            lastError = new Error(`${table}: HTTP ${res.status} ${text}`)
            await sleep(delayMs * attempt)
            break
          }
          throw new Error(`${table}: HTTP ${res.status} ${text}`)
        }
        const page = JSON.parse(text)
        if (!Array.isArray(page)) throw new Error(`${table}: expected array`)
        rows.push(...page)
        if (page.length < pageSize) return rows
        from += pageSize
      }
      if (lastError && attempt === retries) throw lastError
    } catch (err) {
      lastError = err
      if (attempt >= retries) throw err
      await sleep(delayMs * attempt)
    }
  }
  throw lastError ?? new Error(`${table}: fetch failed`)
}

export async function fetchGrammarPack() {
  const [
    chapters,
    grammar_points,
    levels,
    sentences,
    sentence_spans,
    sentence_slots,
  ] = await Promise.all([
    fetchTable('chapters'),
    fetchTable('grammar_points'),
    fetchTable('levels'),
    fetchTable('sentences'),
    fetchTable('sentence_spans'),
    fetchTable('sentence_slots'),
  ])
  return {
    chapters,
    grammar_points,
    levels,
    sentences,
    sentence_spans: sentence_spans.map((row) => ({
      ...row,
      end: row.end ?? row.End,
    })),
    sentence_slots: sentence_slots.map((row) => ({
      ...row,
      distractors: Array.isArray(row.distractors)
        ? row.distractors
        : JSON.parse(row.distractors),
    })),
  }
}
