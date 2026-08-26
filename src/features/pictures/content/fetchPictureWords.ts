import { getSupabase } from '../../../lib/supabase'
import {
  mapPictureWordRow,
  type PictureWordRow,
} from './mapPictureWord'
import type { Card } from '../../../types/card'

const SELECT =
  'word,sort_order,word_level_id,word_audio,image_file,accent,mean_cn,mean_en,sentence_phrase,sentence,sentence_trans,sentence_audio'

export async function fetchPictureWordBatch(
  offset: number,
  limit: number,
): Promise<Card[]> {
  const { data, error } = await getSupabase()
    .from('picture_words')
    .select(SELECT)
    .order('sort_order', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return ((data ?? []) as PictureWordRow[]).map(mapPictureWordRow)
}

export async function fetchPictureWordsByWords(
  words: string[],
): Promise<Card[]> {
  const unique = [...new Set(words.filter(Boolean))]
  if (unique.length === 0) return []

  const { data, error } = await getSupabase()
    .from('picture_words')
    .select(SELECT)
    .in('word', unique)

  if (error) throw error
  return ((data ?? []) as PictureWordRow[]).map(mapPictureWordRow)
}
