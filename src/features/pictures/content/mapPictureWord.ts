import type { Card } from '../../../types/card'

export const BAICIZHAN_CDN = 'https://ali.bczcdn.com/r/'

export function cdnUrl(filename: string): string {
  return `${BAICIZHAN_CDN}${filename}`
}

export type PictureWordRow = {
  word: string
  sort_order: number
  word_level_id: string
  word_audio: string
  image_file: string
  accent: string | null
  mean_cn: string | null
  mean_en: string | null
  sentence_phrase: string | null
  sentence: string
  sentence_trans: string | null
  sentence_audio: string
}

export function mapPictureWordRow(row: PictureWordRow): Card {
  return {
    id: row.word,
    word: row.word,
    sentence: row.sentence,
    image: cdnUrl(row.image_file),
    imageSource: 'baicizhan',
    zh: row.mean_cn ?? undefined,
    tags: [],
    tier: 'T1',
    wordAudio: cdnUrl(row.word_audio),
    sentenceAudio: cdnUrl(row.sentence_audio),
  }
}
