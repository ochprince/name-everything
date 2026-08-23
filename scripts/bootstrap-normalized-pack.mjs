#!/usr/bin/env node
/**
 * One-time bootstrap: flatten JSON pack → normalized slots + sentence_slot_refs SQL.
 * After baseline ships, authoring is SQL-only (do not re-run against edited JSON).
 *
 * Usage:
 *   node scripts/bootstrap-normalized-pack.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CONTENT = join(ROOT, 'src/features/grammar/content')
const MIG = join(ROOT, 'supabase/migrations')

function load(name) {
  return JSON.parse(readFileSync(join(CONTENT, `${name}.json`), 'utf8'))
}

function sqlStr(value) {
  if (value === null || value === undefined) return 'NULL'
  return `'${String(value).replace(/'/g, "''")}'`
}

function sqlBool(value) {
  return value ? 'true' : 'false'
}

function sqlJson(value) {
  return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`
}

function escapeReg(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function wordsOf(en) {
  const words = []
  const re = /[A-Za-z]+(?:'[A-Za-z]+)?/g
  let m
  while ((m = re.exec(en)) !== null) {
    words.push({ word: m[0], start: m.index, end: m.index + m[0].length })
  }
  return words
}

function covers(slotCorrect, word) {
  return new RegExp(`(^|[^A-Za-z'])${escapeReg(word)}($|[^A-Za-z'])`).test(slotCorrect)
}

function slugPart(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'x'
}

/** Apply known content fixes before normalize. */
function fixDistractors(correct, distractors) {
  let next = [...distractors]
  if (correct === 'must') {
    next = next.map((d) => (d === 'must be' ? 'should' : d))
  }
  // Drop distractors that equal correct
  next = next.filter((d) => d !== correct)
  return next
}

/**
 * Place slots in true left-to-right order by non-overlapping matches in en.
 */
function placeSlotsLtr(en, slots) {
  const remaining = [...slots]
  const placed = []
  const used = []

  while (remaining.length) {
    let best = null
    for (let i = 0; i < remaining.length; i++) {
      const slot = remaining[i]
      let from = 0
      while (from <= en.length) {
        const start = en.indexOf(slot.correct, from)
        if (start < 0) break
        const end = start + slot.correct.length
        const overlaps = used.some(([a, b]) => start < b && end > a)
        if (!overlaps) {
          if (!best || start < best.start) {
            best = { i, start, end, slot }
          }
          break
        }
        from = start + 1
      }
    }
    if (!best) {
      const left = remaining.map((s) => s.correct).join(' | ')
      return { error: `cannot place remaining corrects in "${en}": ${left}`, placed: null }
    }
    used.push([best.start, best.end])
    placed.push(best.slot)
    remaining.splice(best.i, 1)
  }
  return { error: null, placed }
}

function checkLtrOrder(en, slots) {
  let cursor = 0
  for (const slot of slots) {
    const idx = en.indexOf(slot.correct, cursor)
    if (idx < 0) {
      return `correct "${slot.correct}" not found in order after pos ${cursor} in "${en}"`
    }
    cursor = idx + slot.correct.length
  }
  return null
}

function checkCoverage(en, slots) {
  const words = wordsOf(en)
  const missing = words.filter((w) => !slots.some((s) => covers(s.correct, w.word)))
  return missing.map((m) => m.word)
}

const chapters = load('chapters')
const grammarPoints = load('grammar_points')
const levels = load('levels')
const sentences = load('sentences')
const sentenceSpans = load('sentence_spans')
const flatSlots = load('sentence_slots')
const gameTuning = load('game_tuning')

const sentenceById = new Map(sentences.map((s) => [s.id, s]))

