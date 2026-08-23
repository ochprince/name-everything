#!/usr/bin/env node
/**
 * Check that every word of every sentence.en is covered by at least one
 * sentence_slot.correct (word-boundary substring match). Data is loaded from
 * Supabase Data API (with retries).
 *
 * Usage (repo root, with .env.local):
 *   node .cursor/skills/grammar-content-pack/scripts/check-coverage.mjs
 */

import { fetchGrammarPack } from './supabase-fetch.mjs'

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
  return new RegExp(`(^|[^A-Za-z'])${escapeReg(word)}($|[^A-Za-z'])`).test(
    slotCorrect,
  )
}

async function main() {
  const { sentences, sentence_slots: slots } = await fetchGrammarPack()

  const reuseByWord = new Map()
  for (const slot of slots) {
    for (const w of wordsOf(slot.correct)) {
      if (!reuseByWord.has(w.word)) reuseByWord.set(w.word, new Set())
      reuseByWord.get(w.word).add(
        JSON.stringify({ correct: slot.correct, distractors: slot.distractors }),
      )
    }
  }

  let totalWords = 0
  let coveredWords = 0
  let missingTotal = 0
  const problems = []

  for (const sentence of sentences) {
    const words = wordsOf(sentence.en)
    const sentenceSlots = slots.filter((s) => s.sentence_id === sentence.id)
    const missing = words.filter(
      (w) => !sentenceSlots.some((s) => covers(s.correct, w.word)),
    )

    totalWords += words.length
    coveredWords += words.length - missing.length
    missingTotal += missing.length

    if (missing.length > 0) {
      const reuse = missing.map((w) => {
        const pool = reuseByWord.get(w.word)
        return pool && pool.size > 0 ? [...pool][0] : null
      })
      problems.push({
        sentence: sentence.id,
        level: sentence.level_id,
        en: sentence.en,
        missing: missing.map((w) => w.word),
        reuse,
      })
    }
  }

  const pct = totalWords ? ((coveredWords / totalWords) * 100).toFixed(1) : '100.0'
  console.log(
    `Coverage (Supabase): ${coveredWords}/${totalWords} words (${pct}%)  |  ${missingTotal} uncovered`,
  )

  if (process.argv.includes('--all')) {
    for (const p of problems) {
      console.log(`\n${p.sentence} [${p.level}]`)
      console.log(`  en: ${p.en}`)
      console.log(`  missing: ${p.missing.join(' | ')}`)
      for (let i = 0; i < p.missing.length; i++) {
        const src = p.reuse[i]
        console.log(
          `    ${p.missing[i]} -> ${src ? `REUSE ${src}` : 'NO-SOURCE (create new)'}`,
        )
      }
    }
  } else {
    for (const p of problems) {
      console.log(
        `${p.sentence.padEnd(16)} missing(${p.missing.length}): ${p.missing.join(', ')}`,
      )
    }
  }

  if (missingTotal > 0) process.exit(1)
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
