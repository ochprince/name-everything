import { describe, it, expect } from 'vitest'
import { marqueeDurationMs } from './marquee'

describe('marqueeDurationMs', () => {
  it('returns 0 for non-positive or non-finite widths', () => {
    expect(marqueeDurationMs(0)).toBe(0)
    expect(marqueeDurationMs(-10)).toBe(0)
    expect(marqueeDurationMs(Number.NaN)).toBe(0)
    expect(marqueeDurationMs(Number.POSITIVE_INFINITY)).toBe(0)
  })

  it('scales with text width at a constant pixel speed', () => {
    expect(marqueeDurationMs(400)).toBe(10000) // 400px / 40px/s
    expect(marqueeDurationMs(800)).toBe(20000)
  })

  it('never goes below the min duration', () => {
    expect(marqueeDurationMs(100)).toBe(6000)
  })
})
