import {
  ensurePictureWordsReady,
  getPictureWordBatch,
  getPictureWordsByWords,
} from '../lib/pictureWordsCatalog'
import type { Card } from '../../../types/card'

export async function fetchPictureWordBatch(
  offset: number,
  limit: number,
): Promise<Card[]> {
  await ensurePictureWordsReady()
  return getPictureWordBatch(offset, limit)
}

export async function fetchPictureWordsByWords(
  words: string[],
): Promise<Card[]> {
  await ensurePictureWordsReady()
  return getPictureWordsByWords(words)
}
