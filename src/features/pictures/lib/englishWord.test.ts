import { describe, expect, it } from 'vitest'
import { looksLikeEnglish } from './englishWord'

describe('looksLikeEnglish (no wordlist fallback)', () => {
  it('accepts plain words', () => {
    expect(looksLikeEnglish('apple')).toBe(true)
    expect(looksLikeEnglish('strengths')).toBe(true)
    expect(looksLikeEnglish('ox')).toBe(true)
    expect(looksLikeEnglish('fly')).toBe(true)
  })

  it('rejects non-letter or too-long input', () => {
    expect(looksLikeEnglish('time2')).toBe(false)
    expect(looksLikeEnglish('你好')).toBe(false)
    expect(looksLikeEnglish('t'.repeat(20))).toBe(false)
  })

  it('rejects vowel-less consonant smashes', () => {
    expect(looksLikeEnglish('xcvbn')).toBe(false)
    expect(looksLikeEnglish('qwrtp')).toBe(false)
    expect(looksLikeEnglish('zzz')).toBe(false)
  })

  it('does not catch keyboard rows by itself (wordlist is the real gate)', () => {
    // qwerty 含 e/y，纯规则拦不住——离线兜底只能挡最明显的乱拼
    expect(looksLikeEnglish('qwerty')).toBe(true)
  })

  it('rejects repeated single-letter strings', () => {
    expect(looksLikeEnglish('aaaa')).toBe(false)
  })

  it('rejects overly long consonant runs', () => {
    expect(looksLikeEnglish('brnsthw')).toBe(false)
  })
})
