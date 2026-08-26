import type { Card } from '../../../types/card'

/** Deterministic in-memory catalog for Pictures UI tests. */
export const TEST_PICTURE_CARDS: Card[] = Array.from({ length: 12 }, (_, i) => {
  const id = `w${i}`
  return {
    id,
    word: id,
    sentence: `Sentence for ${id}.`,
    image: `https://ali.bczcdn.com/r/${id}.jpg`,
    imageSource: 'baicizhan',
    tags: [],
    tier: 'T1',
    wordAudio: `https://ali.bczcdn.com/r/${id}_w.mp3`,
    sentenceAudio: `https://ali.bczcdn.com/r/${id}_s.mp3`,
    zh: `释义${i}`,
  }
})
