#!/usr/bin/env node
/** 验证新 migration（ing vs progressive）：LTR 语序 / 全词覆盖 / swallow / 复用冲突 */
import { readFileSync } from 'node:fs'
const CONTENT = 'src/features/grammar/content'

const sentences = JSON.parse(readFileSync(`${CONTENT}/sentences.json`, 'utf8'))
const flatSlots = JSON.parse(readFileSync(`${CONTENT}/sentence_slots.json`, 'utf8'))
const spans = JSON.parse(readFileSync(`${CONTENT}/sentence_spans.json`, 'utf8'))
const points = JSON.parse(readFileSync(`${CONTENT}/grammar_points.json`, 'utf8'))

// 现有 slot 定义（role+correct+distractors -> 出现次数）用于查重
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
  id: 'gp-ing-vs-progressive',
  title_zh: 'doing 现在分词 ≠ 进行时谓语',
  body_zh: 'reading 是现在分词作非谓语；is reading 是进行时谓语。结构上区分：doing 前面有 am/is/are 就是进行时谓语（be+doing 一起作谓语），没有 be 就是现在分词。',
}
const newSpan = { id: 'sp-nf-ing-vs-prog', sentence_id: 's-nf-anchor', grammar_point_id: 'gp-ing-vs-progressive', start: 34, end: 41 }

const newSentences = [
  { id: 's-nf1-p10', en: 'She is reading a book, feeling happy.', zh: '她正在读书，感到开心。' },
  { id: 's-nf1-p11', en: 'He is watching TV, thinking about the test.', zh: '他正在看电视，想着考试。' },
  { id: 's-nf1-p12', en: 'They are playing basketball, laughing loudly.', zh: '他们正在打篮球，笑得很大声。' },
  { id: 's-nf1-p13', en: 'I am cooking dinner, listening to music.', zh: '我正在做晚饭，听着音乐。' },
]

// 复用现有 slot 定义（id 从 seed 抄）或新建（role+correct+distractors 三元组）
const newSlots = [
  { id: 'sl-v-is-reading', role: 'V', correct: 'is reading', distractors: ['reads', 'is read', 'reading'] },
  { id: 'sl-o-a-book', role: 'O', correct: 'a book', distractors: ['the book', 'books', 'an book'] },
  { id: 'sl-v-is-watching', role: 'V', correct: 'is watching', distractors: ['watches', 'is watched', 'watching'] },
  { id: 'sl-pp-a-thinking', role: 'PP-A', correct: 'thinking', distractors: ['to think', 'thought', 'thinks'] },
  { id: 'sl-a-about-the-test', role: 'A', correct: 'about the test', distractors: ['about tests', 'about a test', 'for the test'] },
  { id: 'sl-v-are-playing', role: 'V', correct: 'are playing', distractors: ['play', 'are played', 'playing'] },
  { id: 'sl-pp-a-laughing', role: 'PP-A', correct: 'laughing', distractors: ['to laugh', 'laughed', 'laughs'] },
  { id: 'sl-a-loudly', role: 'A', correct: 'loudly', distractors: ['loud', 'louder', 'loudness'] },
  { id: 'sl-v-am-cooking', role: 'V', correct: 'am cooking', distractors: ['cook', 'am cooked', 'cooking'] },
  { id: 'sl-o-dinner', role: 'O', correct: 'dinner', distractors: ['dinners', 'the dinner', 'a dinner'] },
  { id: 'sl-pp-a-listening', role: 'PP-A', correct: 'listening', distractors: ['to listen', 'listened', 'listens'] },
  { id: 'sl-a-to-music', role: 'A', correct: 'to music', distractors: ['to the music', 'for music', 'at music'] },
]

// 复用的现有 slot ids（从 seed 确认存在）
const reusedSlotIds = {
  'sl-s-she': ['S', 'She', ['He', 'Her', 'It', 'His']],
  'sl-pp-a-feeling': ['PP-A', 'feeling', ['to feel', 'felt', 'feel']],
  'sl-c-happy': ['C', 'happy', ['happily', 'happiness', 'sad']],
  'sl-s-he': ['S', 'He', ['She', 'It', 'His', 'Her']],
  'sl-o-tv': ['O', 'TV', ['the TV', 'a TV', 'television']],
  'sl-s-they': ['S', 'They', ['Them', 'She', 'Their']],
  'sl-o-basketball': ['O', 'basketball', ['the basketball', 'basketballs', 'a basketball']],
  'sl-s-i': ['S', 'I', ['Me', 'He', 'My']],
}

const refs = [
  ['s-nf1-p10', 'sl-s-she'], ['s-nf1-p10', 'sl-v-is-reading'], ['s-nf1-p10', 'sl-o-a-book'], ['s-nf1-p10', 'sl-pp-a-feeling'], ['s-nf1-p10', 'sl-c-happy'],
  ['s-nf1-p11', 'sl-s-he'], ['s-nf1-p11', 'sl-v-is-watching'], ['s-nf1-p11', 'sl-o-tv'], ['s-nf1-p11', 'sl-pp-a-thinking'], ['s-nf1-p11', 'sl-a-about-the-test'],
  ['s-nf1-p12', 'sl-s-they'], ['s-nf1-p12', 'sl-v-are-playing'], ['s-nf1-p12', 'sl-o-basketball'], ['s-nf1-p12', 'sl-pp-a-laughing'], ['s-nf1-p12', 'sl-a-loudly'],
  ['s-nf1-p13', 'sl-s-i'], ['s-nf1-p13', 'sl-v-am-cooking'], ['s-nf1-p13', 'sl-o-dinner'], ['s-nf1-p13', 'sl-pp-a-listening'], ['s-nf1-p13', 'sl-a-to-music'],
]

// ===== 检查 =====
// id 冲突
if (usedPointIds.has(newPoint.id)) errors.push(`grammar_point id conflict: ${newPoint.id}`)
if (usedSpanIds.has(newSpan.id)) errors.push(`span id conflict: ${newSpan.id}`)
for (const s of newSentences) {
  if (usedSentenceIds.has(s.id)) errors.push(`sentence id conflict: ${s.id}`)
  if (newSentences.filter((x) => x.id !== s.id && x.en === s.en).length > 0) errors.push(`duplicate en: ${s.id}`)
}
// anchor span 校验：slice 必须等于 "feeling"
const anchor = sentences.find((s) => s.id === newSpan.sentence_id)
if (!anchor) errors.push('anchor not found')
else if (anchor.en.slice(newSpan.start, newSpan.end) !== 'feeling') {
  errors.push(`span slice mismatch: got "${anchor.en.slice(newSpan.start, newSpan.end)}" want "feeling"`)
}

// 新建 slots：查重（不能与现有定义重复）+ 自检
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

// 每句：LTR / 覆盖 / swallow
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
