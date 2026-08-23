#!/usr/bin/env node
/** 验证新 migration（done vs past）：LTR 语序 / 全词覆盖 / swallow / 复用与 id 冲突 */
import { readFileSync } from 'node:fs'
const CONTENT = 'src/features/grammar/content'

const sentences = JSON.parse(readFileSync(`${CONTENT}/sentences.json`, 'utf8'))
const flatSlots = JSON.parse(readFileSync(`${CONTENT}/sentence_slots.json`, 'utf8'))
const spans = JSON.parse(readFileSync(`${CONTENT}/sentence_spans.json`, 'utf8'))
const points = JSON.parse(readFileSync(`${CONTENT}/grammar_points.json`, 'utf8'))
const levels = JSON.parse(readFileSync(`${CONTENT}/levels.json`, 'utf8'))

const existingDefs = new Map()
for (const sl of flatSlots) {
  const key = JSON.stringify([sl.role, sl.correct, sl.distractors])
  existingDefs.set(key, (existingDefs.get(key) ?? 0) + 1)
}
function defExists(role, correct, distractors) {
  return existingDefs.has(JSON.stringify([role, correct, distractors]))
}

const errors = []
const usedSentenceIds = new Set(sentences.map((s) => s.id))
const usedSpanIds = new Set(spans.map((s) => s.id))
const usedPointIds = new Set(points.map((p) => p.id))

// ===== 新内容定义 =====
const newPoint = {
  id: 'gp-done-vs-past',
  title_zh: 'done 过去分词 ≠ 过去式',
  body_zh: 'ended 拼写既是过去式也是过去分词。The meeting ended. 单句没有别的谓语，ended 是过去式谓语；The meeting ended, we left. 里主句谓语是 left，ended 就是过去分词非谓语。区分方法：逗号前后先找主句谓语，有主句谓语就是分词，没有就是过去式。',
}
const newSpan = { id: 'sp-nf-done-vs-past', sentence_id: 's-nf-anchor', grammar_point_id: 'gp-done-vs-past', start: 52, end: 59 }

const newSentences = [
  { id: 's-nf1-p14', en: 'The meeting ended.', zh: '会议结束了。' },
  { id: 's-nf1-p15', en: 'The meeting ended, we left.', zh: '会议结束后，我们离开了。' },
  { id: 's-nf1-p16', en: 'The work finished, they went home.', zh: '工作完成后，他们回家了。' },
  { id: 's-nf1-p17', en: 'The book closed, she slept.', zh: '书合上后，她睡着了。' },
]

const newSlots = [
  { id: 'sl-s-the-meeting', role: 'S', correct: 'The meeting', distractors: ['A meeting', 'The meetings', 'This meeting'] },
  { id: 'sl-v-ended', role: 'V', correct: 'ended', distractors: ['end', 'ends', 'ending'] },
  { id: 'sl-pp-p-ended', role: 'PP-P', correct: 'ended', distractors: ['was ended', 'ending', 'end'] },
  { id: 'sl-s-we-2', role: 'S', correct: 'we', distractors: ['us', 'our', 'they'] },
  { id: 'sl-v-left', role: 'V', correct: 'left', distractors: ['leave', 'leaves', 'leaving'] },
  { id: 'sl-s-the-work', role: 'S', correct: 'The work', distractors: ['A work', 'Works', 'The works'] },
  { id: 'sl-pp-p-finished', role: 'PP-P', correct: 'finished', distractors: ['was finished', 'finishing', 'finish'] },
  { id: 'sl-a-home', role: 'A', correct: 'home', distractors: ['to home', 'the home', 'homes'] },
  { id: 'sl-s-the-book', role: 'S', correct: 'The book', distractors: ['A book', 'Books', 'The books'] },
  { id: 'sl-pp-p-closed', role: 'PP-P', correct: 'closed', distractors: ['was closed', 'closing', 'close'] },
  { id: 'sl-v-slept', role: 'V', correct: 'slept', distractors: ['sleep', 'sleeps', 'sleeping'] },
]

// 复用的现有 slot ids（从 seed/JSON 确认存在）
const reusedSlotIds = {
  'sl-s-they-3': ['S', 'they', ['them', 'we', 'she']],
  'sl-v-went': ['V', 'went', ['go', 'goes', 'going']],
  'sl-s-she-5': ['S', 'she', ['her', 'he', 'it']],
}

