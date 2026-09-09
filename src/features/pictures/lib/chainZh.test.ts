import { describe, expect, it, beforeEach } from 'vitest'
import {
  cacheZh,
  extractZhSuggest,
  readCachedZh,
} from './chainZh'

describe('chainZh', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('extractZhSuggest', () => {
    it('takes the first sense from a multi-sense explain', () => {
      const payload = {
        result: { code: 200 },
        data: {
          entries: [
            {
              entry: 'hello',
              explain:
                'int. 喂，你好（用于问候或打招呼）；喂，你好（打电话时的招呼语）；喂，你好（引起别人注意的招呼语）',
            },
          ],
        },
      }
      expect(extractZhSuggest(payload)).toBe('int. 喂，你好（用于问候或打招呼）')
    })

    it('keeps a single-sense explain intact', () => {
      const payload = {
        result: { code: 200 },
        data: { entries: [{ entry: 'water', explain: 'n. 水' }] },
      }
      expect(extractZhSuggest(payload)).toBe('n. 水')
    })

    it('returns null when the dictionary has no entry', () => {
      expect(
        extractZhSuggest({ result: { code: 200 }, data: { entries: [] } }),
      ).toBeNull()
    })

    it('returns null on non-200 or malformed payloads', () => {
      expect(extractZhSuggest({ result: { code: 500 } })).toBeNull()
      expect(extractZhSuggest({})).toBeNull()
      expect(extractZhSuggest(null)).toBeNull()
      expect(extractZhSuggest('garbage')).toBeNull()
    })
  })

  describe('localStorage cache', () => {
    it('round-trips a cached meaning', () => {
      expect(readCachedZh('tiger')).toBeNull()
      cacheZh('tiger', 'n. 老虎')
      expect(readCachedZh('tiger')).toBe('n. 老虎')
    })

    it('re-caching the same word moves it to the newest slot (no duplicate growth)', () => {
      cacheZh('a', 'A')
      cacheZh('b', 'B')
      cacheZh('a', 'A2')
      const raw = JSON.parse(
        localStorage.getItem('name-everything/wordChain/zh') ?? '{}',
      ) as Record<string, string>
      expect(Object.keys(raw)).toEqual(['b', 'a'])
      expect(raw.a).toBe('A2')
    })

    it('ignores corrupt cache records', () => {
      localStorage.setItem('name-everything/wordChain/zh', '{oops')
      expect(readCachedZh('tiger')).toBeNull()
      localStorage.setItem('name-everything/wordChain/zh', JSON.stringify([1, 2]))
      expect(readCachedZh('tiger')).toBeNull()
      // 数组残骸被清掉后仍可正常写入
      cacheZh('tiger', 'n. 老虎')
      expect(readCachedZh('tiger')).toBe('n. 老虎')
    })
  })
})