// Fix + group flat rows by sentence
const bySentence = new Map()
for (const row of flatSlots) {
  const distractors = fixDistractors(row.correct, row.distractors)
  const fixed = { ...row, distractors }
  if (!bySentence.has(row.sentence_id)) bySentence.set(row.sentence_id, [])
  bySentence.get(row.sentence_id).push(fixed)
}
for (const [, list] of bySentence) {
  list.sort((a, b) => a.slot_index - b.slot_index)
}

const errors = []
const orderedBySentence = new Map()

for (const sentence of sentences) {
  const slots = bySentence.get(sentence.id) ?? []
  if (slots.length === 0) {
    errors.push(`${sentence.id}: no slots`)
    continue
  }

  const { error: placeErr, placed } = placeSlotsLtr(sentence.en, slots)
  if (placeErr) {
    errors.push(`${sentence.id}: ${placeErr}`)
    continue
  }

  const ordered = placed.map((slot, slot_index) => ({ ...slot, slot_index }))
  orderedBySentence.set(sentence.id, ordered)

  const missing = checkCoverage(sentence.en, ordered)
  if (missing.length) {
    errors.push(`${sentence.id}: uncovered words: ${missing.join(', ')}`)
  }
  const ltr = checkLtrOrder(sentence.en, ordered)
  if (ltr) errors.push(`${sentence.id}: LTR ${ltr}`)

  for (let i = 0; i < ordered.length - 1; i++) {
    const cur = ordered[i]
    const nxt = ordered[i + 1]
    const swallow = `${cur.correct} ${nxt.correct}`
    for (const d of cur.distractors) {
      if (d === swallow || (nxt.correct && d.endsWith(` ${nxt.correct}`))) {
        errors.push(
          `${sentence.id}#${i}: distractor "${d}" swallows next correct "${nxt.correct}"`,
        )
      }
    }
  }
}

if (errors.length) {
  console.error('Bootstrap validation failed:')
  for (const e of errors) console.error('  ✗', e)
  process.exit(1)
}

// Deduplicate slot definitions
const slotKeyToId = new Map()
const slots = []

function slotKey(role, correct, distractors) {
  return JSON.stringify([role, correct, distractors])
}

function allocSlotId(role, correct) {
  const base = `sl-${slugPart(role)}-${slugPart(correct)}`
  let id = base
  let n = 2
  while (slots.some((s) => s.id === id)) {
    id = `${base}-${n}`
    n += 1
  }
  return id
}

const refs = []

for (const sentence of sentences) {
  const list = orderedBySentence.get(sentence.id)
  for (const row of list) {
    const key = slotKey(row.role, row.correct, row.distractors)
    let slotId = slotKeyToId.get(key)
    if (!slotId) {
      slotId = allocSlotId(row.role, row.correct)
      slotKeyToId.set(key, slotId)
      slots.push({
        id: slotId,
        role: row.role,
        correct: row.correct,
        distractors: row.distractors,
      })
    }
    refs.push({
      sentence_id: sentence.id,
      slot_index: row.slot_index,
      slot_id: slotId,
    })
  }
}

