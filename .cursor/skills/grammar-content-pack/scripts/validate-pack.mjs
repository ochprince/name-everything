#!/usr/bin/env node
/**
 * Validate Grammar Everything content pack JSON:
 * - unique ids per table
 * - foreign keys
 * - pack invariants (anchor/playables/slots/spans)
 * - span offsets match sentence.en slices
 *
 * Usage (repo root):
 *   node .cursor/skills/grammar-content-pack/scripts/validate-pack.mjs
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = join(__dirname, '../../../../src/features/grammar/content')

function loadJson(name) {
  const path = join(CONTENT_DIR, name)
  return JSON.parse(readFileSync(path, 'utf8'))
}

const errors = []
const warnings = []

function err(msg) {
  errors.push(msg)
}

function warn(msg) {
  warnings.push(msg)
}

function assertUniqueIds(items, label, idKey = 'id') {
  const seen = new Map()
  for (const item of items) {
    const id = item[idKey]
    if (seen.has(id)) {
      err(`${label}: duplicate id "${id}" (also used earlier)`)
    } else {
      seen.set(id, item)
    }
  }
  return seen
}

function main() {
  const chapters = loadJson('chapters.json')
  const levels = loadJson('levels.json')
  const grammarPoints = loadJson('grammar_points.json')
  const sentences = loadJson('sentences.json')
  const sentenceSpans = loadJson('sentence_spans.json')
  const sentenceSlots = loadJson('sentence_slots.json')

  const chapterIds = assertUniqueIds(chapters, 'chapters')
  const levelIds = assertUniqueIds(levels, 'levels')
  const pointIds = assertUniqueIds(grammarPoints, 'grammar_points')
  const sentenceIds = assertUniqueIds(sentences, 'sentences')
  assertUniqueIds(sentenceSpans, 'sentence_spans')
  assertUniqueIds(sentenceSlots, 'sentence_slots')

  // chapters.sort_order unique
  const chapterOrders = new Set()
  for (const ch of chapters) {
    if (chapterOrders.has(ch.sort_order)) {
      err(`chapters: duplicate sort_order ${ch.sort_order}`)
    }
    chapterOrders.add(ch.sort_order)
    if (typeof ch.released !== 'boolean') {
      err(`chapters: "${ch.id}" missing boolean released`)
    }
  }

  // FK: levels
  const levelsByChapter = new Map()
  for (const level of levels) {
    if (!chapterIds.has(level.chapter_id)) {
      err(`levels: "${level.id}" unknown chapter_id "${level.chapter_id}"`)
    }
    if (!pointIds.has(level.grammar_point_id)) {
      err(`levels: "${level.id}" unknown grammar_point_id "${level.grammar_point_id}"`)
    }
    if (!levelsByChapter.has(level.chapter_id)) {
      levelsByChapter.set(level.chapter_id, [])
    }
    levelsByChapter.get(level.chapter_id).push(level)
  }

  // FK: sentences
  const sentencesByLevel = new Map()
  for (const sentence of sentences) {
    if (!levelIds.has(sentence.level_id)) {
      err(`sentences: "${sentence.id}" unknown level_id "${sentence.level_id}"`)
    }
    if (!['anchor', 'playable'].includes(sentence.kind)) {
      err(`sentences: "${sentence.id}" invalid kind "${sentence.kind}"`)
    }
    if (!sentence.en || typeof sentence.en !== 'string') {
      err(`sentences: "${sentence.id}" missing en`)
    }
    if (!sentencesByLevel.has(sentence.level_id)) {
      sentencesByLevel.set(sentence.level_id, [])
    }
    sentencesByLevel.get(sentence.level_id).push(sentence)
  }

  // FK: spans
  const playableIds = new Set(
    sentences.filter((s) => s.kind === 'playable').map((s) => s.id),
  )
  for (const span of sentenceSpans) {
    if (!sentenceIds.has(span.sentence_id)) {
      err(`sentence_spans: "${span.id}" unknown sentence_id "${span.sentence_id}"`)
    } else if (playableIds.has(span.sentence_id)) {
      err(
        `sentence_spans: "${span.id}" targets playable "${span.sentence_id}" — spans are anchor-only`,
      )
    }
    if (!pointIds.has(span.grammar_point_id)) {
      err(
        `sentence_spans: "${span.id}" unknown grammar_point_id "${span.grammar_point_id}"`,
      )
    }
    if (typeof span.start !== 'number' || typeof span.end !== 'number') {
      err(`sentence_spans: "${span.id}" start/end must be numbers`)
    } else if (span.start < 0 || span.end <= span.start) {
      err(`sentence_spans: "${span.id}" invalid range [${span.start}, ${span.end})`)
    }
  }

  // FK: slots
  for (const slot of sentenceSlots) {
    if (!sentenceIds.has(slot.sentence_id)) {
      err(`sentence_slots: "${slot.id}" unknown sentence_id "${slot.sentence_id}"`)
    }
    if (!Array.isArray(slot.distractors)) {
      err(`sentence_slots: "${slot.id}" distractors must be an array`)
    }
    if (slot.correct === undefined || slot.correct === '') {
      err(`sentence_slots: "${slot.id}" missing correct`)
    }
  }

  // Per-level invariants
  for (const [levelId, levelSentences] of sentencesByLevel) {
    const anchors = levelSentences.filter((s) => s.kind === 'anchor')
    const playables = levelSentences.filter((s) => s.kind === 'playable')

    if (anchors.length !== 1) {
      err(
        `level "${levelId}": expected exactly 1 anchor, found ${anchors.length}`,
      )
    }

    if (playables.length < 3) {
      err(
        `level "${levelId}": expected at least 3 playables, found ${playables.length}`,
      )
    }

    const anchor = anchors[0]
    if (anchor) {
      for (const p of playables) {
        if (p.en === anchor.en) {
          err(
            `level "${levelId}": playable "${p.id}" en equals anchor en`,
          )
        }
      }

      const anchorSpans = sentenceSpans.filter((sp) => sp.sentence_id === anchor.id)
      if (anchorSpans.length === 0) {
        err(`level "${levelId}": anchor "${anchor.id}" has no sentence_spans`)
      }
    }

    const enSet = new Set()
    for (const s of levelSentences) {
      if (enSet.has(s.en)) {
        warn(`level "${levelId}": duplicate en text on sentence "${s.id}"`)
      }
      enSet.add(s.en)
    }
  }

  // Released chapter invariants (mirrors pack.test.ts)
  const releasedChapters = chapters.filter((c) => c.released)
  if (releasedChapters.length === 0) {
    err('chapters: at least one chapter must be released')
  }
  for (const ch of releasedChapters) {
    const chLevels = levelsByChapter.get(ch.id) ?? []
    if (chLevels.length < 1) {
      err(`released chapter "${ch.id}": need at least 1 level, found ${chLevels.length}`)
    }
  }

  // Span offset checks
  const sentenceById = new Map(sentences.map((s) => [s.id, s]))
  for (const span of sentenceSpans) {
    const sentence = sentenceById.get(span.sentence_id)
    if (!sentence) continue
    const { en } = sentence
    if (span.end > en.length) {
      err(
        `sentence_spans: "${span.id}" end ${span.end} exceeds en length ${en.length} (${sentence.id})`,
      )
    }
    const slice = en.slice(span.start, span.end)
    if (slice.length === 0) {
      err(`sentence_spans: "${span.id}" empty slice on "${sentence.id}"`)
    }
  }

  // Slot coverage + correct text in en
  for (const sentence of sentences) {
    const slots = sentenceSlots
      .filter((s) => s.sentence_id === sentence.id)
      .sort((a, b) => a.slot_index - b.slot_index)

    if (slots.length === 0) {
      err(`sentences: "${sentence.id}" has no sentence_slots`)
      continue
    }

    slots.forEach((slot, i) => {
      if (slot.slot_index !== i) {
        err(
          `sentence_slots: "${sentence.id}" slot_index gap — expected ${i}, got ${slot.slot_index} on "${slot.id}"`,
        )
      }
      if (!sentence.en.includes(slot.correct)) {
        err(
          `sentence_slots: "${slot.id}" correct "${slot.correct}" not found in en of "${sentence.id}"`,
        )
      }
      for (const d of slot.distractors) {
        if (d === slot.correct) {
          err(`sentence_slots: "${slot.id}" distractor equals correct "${d}"`)
        }
      }
    })
  }

  // Report
  console.log('Grammar pack validation')
  console.log(`  content: ${CONTENT_DIR}`)
  console.log(`  chapters: ${chapters.length}`)
  console.log(`  levels: ${levels.length}`)
  console.log(`  grammar_points: ${grammarPoints.length}`)
  console.log(`  sentences: ${sentences.length}`)
  console.log(`  sentence_spans: ${sentenceSpans.length}`)
  console.log(`  sentence_slots: ${sentenceSlots.length}`)
  console.log('')

  if (warnings.length) {
    console.log(`Warnings (${warnings.length}):`)
    for (const w of warnings) console.log(`  ⚠ ${w}`)
    console.log('')
  }

  if (errors.length) {
    console.error(`Errors (${errors.length}):`)
    for (const e of errors) console.error(`  ✗ ${e}`)
    process.exit(1)
  }

  console.log('OK — no errors')
  process.exit(0)
}

main()
