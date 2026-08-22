import { loadGrammarPack } from './loadPack'

export type Chapter = {
  id: string
  title_zh: string
  description_zh?: string
  sort_order: number
  released: boolean
}

export type Level = {
  id: string
  chapter_id: string
  sort_order: number
  grammar_point_id: string
  pass_threshold?: number
  lives?: number
  fall_duration_ms?: number
}

export type GrammarPoint = {
  id: string
  title_zh: string
  body_zh: string
}

export type Sentence = {
  id: string
  level_id: string
  kind: 'anchor' | 'playable'
  en: string
  zh: string
  prompt_kind: 'zh' | 'image'
  image_url?: string
  sort_order: number
}

export type SentenceSpan = {
  id: string
  sentence_id: string
  grammar_point_id: string
  start: number
  end: number
}

export type SentenceSlot = {
  id: string
  sentence_id: string
  slot_index: number
  role: string
  correct: string
  distractors: string[]
}

export type GrammarPack = {
  chapters: Chapter[]
  levels: Level[]
  grammar_points: GrammarPoint[]
  sentences: Sentence[]
  sentence_spans: SentenceSpan[]
  sentence_slots: SentenceSlot[]
}

export const grammarPack = loadGrammarPack()

export function chaptersInOrder(): Chapter[] {
  return [...grammarPack.chapters].sort((a, b) => a.sort_order - b.sort_order)
}

export function levelsForChapter(chapterId: string): Level[] {
  return grammarPack.levels
    .filter((level) => level.chapter_id === chapterId)
    .sort((a, b) => a.sort_order - b.sort_order)
}

export function levelById(id: string): Level | undefined {
  return grammarPack.levels.find((level) => level.id === id)
}

export function sentencesForLevel(levelId: string): Sentence[] {
  return grammarPack.sentences
    .filter((sentence) => sentence.level_id === levelId)
    .sort((a, b) => a.sort_order - b.sort_order)
}

export function anchorForLevel(levelId: string): Sentence | undefined {
  return sentencesForLevel(levelId).find((sentence) => sentence.kind === 'anchor')
}

export function playablesForLevel(levelId: string): Sentence[] {
  return sentencesForLevel(levelId).filter((sentence) => sentence.kind === 'playable')
}

export function spansForSentence(sentenceId: string): SentenceSpan[] {
  return grammarPack.sentence_spans
    .filter((span) => span.sentence_id === sentenceId)
    .sort((a, b) => a.start - b.start || b.end - a.end)
}

export function slotsForSentence(sentenceId: string): SentenceSlot[] {
  return grammarPack.sentence_slots
    .filter((slot) => slot.sentence_id === sentenceId)
    .sort((a, b) => a.slot_index - b.slot_index)
}

export function pointById(id: string): GrammarPoint | undefined {
  return grammarPack.grammar_points.find((point) => point.id === id)
}

export function sentenceById(id: string): Sentence | undefined {
  return grammarPack.sentences.find((sentence) => sentence.id === id)
}
