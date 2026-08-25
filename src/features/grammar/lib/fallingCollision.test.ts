import { describe, expect, it, vi } from 'vitest'
import {
  sentenceHitBottom,
  shouldTrustDomLandCheck,
} from './fallingCollision'

function stubRect(
  el: HTMLElement,
  rect: Pick<DOMRect, 'top' | 'bottom' | 'height'>,
) {
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: rect.top,
    width: 100,
    left: 0,
    right: 100,
    top: rect.top,
    bottom: rect.bottom,
    height: rect.height,
    toJSON: () => ({}),
  } as DOMRect)
}

describe('sentenceHitBottom', () => {
  it('does not treat a collapsed fall zone as a land (stale keyboard inset)', () => {
    const zone = document.createElement('div')
    const wrap = document.createElement('div')
    stubRect(zone, { top: 100, bottom: 100, height: 0 })
    stubRect(wrap, { top: 40, bottom: 100, height: 60 })

    expect(sentenceHitBottom(zone, wrap)).toBe(false)
  })

  it('detects land when the wrap reaches the zone bottom', () => {
    const zone = document.createElement('div')
    const wrap = document.createElement('div')
    stubRect(zone, { top: 0, bottom: 400, height: 400 })
    stubRect(wrap, { top: 340, bottom: 399, height: 59 })

    expect(sentenceHitBottom(zone, wrap)).toBe(true)
  })

  it('does not land while the wrap is still above the land line', () => {
    const zone = document.createElement('div')
    const wrap = document.createElement('div')
    stubRect(zone, { top: 0, bottom: 400, height: 400 })
    stubRect(wrap, { top: 20, bottom: 80, height: 60 })

    expect(sentenceHitBottom(zone, wrap)).toBe(false)
  })
})

describe('shouldTrustDomLandCheck', () => {
  it('disables DOM land while produce input is focused (keyboard retarget)', () => {
    expect(
      shouldTrustDomLandCheck({ inputFocused: true, keyboardOverlapPx: 0 }),
    ).toBe(false)
  })

  it('disables DOM land while keyboard overlap is shrinking the board', () => {
    expect(
      shouldTrustDomLandCheck({
        inputFocused: false,
        keyboardOverlapPx: 120,
      }),
    ).toBe(false)
  })

  it('allows DOM land when the board is stable', () => {
    expect(
      shouldTrustDomLandCheck({ inputFocused: false, keyboardOverlapPx: 0 }),
    ).toBe(true)
  })
})
