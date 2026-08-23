#!/usr/bin/env node
/**
 * Re-order sentence_slots so slot_index follows the order the component
 * appears in the original sentence (en.indexOf(correct) ascending).
 * Also renumbers the "-slot-N" suffix in each slot id to match.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = join(__dirname, '../../../../src/features/grammar/content')

const sentences = JSON.parse(
  readFileSync(join(CONTENT_DIR, 'sentences.json'), 'utf8'),
)
const slots = JSON.parse(
  readFileSync(join(CONTENT_DIR, 'sentence_slots.json'), 'utf8'),
)

const sentenceById = new Map(sentences.map((s) => [s.id, s]))
const slotsBySentence = new Map()
for (const slot of slots) {
  const list = slotsBySentence.get(slot.sentence_id) ?? []
  list.push(slot)
  slotsBySentence.set(slot.sentence_id, list)
}

let moved = 0
for (const [sentenceId, list] of slotsBySentence) {
  const en = sentenceById.get(sentenceId)?.en ?? ''
  const ordered = [...list].sort((a, b) => {
    const pa = en.indexOf(a.correct)
    const pb = en.indexOf(b.correct)
    if (pa !== pb) return pa - pb
    return a.slot_index - b.slot_index
  })
  ordered.forEach((slot, i) => {
    const newId = `${sentenceId}-slot-${i}`
    if (slot.slot_index !== i || slot.id !== newId) {
      moved += 1
      console.log(
        `  ${sentenceId}: "${slot.correct}" @${en.indexOf(slot.correct)}  slot_index ${slot.slot_index}->${i}  id ${slot.id}->${newId}`,
      )
    }
    slot.slot_index = i
    slot.id = newId
  })
}

writeFileSync(
  join(CONTENT_DIR, 'sentence_slots.json'),
  JSON.stringify(slots, null, 2) + '\n',
)
console.log(`\nRe-ordered ${moved} slot entries across ${slotsBySentence.size} sentences`)
