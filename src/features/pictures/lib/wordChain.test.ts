import { describe, expect, it } from 'vitest'
import {
  chainReasonCopy,
  checkChainWord,
  loadBestChain,
  loadChainHistory,
  normalizeWord,
  pickStartWord,
  recordChainRun,
  updateBestChain,
} from './wordChain'

const catalog = new Set(['time', 'egg', 'gate', 'eight', 'tea', 'cat', 'quiz'])
/** 词库外真词模拟：接龙测试里只有 apple/tiger 是真英文。 */
const isEnglish = (w: string) => w === 'apple' || w === 'tiger' || w === 'quizlet'
const checker = { catalog, isEnglish }

describe('checkChainWord', () => {
  it('accepts a catalog word that starts with the last letter (rare ×2)', () => {
    expect(checkChainWord('Time', 't', new Set(), checker)).toEqual({
      ok: true,
      word: 'time',
      score: 2,
      inCatalog: true,
    })
  })

  it('is case-insensitive for the leading letter', () => {
    expect(checkChainWord('Time', 'T', new Set(), checker).ok).toBe(true)
  })

  it('rejects a wrong first letter', () => {
    expect(checkChainWord('cat', 'e', new Set(), checker)).toEqual({
      ok: false,
      reason: 'letter',
    })
  })

  it('accepts a real English word outside the catalog (no bonus)', () => {
    expect(checkChainWord('tiger', 't', new Set(), checker)).toEqual({
      ok: true,
      word: 'tiger',
      score: 1,
      inCatalog: false,
    })
  })

  it('rejects gibberish outside the catalog', () => {
    expect(checkChainWord('tigzz', 't', new Set(), checker)).toEqual({
      ok: false,
      reason: 'notword',
    })
  })

  it('rejects words already used this round', () => {
    expect(checkChainWord('time', 't', new Set(['time']), checker)).toEqual({
      ok: false,
      reason: 'repeat',
    })
  })

  it('cleans voice-input punctuation before judging', () => {
    // 语音输入常带句号/逗号：与例句判定一致，先清洗再判
    expect(checkChainWord('Time.', 't', new Set(), checker)).toEqual({
      ok: true,
      word: 'time',
      score: 2,
      inCatalog: true,
    })
    expect(checkChainWord('tiger,', 't', new Set(), checker)).toEqual({
      ok: true,
      word: 'tiger',
      score: 1,
      inCatalog: false,
    })
  })

  it('rejects empty, single-letter and pure-symbol input', () => {
    expect(checkChainWord('   ', 'e', new Set(), checker)).toEqual({
      ok: false,
      reason: 'notword',
    })
    expect(checkChainWord('t', 't', new Set(), checker)).toEqual({
      ok: false,
      reason: 'notword',
    })
    expect(checkChainWord('2$%^', 't', new Set(), checker)).toEqual({
      ok: false,
      reason: 'notword',
    })
  })
})

describe('helpers', () => {
  it('normalizes case and trims', () => {
    expect(normalizeWord('  Time  ')).toBe('time')
  })

  it('maps reasons to copy', () => {
    expect(chainReasonCopy('letter')).toMatch(/首字母/)
    expect(chainReasonCopy('notword')).toMatch(/不像/)
    expect(chainReasonCopy('repeat')).toMatch(/用过/)
  })

  it('picks from the highest-frequency pool only', () => {
    const zipf = (w: string) => ({ time: 6, egg: 5, gate: 1 })[w] ?? 0
    const seen = new Set<string>()
    for (let i = 0; i < 40; i += 1) seen.add(pickStartWord(['gate', 'egg', 'time'], zipf, 2)!)
    expect(seen.has('gate')).toBe(false)
    expect(seen.size).toBe(2)
  })

  it('returns null for an empty candidate list', () => {
    expect(pickStartWord([], () => 0)).toBeNull()
  })
})

describe('best record', () => {
  it('reads and updates the record with score priority', () => {
    localStorage.clear()
    expect(loadBestChain()).toBeNull()

    const first = updateBestChain({ length: 3, score: 4 })
    expect(first.isNew).toBe(true)
    expect(loadBestChain()).toEqual({ length: 3, score: 4 })

    // same length but higher score -> new record
    expect(updateBestChain({ length: 3, score: 5 }).isNew).toBe(true)
    // lower score -> not a record even with longer chain
    const lower = updateBestChain({ length: 4, score: 3 })
    expect(lower.isNew).toBe(false)
    // 未刷新时返回的应是仍存的最高纪录，不是本次（低分）结果
    expect(lower.best).toEqual({ length: 3, score: 5 })
    expect(loadBestChain()).toEqual({ length: 3, score: 5 })
    localStorage.clear()
  })

  it('keeps a newest-first run history (capped)', () => {
    localStorage.clear()
    expect(loadChainHistory()).toEqual([])
    recordChainRun({ length: 3, score: 4, at: 100 })
    recordChainRun({ length: 5, score: 9, at: 200 })
    recordChainRun({ length: 2, score: 2, at: 300 })
    expect(loadChainHistory()).toEqual([
      { length: 2, score: 2, at: 300 },
      { length: 5, score: 9, at: 200 },
      { length: 3, score: 4, at: 100 },
    ])
    localStorage.clear()
  })

  it('survives corrupted storage', () => {
    localStorage.clear()
    localStorage.setItem('name-everything/wordChain/best', '{oops')
    expect(loadBestChain()).toBeNull()
    localStorage.clear()
  })
})