const refs = [
  ['s-nf1-p14', 'sl-s-the-meeting'], ['s-nf1-p14', 'sl-v-ended'],
  ['s-nf1-p15', 'sl-s-the-meeting'], ['s-nf1-p15', 'sl-pp-p-ended'], ['s-nf1-p15', 'sl-s-we-2'], ['s-nf1-p15', 'sl-v-left'],
  ['s-nf1-p16', 'sl-s-the-work'], ['s-nf1-p16', 'sl-pp-p-finished'], ['s-nf1-p16', 'sl-s-they-3'], ['s-nf1-p16', 'sl-v-went'], ['s-nf1-p16', 'sl-a-home'],
  ['s-nf1-p17', 'sl-s-the-book'], ['s-nf1-p17', 'sl-pp-p-closed'], ['s-nf1-p17', 'sl-s-she-5'], ['s-nf1-p17', 'sl-v-slept'],
]

// ===== 检查 =====
if (usedPointIds.has(newPoint.id)) errors.push(`grammar_point id conflict: ${newPoint.id}`)
if (usedSpanIds.has(newSpan.id)) errors.push(`span id conflict: ${newSpan.id}`)
for (const s of newSentences) {
  if (usedSentenceIds.has(s.id)) errors.push(`sentence id conflict: ${s.id}`)
  if (newSentences.filter((x) => x.id !== s.id && x.en === s.en).length > 0) errors.push(`duplicate en: ${s.id}`)
  // level 存在性
  if (!levels.some((l) => l.id === 'nonfinite-1')) errors.push('level nonfinite-1 missing')
}
const anchor = sentences.find((s) => s.id === newSpan.sentence_id)
if (!anchor) errors.push('anchor not found')
else if (anchor.en.slice(newSpan.start, newSpan.end) !== 'excited') {
  errors.push(`span slice mismatch: got "${anchor.en.slice(newSpan.start, newSpan.end)}" want "excited"`)
}

const slotById = new Map(
  Object.entries(reusedSlotIds).map(([id, [role, correct, distractors]]) => [id, { role, correct, distractors }]),
)
for (const sl of newSlots) {
  if (slotById.has(sl.id)) errors.push(`new slot id already reused: ${sl.id}`)
  slotById.set(sl.id, sl)
  if (defExists(sl.role, sl.correct, sl.distractors)) {
    errors.push(`new slot ${sl.id} duplicates existing definition (should reuse instead)`)
  }
  if (sl.distractors.includes(sl.correct)) errors.push(`slot ${sl.id}: distractor equals correct`)
}

for (const s of newSentences) {
  const list = refs.filter(([sid]) => sid === s.id)
  if (list.length === 0) errors.push(`${s.id}: no refs`)
  let cursor = 0
  const covered = new Set()
  list.forEach(([, slotId], i) => {
    const sl = slotById.get(slotId)
    if (!sl) { errors.push(`${s.id}: unknown slot ${slotId}`); return }
    const idx = s.en.indexOf(sl.correct, cursor)
    if (idx < 0) {
      errors.push(`${s.id}: correct "${sl.correct}" not found after pos ${cursor} in "${s.en}"`)
      return
    }
    cursor = idx + sl.correct.length
    for (const w of s.en.slice(idx, cursor).split(/[^A-Za-z']+/)) if (w) covered.add(w.toLowerCase())
    if (i + 1 < list.length) {
      const next = slotById.get(list[i + 1][1])
      for (const d of sl.distractors) {
        if (d === `${sl.correct} ${next.correct}` || d.endsWith(` ${next.correct}`)) {
          errors.push(`${s.id}#${i}: distractor "${d}" swallows next correct "${next.correct}"`)
        }
      }
    }
  })
  const words = new Set(s.en.toLowerCase().match(/[a-z']+/g))
  const missing = [...words].filter((w) => !covered.has(w))
  if (missing.length) errors.push(`${s.id}: uncovered words: ${missing.join(', ')}`)
}

console.log(
  errors.length
    ? `✗ ERRORS (${errors.length}):\n  ` + errors.join('\n  ')
    : `✓ ALL CHECKS PASSED — ${newSentences.length} sentences, ${newSlots.length} new slots, ${refs.length} refs, LTR/coverage/swallow/id all clean`,
)
