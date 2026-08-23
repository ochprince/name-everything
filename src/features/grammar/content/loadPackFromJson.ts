import chapters from './chapters.json'
import levels from './levels.json'
import grammar_points from './grammar_points.json'
import sentences from './sentences.json'
import sentence_spans from './sentence_spans.json'
import sentence_slots from './sentence_slots.json'
import gameTuningJson from './game_tuning.json'
import type { GameTuning, GrammarPack } from './types'

export function loadGrammarPackFromJson(): GrammarPack {
  return {
    chapters,
    levels,
    grammar_points,
    sentences,
    sentence_spans,
    sentence_slots,
  } as GrammarPack
}

export function loadGameTuningFromJson(): GameTuning {
  return gameTuningJson as GameTuning
}
