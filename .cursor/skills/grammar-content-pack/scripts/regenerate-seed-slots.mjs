#!/usr/bin/env node
/**
 * Regenerate the sentence_slots INSERT block inside supabase seed SQL files
 * from the (already re-ordered) local sentence_slots.json.
 * Replaces between "INSERT INTO sentence_slots" and the terminating ";"
 * keeping the rest of the file untouched.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '../../../../')
const CONTENT_DIR = join(REPO_ROOT, 'src/features/grammar/content')

const slots = JSON.parse(
  readFileSync(join(CONTENT_DIR, 'sentence_slots.json'), 'utf8'),
)

// keep JSON order (file is already ordered by sentence appearance); emit SQL rows
const rows = slots
  .map(
    (slot) =>
      `  ('${slot.id}', '${slot.sentence_id}', ${slot.slot_index}, '${slot.role}', '${slot.correct}', '${JSON.stringify(slot.distractors)}'::jsonb),`,
  )
  .join('\n')

// drop trailing comma on last row
const block = `INSERT INTO sentence_slots (id, sentence_id, slot_index, role, correct, distractors) VALUES\n${rows.replace(/,\s*$/, '')};`

const targets = [
  join(REPO_ROOT, 'supabase/seed.sql'),
  join(REPO_ROOT, 'supabase/migrations/20260823100001_grammar_content_seed.sql'),
]

for (const path of targets) {
  const sql = readFileSync(path, 'utf8')
  const startIdx = sql.indexOf('INSERT INTO sentence_slots')
  if (startIdx === -1) {
    console.error(`SKIP ${path}: no sentence_slots INSERT found`)
    continue
  }
  const endIdx = sql.indexOf(';', startIdx) + 1
  const before = sql.slice(0, startIdx)
  const after = sql.slice(endIdx)
  writeFileSync(path, before + block + '\n' + after.trimStart())
  console.log(`UPDATED ${path} (${slots.length} slot rows)`)
}
