import {
  ensurePictureWordsReady,
  getPictureWordBatch,
  getPictureWordsByWords,
  isPictureWordsReady,
} from '../lib/pictureWordsCatalog'
import { getSupabase } from '../../../lib/supabase'
import { mapPictureWordRow, type PictureWordRow } from './mapPictureWord'
import type { Card } from '../../../types/card'

export async function fetchPictureWordBatch(
  offset: number,
  limit: number,
): Promise<Card[]> {
  // 增量模式：首屏只按需拉当前批次（50 词 ≈ 25KB，~1s），不等全量词库。
  // 后台同时预热全量到 IndexedDB（供复习/按词查用），失败静默不影响首屏。
  if (!isPictureWordsReady()) {
    void ensurePictureWordsReady().catch(() => {})
    return fetchPictureWordRange(offset, limit)
  }
  return getPictureWordBatch(offset, limit)
}

/**
 * 从 Supabase 按 offset/limit 直接拉取一批（不过全量目录）。
 * 供首屏增量加载使用；失败重试一次。
 */
async function fetchPictureWordRange(
  offset: number,
  limit: number,
): Promise<Card[]> {
  const SELECT =
    'word,sort_order,word_level_id,word_audio,image_file,accent,mean_cn,mean_en,sentence_phrase,sentence,sentence_trans,sentence_audio'
  const to = offset + limit - 1
  let lastError: unknown
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const { data, error } = await getSupabase()
        .from('picture_words')
        .select(SELECT)
        .order('sort_order', { ascending: true })
        .range(offset, to)
      if (error) throw error
      return ((data ?? []) as PictureWordRow[]).map(mapPictureWordRow)
    } catch (err) {
      lastError = err
    }
  }
  throw lastError
}

export async function fetchPictureWordsByWords(
  words: string[],
): Promise<Card[]> {
  await ensurePictureWordsReady()
  return getPictureWordsByWords(words)
}
