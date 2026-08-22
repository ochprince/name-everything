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

export const grammarPack: GrammarPack = {
  chapters: [
    {
      id: 'simple',
      title_zh: '简单句',
      description_zh: '五大句型主干，一关练一种。',
      sort_order: 1,
      released: true,
    },
    {
      id: 'predicate',
      title_zh: '谓语',
      description_zh: '时态、语态、情态。',
      sort_order: 2,
      released: false,
    },
    {
      id: 'nonfinite',
      title_zh: '非谓语',
      description_zh: '不定式、分词、动名词。',
      sort_order: 3,
      released: false,
    },
  ],
  levels: [
    {
      id: 'dative-1',
      chapter_id: 'simple',
      sort_order: 1,
      grammar_point_id: 'gp-ditrans',
    },
    {
      id: 'svo-1',
      chapter_id: 'simple',
      sort_order: 2,
      grammar_point_id: 'gp-svo',
    },
  ],
  grammar_points: [
    {
      id: 'gp-s',
      title_zh: '主语 S',
      body_zh: '动作的发出者。可以是 He / She / I / They 等人称。',
    },
    {
      id: 'gp-v',
      title_zh: '谓语 V',
      body_zh: '句子的核心动词。时态、语态都体现在这里。',
    },
    {
      id: 'gp-io',
      title_zh: '间接宾语 IO',
      body_zh: '给谁。一般是人，紧跟动词：me / him / her / us。',
    },
    {
      id: 'gp-do',
      title_zh: '直接宾语 DO',
      body_zh: '给什么。一般是物：a book / an email / a cake。',
    },
    {
      id: 'gp-o',
      title_zh: '宾语 O',
      body_zh: '动作承受的对象：music / books / lunch。',
    },
    {
      id: 'gp-ditrans',
      title_zh: '双宾 S+V+IO+DO',
      body_zh: 'S + V + IO + DO。骨架不动，换人称和物件就是替换。',
    },
    {
      id: 'gp-svo',
      title_zh: '主谓宾 S+V+O',
      body_zh: '及物动词后直接跟宾语，没有间接宾语。主语 + 谓语 + 宾语。',
    },
  ],
  sentences: [
    {
      id: 's-d1-anchor',
      level_id: 'dative-1',
      kind: 'anchor',
      en: 'He sent me a book.',
      zh: '他寄给了我一本书。',
      prompt_kind: 'zh',
      sort_order: 0,
    },
    {
      id: 's-d1-p1',
      level_id: 'dative-1',
      kind: 'playable',
      en: 'She sent him an email.',
      zh: '她给他发了一封邮件。',
      prompt_kind: 'zh',
      sort_order: 1,
    },
    {
      id: 's-d1-p2',
      level_id: 'dative-1',
      kind: 'playable',
      en: 'They gave us a cake.',
      zh: '他们给了我们一个蛋糕。',
      prompt_kind: 'zh',
      sort_order: 2,
    },
    {
      id: 's-d1-p3',
      level_id: 'dative-1',
      kind: 'playable',
      en: 'I showed her a photo.',
      zh: '我给她看了一张照片。',
      prompt_kind: 'zh',
      sort_order: 3,
    },
    {
      id: 's-svo-anchor',
      level_id: 'svo-1',
      kind: 'anchor',
      en: 'She loves music.',
      zh: '她喜欢音乐。',
      prompt_kind: 'zh',
      sort_order: 0,
    },
    {
      id: 's-svo-p1',
      level_id: 'svo-1',
      kind: 'playable',
      en: 'I read books.',
      zh: '我读书。',
      prompt_kind: 'zh',
      sort_order: 1,
    },
    {
      id: 's-svo-p2',
      level_id: 'svo-1',
      kind: 'playable',
      en: 'They watch movies.',
      zh: '他们看电影。',
      prompt_kind: 'zh',
      sort_order: 2,
    },
    {
      id: 's-svo-p3',
      level_id: 'svo-1',
      kind: 'playable',
      en: 'He eats lunch.',
      zh: '他吃午饭。',
      prompt_kind: 'zh',
      sort_order: 3,
    },
  ],
  sentence_spans: [
    { id: 'sp-d1-s', sentence_id: 's-d1-anchor', grammar_point_id: 'gp-s', start: 0, end: 2 },
    { id: 'sp-d1-v', sentence_id: 's-d1-anchor', grammar_point_id: 'gp-v', start: 3, end: 7 },
    { id: 'sp-d1-io', sentence_id: 's-d1-anchor', grammar_point_id: 'gp-io', start: 8, end: 10 },
    {
      id: 'sp-d1-do',
      sentence_id: 's-d1-anchor',
      grammar_point_id: 'gp-do',
      start: 11,
      end: 17,
    },
    {
      id: 'sp-d1-all',
      sentence_id: 's-d1-anchor',
      grammar_point_id: 'gp-ditrans',
      start: 0,
      end: 18,
    },
    {
      id: 'sp-svo-s',
      sentence_id: 's-svo-anchor',
      grammar_point_id: 'gp-s',
      start: 0,
      end: 3,
    },
    {
      id: 'sp-svo-v',
      sentence_id: 's-svo-anchor',
      grammar_point_id: 'gp-v',
      start: 4,
      end: 9,
    },
    {
      id: 'sp-svo-o',
      sentence_id: 's-svo-anchor',
      grammar_point_id: 'gp-o',
      start: 10,
      end: 16,
    },
    {
      id: 'sp-svo-all',
      sentence_id: 's-svo-anchor',
      grammar_point_id: 'gp-svo',
      start: 0,
      end: 17,
    },
  ],
  sentence_slots: [
    ...slots('s-d1-anchor', ['He', 'sent', 'me', 'a book'], {
      0: ['She', 'It', 'His', 'Her'],
      1: ['send', 'sends', 'gave'],
      2: ['I', 'him', 'her'],
      3: ['the book', 'books', 'an book'],
    }),
    ...slots('s-d1-p1', ['She', 'sent', 'him', 'an email'], {
      0: ['He', 'Her', 'It', 'His'],
      1: ['send', 'sends', 'gave'],
      2: ['he', 'me', 'her'],
      3: ['a email', 'email', 'a book'],
    }),
    ...slots('s-d1-p2', ['They', 'gave', 'us', 'a cake'], {
      0: ['Them', 'She', 'Their'],
      1: ['give', 'gives', 'sent'],
      2: ['we', 'them', 'me'],
      3: ['cake', 'an cake', 'a book'],
    }),
    ...slots('s-d1-p3', ['I', 'showed', 'her', 'a photo'], {
      0: ['Me', 'He', 'My'],
      1: ['show', 'shows', 'showed to'],
      2: ['she', 'him', 'me'],
      3: ['photo', 'an photo', 'the photos'],
    }),
    ...slots('s-svo-anchor', ['She', 'loves', 'music'], {
      0: ['He', 'Her', 'It'],
      1: ['love', 'loved', 'loving'],
      2: ['musics', 'a music', 'the music'],
    }, ['S', 'V', 'O']),
    ...slots('s-svo-p1', ['I', 'read', 'books'], {
      0: ['Me', 'He', 'She'],
      1: ['reads', 'reading', 'wrote'],
      2: ['book', 'a books', 'the book'],
    }, ['S', 'V', 'O']),
    ...slots('s-svo-p2', ['They', 'watch', 'movies'], {
      0: ['Them', 'We', 'She'],
      1: ['watches', 'watched', 'look'],
      2: ['movie', 'a movies', 'the movies'],
    }, ['S', 'V', 'O']),
    ...slots('s-svo-p3', ['He', 'eats', 'lunch'], {
      0: ['Him', 'She', 'They'],
      1: ['eat', 'ate', 'eating'],
      2: ['lunches', 'a lunch', 'the lunch'],
    }, ['S', 'V', 'O']),
  ],
}

function slots(
  sentenceId: string,
  correct: string[],
  distractors: Record<number, string[]>,
  roles: string[] = ['S', 'V', 'IO', 'DO'],
): SentenceSlot[] {
  return correct.map((value, index) => ({
    id: `${sentenceId}-slot-${index}`,
    sentence_id: sentenceId,
    slot_index: index,
    role: roles[index] ?? 'X',
    correct: value,
    distractors: distractors[index] ?? [],
  }))
}

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
