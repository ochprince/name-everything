import type { Card } from '../../../types/card'
import type { Sentence, SentenceSlot } from '../../grammar/content/types'
import { pickAnswerMode, type AnswerMode } from '../../grammar/lib/engine'

export const VOCAB_CHALLENGE_LEVEL_ID = 'vocab-challenge'

/** runtime = no curated distractors (produce); curated = ready for MCQ. */
export type VocabSlotSource = 'runtime' | 'curated'

export type VocabPlayable = {
  sentence: Sentence
  slot: SentenceSlot
  slotSource: VocabSlotSource
}

export type WordSpan = {
  start: number
  end: number
  surface: string
}

export type BuildVocabPlayableOptions = {
  /**
   * Curated / AI distractors. When ≥3 valid items are present, MCQ unlocks.
   * Hook for future batch generation — leave unset until that data exists.
   */
  distractors?: string[]
}

export function findWordSpan(sentence: string, word: string): WordSpan | null {
  const needle = word.trim()
  if (!needle) return null
  const pattern = new RegExp(`\\b${escapeRegExp(needle)}\\b`, 'i')
  const match = pattern.exec(sentence)
  if (!match || match.index === undefined) return null
  return {
    start: match.index,
    end: match.index + match[0].length,
    surface: match[0],
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeDistractors(word: string, distractors: string[] | undefined): string[] {
  if (!distractors) return []
  const target = word.trim().toLowerCase()
  const unique: string[] = []
  for (const raw of distractors) {
    const item = raw.trim()
    if (!item) continue
    if (item.toLowerCase() === target) continue
    if (unique.some((seen) => seen.toLowerCase() === item.toLowerCase())) continue
    unique.push(item)
  }
  return unique
}

/** True when this playable has enough curated distractors for four-choice MCQ. */
export function isVocabMcqReady(playable: VocabPlayable): boolean {
  return (
    playable.slotSource === 'curated' &&
    playable.slot.distractors.filter((item) => item.trim().length > 0).length >= 3
  )
}

/**
 * Vocab challenge answer mode: MCQ only when curated distractor data exists;
 * otherwise always produce (typed answer). Keeps the MCQ path wired for AI later.
 */
export function pickVocabAnswerMode(
  playable: VocabPlayable | undefined,
  produceRatio: number,
  random: () => number = Math.random,
): AnswerMode {
  if (!playable || !isVocabMcqReady(playable)) return 'produce'
  return pickAnswerMode(produceRatio, random)
}

export function buildVocabPlayable(
  card: Card,
  options: BuildVocabPlayableOptions = {},
): VocabPlayable | null {
  const word = card.word.trim()
  const en = card.sentence.trim()
  if (!word || !en) return null

  // Produce grades the full English sentence — no blank/span required.
  // Span is only useful later for MCQ blanking; lemma may appear as deeds/etc.
  const span = findWordSpan(en, word)
  const distractors = normalizeDistractors(word, options.distractors)
  const slotSource: VocabSlotSource = distractors.length >= 3 ? 'curated' : 'runtime'

  const sentenceId = `pw:${word}`
  const sentenceZh = card.sentenceZh?.trim()
  const sentence: Sentence = {
    id: sentenceId,
    level_id: VOCAB_CHALLENGE_LEVEL_ID,
    kind: 'playable',
    en,
    // Prompt the sentence sense, not the isolated word gloss.
    zh: sentenceZh || word,
    prompt_kind: sentenceZh ? 'zh' : 'image',
    image_url: card.image || undefined,
    sort_order: 0,
  }
  const slot: SentenceSlot = {
    id: `${sentenceId}-slot-0`,
    sentence_id: sentenceId,
    slot_index: 0,
    role: 'target',
    correct: span?.surface ?? word,
    // Empty until curated/AI distractors arrive — MCQ stays gated off.
    distractors: slotSource === 'curated' ? distractors : [],
  }
  return { sentence, slot, slotSource }
}

export function buildVocabPlayables(
  cards: Card[],
  distractorsByWord?: ReadonlyMap<string, string[]>,
): VocabPlayable[] {
  const built: VocabPlayable[] = []
  for (const card of cards) {
    const item = buildVocabPlayable(card, {
      distractors: distractorsByWord?.get(card.word),
    })
    if (item) built.push(item)
  }
  return built
}
