import {
  ensurePictureWordsReady,
  getPictureWordBatch,
  getPictureWordsByWords,
  isPictureWordsReady,
  getLoadedCard,
  mergeLoadedCards,
} from '../lib/pictureWordsCatalog'
import { getSupabase } from '../../../lib/supabase'
import {
  mapPictureWordRow,
  type PictureWordRow,
} from './mapPictureWord'
import {
  mergeCachedPictureWords,
  readCachedPictureWords,
} from './pictureWordsCacheIdb'
import type { Card } from '../../../types/card'

const SELECT =
  'word,sort_order,word_level_id,word_audio,image_file,accent,mean_cn,mean_en,sentence_phrase,sentence,sentence_trans,sentence_audio'

export async function fetchPictureWordBatch(
  offset: number,
  limit: number,
): Promise<Card[]> {
  // 全量目录就绪：直接切片（最快路径）。
  if (isPictureWordsReady()) {
    return getPictureWordBatch(offset, limit)
  }
  void ensurePictureWordsReady().catch(() => {})

  // 刷新后（内存词表空）：查 IDB 增量缓存是否已覆盖本批——命中则不联网。
  const cached = await readCachedPictureWords()
  if (cached) {
    if (cached.complete) {
      // 全量缓存：等 hydrate 完成后切片
      await ensurePictureWordsReady()
      return getPictureWordBatch(offset, limit)
    }
    const sorted = [...cached.rows].sort((a, b) => a.sort_order - b.sort_order)
    const slice = sorted.slice(offset, offset + limit)
    if (slice.length === limit) {
      const cards = slice.map(mapPictureWordRow)
      mergeLoadedCards(cards)
      return cards
    }
  }
  // 缓存未覆盖：联网拉本批（拉回后并入词表 + IDB）
  return fetchPictureWordRange(offset, limit)
}

/**
 * 从 Supabase 按 offset/limit 直接拉取一批（不过全量目录）。
 * 拉回后：并入已加载词表（复习可秒查）+ 合并进 IDB 增量缓存（重进不联网）。
 * 失败重试一次。
 */
async function fetchPictureWordRange(
  offset: number,
  limit: number,
): Promise<Card[]> {
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
      const rows = (data ?? []) as PictureWordRow[]
      const cards = rows.map(mapPictureWordRow)
      // 并入已加载词表 + IDB 增量缓存（均静默，失败不影响本次返回）
      mergeLoadedCards(cards)
      void mergeCachedPictureWords(rows).catch(() => {})
      return cards
    } catch (err) {
      lastError = err
    }
  }
  throw lastError
}

export async function fetchPictureWordsByWords(
  words: string[],
): Promise<Card[]> {
  const unique = [...new Set(words.filter(Boolean))]
  if (unique.length === 0) return []
  // 先查已加载词表：新用户 forgot 必然是学过的词（固定词序，只在前几个批次），
  // 全命中即返回——不等全量预热完成。
  const hit = unique.map((word) => getLoadedCard(word))
  if (hit.every((card) => card !== undefined)) {
    return hit as Card[]
  }
  // 有缺失（词未加载过）：等全量就绪再查
  await ensurePictureWordsReady()
  return getPictureWordsByWords(words)
}
