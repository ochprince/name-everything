import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PictureWordRow } from '../content/mapPictureWord'
import {
  __resetPictureWordsCacheForTests,
  ensurePictureWordsReady,
  getPictureWordBatch,
  getPictureWordsByWords,
  hydratePictureWords,
  isPictureWordsReady,
} from './pictureWordsCatalog'

function row(word: string, sort_order: number): PictureWordRow {
  return {
    word,
    sort_order,
    word_level_id: 'cet4',
    word_audio: `${word}.mp3`,
    image_file: `${word}.jpg`,
    accent: null,
    mean_cn: word,
    mean_en: null,
    sentence_phrase: null,
    sentence: `This is a ${word}.`,
    sentence_trans: null,
    sentence_audio: `${word}-s.mp3`,
  }
}

describe('pictureWordsCatalog', () => {
  beforeEach(() => {
    __resetPictureWordsCacheForTests()
  })

  it('is not ready until hydrated', () => {
    expect(isPictureWordsReady()).toBe(false)
  })

  it('serves batches by sort_order range after hydrate', () => {
    hydratePictureWords(3, [row('a', 0), row('b', 1), row('c', 2), row('d', 3)])
    expect(isPictureWordsReady()).toBe(true)
    expect(getPictureWordBatch(0, 2).map((c) => c.word)).toEqual(['a', 'b'])
    expect(getPictureWordBatch(2, 2).map((c) => c.word)).toEqual(['c', 'd'])
    expect(getPictureWordBatch(10, 2)).toEqual([])
  })

  it('looks up cards by word', () => {
    hydratePictureWords(1, [row('cup', 0), row('bag', 1)])
    expect(getPictureWordsByWords(['bag', 'missing', 'cup']).map((c) => c.word)).toEqual([
      'bag',
      'cup',
    ])
  })
})

describe('ensurePictureWordsReady', () => {
  beforeEach(() => {
    __resetPictureWordsCacheForTests()
  })

  it('keeps idb catalog when remote version matches', async () => {
    const fetchAllRows = vi.fn(async () => [row('remote', 0)])
    await ensurePictureWordsReady({
      readCached: async () => ({ version: 7, rows: [row('cup', 0)] }),
      writeCached: async () => {},
      fetchVersion: async () => 7,
      fetchAllRows,
    })
    expect(getPictureWordBatch(0, 1)[0]?.word).toBe('cup')
    await vi.waitFor(() => {
      expect(fetchAllRows).not.toHaveBeenCalled()
    })
  })

  it('uses idb catalog when present and refreshes later if stale', async () => {
    let resolveVersion: (version: number) => void = () => {}
    const versionGate = new Promise<number>((resolve) => {
      resolveVersion = resolve
    })
    const fetchAllRows = vi.fn(async () => [row('new', 0)])
    const writeCached = vi.fn(async () => {})

    const ready = ensurePictureWordsReady({
      readCached: async () => ({ version: 1, rows: [row('old', 0)] }),
      writeCached,
      fetchVersion: async () => versionGate,
      fetchAllRows,
    })
    await ready
    expect(getPictureWordBatch(0, 1)[0]?.word).toBe('old')

    resolveVersion(2)
    await vi.waitFor(() => {
      expect(getPictureWordBatch(0, 1)[0]?.word).toBe('new')
    })
    expect(writeCached).toHaveBeenCalled()
  })

  it('refetches when cache is missing', async () => {
    const writeCached = vi.fn(async () => {})
    await ensurePictureWordsReady({
      readCached: async () => null,
      writeCached,
      fetchVersion: async () => 2,
      fetchAllRows: async () => [row('new', 0)],
    })
    expect(getPictureWordBatch(0, 1)[0]?.word).toBe('new')
    expect(writeCached).toHaveBeenCalledWith({
      version: 2,
      rows: [row('new', 0)],
    })
  })

  it('returns immediately when memory is already ready', async () => {
    hydratePictureWords(1, [row('cup', 0)])
    const readCached = vi.fn(async () => null)
    await ensurePictureWordsReady({
      readCached,
      writeCached: async () => {},
      fetchVersion: async () => 1,
      fetchAllRows: async () => [],
    })
    expect(readCached).not.toHaveBeenCalled()
    expect(isPictureWordsReady()).toBe(true)
  })
})
