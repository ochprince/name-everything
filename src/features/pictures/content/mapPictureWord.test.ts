import { describe, it, expect } from 'vitest'
import { cdnUrl, mapPictureWordRow, type PictureWordRow } from './mapPictureWord'

const row: PictureWordRow = {
  word: 'accumulate',
  sort_order: 12,
  word_level_id: '401',
  word_audio: 'us_accumulate.mp3',
  image_file: 'i_accumulate.jpg',
  accent: '/əˈkjuːmjəleɪt/',
  mean_cn: 'v.积攒，积累',
  mean_en: 'to gradually get more',
  sentence_phrase: 'accumulates wealth',
  sentence: 'He accumulates wealth for future use.',
  sentence_trans: '他积累财富以供将来使用。',
  sentence_audio: 'us_He_accumulates.mp3',
}

describe('mapPictureWordRow', () => {
  it('maps word as Card.id and prefixes CDN for media filenames', () => {
    const card = mapPictureWordRow(row)
    expect(card.id).toBe('accumulate')
    expect(card.word).toBe('accumulate')
    expect(card.sentence).toBe(row.sentence)
    expect(card.image).toBe(cdnUrl(row.image_file))
    expect(card.wordAudio).toBe(cdnUrl(row.word_audio))
    expect(card.sentenceAudio).toBe(cdnUrl(row.sentence_audio))
    expect(card.imageSource).toBe('baicizhan')
    expect(card.zh).toBe(row.mean_cn)
    expect(card.sentenceZh).toBe(row.sentence_trans)
    expect(card.tags).toEqual([])
    expect(card.tier).toBe('T1')
  })
})
