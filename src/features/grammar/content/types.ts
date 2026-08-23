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

export type GameTuning = {
  lives: number
  pass_threshold_default: number
  fall_duration_ms: number
  wrong_speed_factor: number
  min_fall_duration_ms: number
  correct_bounce_factor: number
}
