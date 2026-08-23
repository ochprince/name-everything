import { getGrammarPack } from './packStore'
import type {
  Chapter,
  GrammarPoint,
  Level,
  Sentence,
  SentenceSlot,
  SentenceSpan,
} from './types'

export type {
  Chapter,
  GrammarPack,
  GrammarPoint,
  Level,
  Sentence,
  SentenceSlot,
  SentenceSpan,
} from './types'

export { grammarPack, getGrammarPack, isGrammarPackLoaded, setGrammarPack } from './packStore'

export function chaptersInOrder(): Chapter[] {
  return [...getGrammarPack().chapters].sort((a, b) => a.sort_order - b.sort_order)
}

export function levelsForChapter(chapterId: string): Level[] {
  return getGrammarPack()
    .levels.filter((level) => level.chapter_id === chapterId)
    .sort((a, b) => a.sort_order - b.sort_order)
}

export function levelById(id: string): Level | undefined {
  return getGrammarPack().levels.find((level) => level.id === id)
}

export function sentencesForLevel(levelId: string): Sentence[] {
  return getGrammarPack()
    .sentences.filter((sentence) => sentence.level_id === levelId)
    .sort((a, b) => a.sort_order - b.sort_order)
}

export function anchorForLevel(levelId: string): Sentence | undefined {
  return sentencesForLevel(levelId).find((sentence) => sentence.kind === 'anchor')
}

export function playablesForLevel(levelId: string): Sentence[] {
  return sentencesForLevel(levelId).filter((sentence) => sentence.kind === 'playable')
}

export function spansForSentence(sentenceId: string): SentenceSpan[] {
  return getGrammarPack()
    .sentence_spans.filter((span) => span.sentence_id === sentenceId)
    .sort((a, b) => a.start - b.start || b.end - a.end)
}

export function slotsForSentence(sentenceId: string): SentenceSlot[] {
  return getGrammarPack()
    .sentence_slots.filter((slot) => slot.sentence_id === sentenceId)
    .sort((a, b) => a.slot_index - b.slot_index)
}

export function pointById(id: string): GrammarPoint | undefined {
  return getGrammarPack().grammar_points.find((point) => point.id === id)
}

export function sentenceById(id: string): Sentence | undefined {
  return getGrammarPack().sentences.find((sentence) => sentence.id === id)
}
