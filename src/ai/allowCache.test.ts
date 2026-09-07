import { describe, expect, it } from 'vitest'
import {
  AI_ALLOW_CACHE_KEY,
  isAiAllowCacheFresh,
  readAiAllowCache,
  writeAiAllowCache,
} from './allowCache'
import { checkAiAllowedCached } from './allowance'

describe('allow cache', () => {
  it('writes and reads with a fresh timestamp', () => {
    localStorage.clear()
    expect(readAiAllowCache()).toBeNull()
    expect(isAiAllowCacheFresh()).toBe(false)

    writeAiAllowCache(true)
    const cache = readAiAllowCache()
    expect(cache?.allowed).toBe(true)
    expect(isAiAllowCacheFresh()).toBe(true)
    localStorage.clear()
  })

  it('expired write forces the next entry to re-check', () => {
    localStorage.clear()
    writeAiAllowCache(false, { expired: true })
    const cache = readAiAllowCache()
    expect(cache?.allowed).toBe(false)
    expect(cache?.checkedAt).toBe(0)
    expect(isAiAllowCacheFresh()).toBe(false)
    localStorage.clear()
  })

  it('survives corrupted storage', () => {
    localStorage.clear()
    localStorage.setItem(AI_ALLOW_CACHE_KEY, '{oops')
    expect(readAiAllowCache()).toBeNull()
    expect(isAiAllowCacheFresh()).toBe(false)
    localStorage.clear()
  })
})

describe('checkAiAllowedCached (lazy)', () => {
  it('serves a fresh cached value without hitting the network', async () => {
    localStorage.clear()
    writeAiAllowCache(true)
    // supabase 未配置时真实请求会返回 denied——若走了网络这条测试会得到 false
    const detail = await checkAiAllowedCached('test-device')
    expect(detail).toEqual({ allowed: true, ok: true })
    localStorage.clear()
  })

  it('re-checks when the cache is expired/absent and rewrites it', async () => {
    localStorage.clear()
    writeAiAllowCache(true, { expired: true })
    // supabase 未配置 → 真实路径返回 denied 并回写缓存
    const detail = await checkAiAllowedCached('test-device')
    expect(detail).toEqual({ allowed: false, ok: true })
    expect(readAiAllowCache()?.allowed).toBe(false)
    localStorage.clear()
  })
})
