import { describe, expect, it } from 'vitest'
import {
  effectiveKeyboardOverlapPx,
  isEditableTarget,
} from './keyboardOverlap'

describe('effectiveKeyboardOverlapPx', () => {
  it('ignores stale visualViewport overlap when no input is focused', () => {
    expect(effectiveKeyboardOverlapPx(320, false)).toBe(0)
  })

  it('passes through overlap while an input is focused', () => {
    expect(effectiveKeyboardOverlapPx(320, true)).toBe(320)
  })

  it('clamps negative raw overlap to 0 when focused', () => {
    expect(effectiveKeyboardOverlapPx(-10, true)).toBe(0)
  })
})

describe('isEditableTarget', () => {
  it('recognizes textarea and input', () => {
    expect(isEditableTarget(document.createElement('textarea'))).toBe(true)
    expect(isEditableTarget(document.createElement('input'))).toBe(true)
    expect(isEditableTarget(document.createElement('div'))).toBe(false)
    expect(isEditableTarget(null)).toBe(false)
  })
})
