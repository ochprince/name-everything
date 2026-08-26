export type CardTier = 'T1' | 'T2' | 'T3'
export type ImageSource = 'curated' | 'baicizhan' | 'ai' | 'camera'

export interface Card {
  id: string
  word: string
  sentence: string
  image: string
  imageSource: ImageSource
  zh?: string
  /** Chinese gloss of the example sentence (picture_words.sentence_trans). */
  sentenceZh?: string
  tags: string[]
  tier: CardTier
  wordAudio?: string
  sentenceAudio?: string
  audioHint?: {
    word?: string
    sentence?: string
  }
}