const schemaSql = `-- Grammar Everything content schema (canonical)
-- Skills MUST read this file (or the same migration) for table shapes.
-- Do not infer schema from superseded / deleted migrations.

CREATE TABLE chapters (
  id TEXT PRIMARY KEY,
  title_zh TEXT NOT NULL,
  description_zh TEXT,
  sort_order INTEGER NOT NULL,
  released BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE grammar_points (
  id TEXT PRIMARY KEY,
  title_zh TEXT NOT NULL,
  body_zh TEXT NOT NULL
);

CREATE TABLE levels (
  id TEXT PRIMARY KEY,
  chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  grammar_point_id TEXT NOT NULL REFERENCES grammar_points(id) ON DELETE RESTRICT,
  pass_threshold INTEGER,
  lives INTEGER,
  fall_duration_ms INTEGER
);

CREATE TABLE sentences (
  id TEXT PRIMARY KEY,
  level_id TEXT NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('anchor', 'playable')),
  en TEXT NOT NULL,
  zh TEXT NOT NULL,
  prompt_kind TEXT NOT NULL CHECK (prompt_kind IN ('zh', 'image')),
  image_url TEXT,
  sort_order INTEGER NOT NULL
);

CREATE UNIQUE INDEX idx_sentences_one_anchor_per_level
  ON sentences(level_id) WHERE kind = 'anchor';

CREATE TABLE sentence_spans (
  id TEXT PRIMARY KEY,
  sentence_id TEXT NOT NULL REFERENCES sentences(id) ON DELETE CASCADE,
  grammar_point_id TEXT NOT NULL REFERENCES grammar_points(id) ON DELETE RESTRICT,
  start INTEGER NOT NULL,
  "end" INTEGER NOT NULL
);

-- Reusable slot definitions (role + correct + distractors)
CREATE TABLE slots (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  correct TEXT NOT NULL,
  distractors JSONB NOT NULL
);

-- Per-sentence ordered placement; slot_index is play order (= left-to-right in en)
CREATE TABLE sentence_slot_refs (
  sentence_id TEXT NOT NULL REFERENCES sentences(id) ON DELETE CASCADE,
  slot_index INTEGER NOT NULL,
  slot_id TEXT NOT NULL REFERENCES slots(id) ON DELETE RESTRICT,
  PRIMARY KEY (sentence_id, slot_index)
);

CREATE INDEX idx_sentence_slot_refs_slot_id ON sentence_slot_refs(slot_id);

CREATE TABLE game_tuning (
  key TEXT PRIMARY KEY,
  value DOUBLE PRECISION NOT NULL
);

CREATE TABLE asset_reports (
  id TEXT PRIMARY KEY,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('sentence', 'grammar_point', 'sentence_slot')),
  asset_id TEXT NOT NULL,
  level_id TEXT REFERENCES levels(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE grammar_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentence_spans ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentence_slot_refs ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_tuning ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chapters_public_read" ON chapters
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "grammar_points_public_read" ON grammar_points
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "levels_public_read" ON levels
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "sentences_public_read" ON sentences
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "sentence_spans_public_read" ON sentence_spans
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "slots_public_read" ON slots
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "sentence_slot_refs_public_read" ON sentence_slot_refs
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "game_tuning_public_read" ON game_tuning
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "asset_reports_public_insert" ON asset_reports
  FOR INSERT TO anon, authenticated WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON chapters, grammar_points, levels, sentences, sentence_spans, slots, sentence_slot_refs, game_tuning TO anon, authenticated;
GRANT INSERT ON asset_reports TO anon, authenticated;
`

