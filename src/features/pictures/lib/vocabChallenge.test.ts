import { describe, it, expect } from 'vitest'
import {
  buildVocabPlayable,
  buildVocabPlayables,
  findWordSpan,
  isVocabMcqReady,
  pickVocabAnswerMode,
} from './vocabChallenge'

describe('findWordSpan', () => {
  it('finds a whole-word match case-insensitively', () => {
    expect(findWordSpan('Add a slice of lemon to flavor the dish.', 'dish')).toEqual({
      start: 35,
      end: 39,
      surface: 'dish',
    })
    expect(findWordSpan('This Cup is mine.', 'cup')).toEqual({
      start: 5,
      end: 8,
      surface: 'Cup',
    })
  })

  it('returns null when the word is missing as a whole token', () => {
    expect(findWordSpan('dishes are ready', 'dish')).toBeNull()
  })
})

describe('buildVocabPlayable', () => {
  it('builds a produce-only playable when no curated distractors exist', () => {
    const built = buildVocabPlayable({
      id: 'dish',
      word: 'dish',
      sentence: 'Add a slice of lemon to flavor the dish.',
      image: 'https://example.com/dish.jpg',
      imageSource: 'baicizhan',
      zh: '菜肴',
      sentenceZh: '往这道菜里加一片柠檬提味。',
      tags: [],
      tier: 'T1',
    })

    expect(built).not.toBeNull()
    expect(built!.sentence.en).toBe('Add a slice of lemon to flavor the dish.')
    expect(built!.sentence.zh).toBe('往这道菜里加一片柠檬提味。')
    expect(built!.sentence.prompt_kind).toBe('zh')
    expect(built!.sentence.image_url).toBe('https://example.com/dish.jpg')
    expect(built!.slot.correct).toBe('dish')
    expect(built!.slot.distractors).toEqual([])
    expect(built!.slotSource).toBe('runtime')
    expect(isVocabMcqReady(built!)).toBe(false)
  })

  it('falls back to image prompt when sentence Chinese is missing', () => {
    const built = buildVocabPlayable({
      id: 'dish',
      word: 'dish',
      sentence: 'Wash the dish.',
      image: 'https://example.com/dish.jpg',
      imageSource: 'baicizhan',
      zh: '盘子',
      tags: [],
      tier: 'T1',
    })
    expect(built!.sentence.prompt_kind).toBe('image')
    expect(built!.sentence.zh).toBe('dish')
  })

  it('marks MCQ ready when curated distractors are supplied', () => {
    const built = buildVocabPlayable(
      {
        id: 'dish',
        word: 'dish',
        sentence: 'Wash the dish.',
        image: '',
        imageSource: 'baicizhan',
        zh: '盘子',
        tags: [],
        tier: 'T1',
      },
      { distractors: ['plate', 'bowl', 'cup'] },
    )

    expect(built).not.toBeNull()
    expect(built!.slotSource).toBe('curated')
    expect(built!.slot.distractors).toEqual(['plate', 'bowl', 'cup'])
    expect(isVocabMcqReady(built!)).toBe(true)
  })

  it('stays produce-only when curated list has fewer than 3 distractors', () => {
    const built = buildVocabPlayable(
      {
        id: 'dish',
        word: 'dish',
        sentence: 'Wash the dish.',
        image: '',
        imageSource: 'baicizhan',
        tags: [],
        tier: 'T1',
      },
      { distractors: ['plate', 'bowl'] },
    )

    expect(built!.slotSource).toBe('runtime')
    expect(isVocabMcqReady(built!)).toBe(false)
  })

  it('skips cards whose word is not in the sentence', () => {
    expect(
      buildVocabPlayable({
        id: 'x',
        word: 'missing',
        sentence: 'No match here.',
        image: '',
        imageSource: 'baicizhan',
        tags: [],
        tier: 'T1',
      }),
    ).toBeNull()
  })
})

describe('pickVocabAnswerMode', () => {
  it('forces produce when MCQ data is missing', () => {
    const built = buildVocabPlayable({
      id: 'cup',
      word: 'cup',
      sentence: 'This is a cup.',
      image: '',
      imageSource: 'baicizhan',
      tags: [],
      tier: 'T1',
    })
    expect(pickVocabAnswerMode(built!, 0, () => 0)).toBe('produce')
  })

  it('uses produceRatio when MCQ data is ready', () => {
    const built = buildVocabPlayable(
      {
        id: 'cup',
        word: 'cup',
        sentence: 'This is a cup.',
        image: '',
        imageSource: 'baicizhan',
        tags: [],
        tier: 'T1',
      },
      { distractors: ['mug', 'bowl', 'glass'] },
    )
    expect(pickVocabAnswerMode(built!, 0, () => 0)).toBe('mcq')
    expect(pickVocabAnswerMode(built!, 1, () => 0.99)).toBe('produce')
  })
})

describe('buildVocabPlayables', () => {
  it('drops unusable cards and keeps order of usable ones', () => {
    const cards = [
      {
        id: 'cup',
        word: 'cup',
        sentence: 'This is a cup.',
        image: '',
        imageSource: 'baicizhan' as const,
        zh: '杯子',
        tags: [],
        tier: 'T1' as const,
      },
      {
        id: 'bad',
        word: 'zzz',
        sentence: 'Nothing useful.',
        image: '',
        imageSource: 'baicizhan' as const,
        tags: [],
        tier: 'T1' as const,
      },
      {
        id: 'dish',
        word: 'dish',
        sentence: 'Wash the dish.',
        image: '',
        imageSource: 'baicizhan' as const,
        zh: '盘子',
        tags: [],
        tier: 'T1' as const,
      },
    ]
    const built = buildVocabPlayables(cards)
    expect(built.map((item) => item.sentence.id)).toEqual(['pw:cup', 'pw:dish'])
    expect(built.every((item) => !isVocabMcqReady(item))).toBe(true)
  })
})
