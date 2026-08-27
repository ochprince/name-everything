#!/usr/bin/env node
/**
 * Upload CET4 word JSON from sibling my_app into Supabase picture_words.
 * Does not write local card JSON. Requires service role (RLS is read-only for anon).
 *
 * Usage (repo root):
 *   node scripts/upload-picture-words.mjs
 *   node scripts/upload-picture-words.mjs --replace
 *
 * Rows with ai_corrected=true are skipped (content and flag kept).
 * --replace deletes only ai_corrected=false rows.
 *
 * Env (.env.local or shell):
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   optional: PICTURE_WORDS_SOURCE_DIR
 */

import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assignSortOrders,
  excludeAiCorrected,
} from './pictureWordsUpload.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..')
const DEFAULT_SOURCE = join(
  REPO_ROOT,
  '..',
  'my_app',
  'assets',
  'data',
  'words',
  'cet4-all',
)
const SHUFFLE_SEED = 'cet4-401'
const PAGE = 100

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

function mulberry32(seed) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function seedToUint32(seed) {
  const hex = createHash('sha256').update(seed).digest('hex').slice(0, 8)
  return Number.parseInt(hex, 16) >>> 0
}

/** Deterministic shuffle (Fisher–Yates). */
export function seededShuffle(items, seed = SHUFFLE_SEED) {
  const rng = mulberry32(seedToUint32(seed))
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function supabaseConfig() {
  const url = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ''
  ).replace(/\/$/, '')
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    ''
  if (!url || !key) {
    throw new Error(
      'Missing env. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (service role required for upsert).',
    )
  }
  return { url, key }
}

function readSourceRows(sourceDir) {
  const files = readdirSync(sourceDir).filter((name) => name.endsWith('.json'))
  if (files.length === 0) {
    throw new Error(`No JSON files in ${sourceDir}`)
  }
  const rows = files.map((name) => {
    const raw = JSON.parse(readFileSync(join(sourceDir, name), 'utf8'))
    const word = String(raw.word || '').trim()
    if (!word) throw new Error(`Missing word in ${name}`)
    return {
      word,
      word_level_id: String(raw.word_level_id ?? ''),
      word_audio: String(raw.word_audio ?? ''),
      image_file: String(raw.image_file ?? ''),
      accent: raw.accent != null ? String(raw.accent) : null,
      mean_cn: raw.mean_cn != null ? String(raw.mean_cn) : null,
      mean_en: raw.mean_en != null ? String(raw.mean_en) : null,
      sentence_phrase:
        raw.sentence_phrase != null ? String(raw.sentence_phrase) : null,
      sentence: String(raw.sentence ?? '')
        .replace(/\\u0027/g, "'")
        .replace(/\\'/g, "'"),
      sentence_trans:
        raw.sentence_trans != null ? String(raw.sentence_trans) : null,
      sentence_audio: String(raw.sentence_audio ?? ''),
    }
  })

  for (const row of rows) {
    if (!row.word_level_id) throw new Error(`Missing word_level_id for ${row.word}`)
    if (!row.word_audio) throw new Error(`Missing word_audio for ${row.word}`)
    if (!row.image_file) throw new Error(`Missing image_file for ${row.word}`)
    if (!row.sentence) throw new Error(`Missing sentence for ${row.word}`)
    if (!row.sentence_audio) {
      throw new Error(`Missing sentence_audio for ${row.word}`)
    }
  }

  return seededShuffle(rows)
}

async function fetchAiCorrected(url, key) {
  const rows = []
  let from = 0
  for (;;) {
    const to = from + PAGE - 1
    const res = await fetch(
      `${url}/rest/v1/picture_words?ai_corrected=eq.true&select=word,sort_order&order=sort_order.asc`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Range: `${from}-${to}`,
        },
      },
    )
    if (!res.ok) {
      const text = await res.text()
      throw new Error(
        `Fetch ai_corrected failed: HTTP ${res.status} ${text.slice(0, 500)}`,
      )
    }
    const page = await res.json()
    if (!Array.isArray(page)) {
      throw new Error('Fetch ai_corrected: expected an array')
    }
    rows.push(...page)
    if (page.length < PAGE) break
    from += PAGE
  }
  return rows
}

async function deleteUncorrected(url, key) {
  const res = await fetch(`${url}/rest/v1/picture_words?ai_corrected=eq.false`, {
    method: 'DELETE',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'return=minimal',
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Delete failed: HTTP ${res.status} ${text.slice(0, 500)}`)
  }
}

async function upsertAll(url, key, rows) {
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=minimal',
  }

  for (let i = 0; i < rows.length; i += PAGE) {
    const chunk = rows.slice(i, i + PAGE)
    const endpoint = `${url}/rest/v1/picture_words?on_conflict=word`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(chunk),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(
        `Upsert failed at ${i}: HTTP ${res.status} ${text.slice(0, 500)}`,
      )
    }
    console.log(`Upserted ${Math.min(i + PAGE, rows.length)} / ${rows.length}`)
  }
}

async function main() {
  const replace = process.argv.includes('--replace')
  const sourceDir = process.env.PICTURE_WORDS_SOURCE_DIR || DEFAULT_SOURCE
  if (!existsSync(sourceDir)) {
    throw new Error(`Source dir not found: ${sourceDir}`)
  }
  const { url, key } = supabaseConfig()
  const sourceRows = readSourceRows(sourceDir)
  const corrected = await fetchAiCorrected(url, key)
  const skippedWords = corrected.map((row) => row.word)
  const reservedOrders = corrected.map((row) => row.sort_order)
  const rows = assignSortOrders(
    excludeAiCorrected(sourceRows, skippedWords),
    reservedOrders,
  )
  console.log(
    `Prepared ${sourceRows.length} source rows; uploading ${rows.length} (skipped ${skippedWords.length} ai_corrected); seed=${SHUFFLE_SEED}; ${url}`,
  )
  if (replace) {
    console.log('Deleting picture_words where ai_corrected is false…')
    await deleteUncorrected(url, key)
  }
  await upsertAll(url, key, rows)
  console.log('Done.')
}

const isDirectRun =
  Boolean(process.argv[1]) &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])

if (isDirectRun) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