function buildSeedBody() {
  const lines = [
    '-- Grammar Everything baseline seed (normalized slots + refs)',
    '-- Generated by scripts/bootstrap-normalized-pack.mjs — re-run only when re-baselining.',
    'BEGIN;',
    '',
    'TRUNCATE asset_reports, sentence_slot_refs, slots, sentence_spans, sentences, levels, grammar_points, chapters, game_tuning RESTART IDENTITY CASCADE;',
    '',
  ]

  lines.push('INSERT INTO chapters (id, title_zh, description_zh, sort_order, released) VALUES')
  lines.push(
    chapters
      .map(
        (row) =>
          `  (${sqlStr(row.id)}, ${sqlStr(row.title_zh)}, ${sqlStr(row.description_zh ?? null)}, ${row.sort_order}, ${sqlBool(row.released)})`,
      )
      .join(',\n') + ';',
  )
  lines.push('')

  lines.push('INSERT INTO grammar_points (id, title_zh, body_zh) VALUES')
  lines.push(
    grammarPoints
      .map((row) => `  (${sqlStr(row.id)}, ${sqlStr(row.title_zh)}, ${sqlStr(row.body_zh)})`)
      .join(',\n') + ';',
  )
  lines.push('')

  lines.push(
    'INSERT INTO levels (id, chapter_id, sort_order, grammar_point_id, pass_threshold, lives, fall_duration_ms) VALUES',
  )
  lines.push(
    levels
      .map(
        (row) =>
          `  (${sqlStr(row.id)}, ${sqlStr(row.chapter_id)}, ${row.sort_order}, ${sqlStr(row.grammar_point_id)}, ${row.pass_threshold ?? 'NULL'}, ${row.lives ?? 'NULL'}, ${row.fall_duration_ms ?? 'NULL'})`,
      )
      .join(',\n') + ';',
  )
  lines.push('')

  lines.push(
    'INSERT INTO sentences (id, level_id, kind, en, zh, prompt_kind, image_url, sort_order) VALUES',
  )
  lines.push(
    sentences
      .map(
        (row) =>
          `  (${sqlStr(row.id)}, ${sqlStr(row.level_id)}, ${sqlStr(row.kind)}, ${sqlStr(row.en)}, ${sqlStr(row.zh)}, ${sqlStr(row.prompt_kind)}, ${sqlStr(row.image_url ?? null)}, ${row.sort_order})`,
      )
      .join(',\n') + ';',
  )
  lines.push('')

  lines.push(
    'INSERT INTO sentence_spans (id, sentence_id, grammar_point_id, start, "end") VALUES',
  )
  lines.push(
    sentenceSpans
      .map(
        (row) =>
          `  (${sqlStr(row.id)}, ${sqlStr(row.sentence_id)}, ${sqlStr(row.grammar_point_id)}, ${row.start}, ${row.end})`,
      )
      .join(',\n') + ';',
  )
  lines.push('')

  lines.push('INSERT INTO slots (id, role, correct, distractors) VALUES')
  lines.push(
    slots
      .map(
        (row) =>
          `  (${sqlStr(row.id)}, ${sqlStr(row.role)}, ${sqlStr(row.correct)}, ${sqlJson(row.distractors)})`,
      )
      .join(',\n') + ';',
  )
  lines.push('')

  lines.push('INSERT INTO sentence_slot_refs (sentence_id, slot_index, slot_id) VALUES')
  lines.push(
    refs
      .map(
        (row) =>
          `  (${sqlStr(row.sentence_id)}, ${row.slot_index}, ${sqlStr(row.slot_id)})`,
      )
      .join(',\n') + ';',
  )
  lines.push('')

  const tuningRows = Object.entries(gameTuning)
  lines.push('INSERT INTO game_tuning (key, value) VALUES')
  lines.push(tuningRows.map(([key, value]) => `  (${sqlStr(key)}, ${value})`).join(',\n') + ';')
  lines.push('')
  lines.push('COMMIT;', '')
  return lines.join('\n')
}

mkdirSync(MIG, { recursive: true })

const schemaPath = join(MIG, '20260823140000_grammar_content.sql')
const seedPath = join(MIG, '20260823140001_grammar_content_seed.sql')
const seedCopy = join(ROOT, 'supabase/seed.sql')
const canonicalSchema = join(ROOT, 'supabase/schema.sql')

const seedBody = buildSeedBody()
writeFileSync(schemaPath, schemaSql, 'utf8')
writeFileSync(seedPath, seedBody, 'utf8')
writeFileSync(seedCopy, seedBody, 'utf8')
writeFileSync(canonicalSchema, schemaSql, 'utf8')
writeFileSync(join(CONTENT, 'schema.sql'), `-- Canonical copy: see supabase/schema.sql\n` + schemaSql, 'utf8')

console.log(`slots definitions: ${slots.length} (from ${flatSlots.length} flat rows)`)
console.log(`sentence_slot_refs: ${refs.length}`)
console.log(`Wrote ${schemaPath}`)
console.log(`Wrote ${seedPath}`)
console.log(`Wrote ${seedCopy}`)
console.log(`Wrote ${canonicalSchema}`)
