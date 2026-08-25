import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  KEYBOARD_OVERLAP_LOCK_PX,
  pinLayoutToTop,
  readKeyboardOverlapPx,
} from './appViewport'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('appViewport keyboard helpers', () => {
  it('readKeyboardOverlapPx is layout height minus visible viewport', () => {
    vi.stubGlobal('innerHeight', 800)
    vi.stubGlobal('visualViewport', {
      height: 500,
      offsetTop: 40,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    expect(readKeyboardOverlapPx()).toBe(260)
    expect(KEYBOARD_OVERLAP_LOCK_PX).toBe(48)
  })

  it('pinLayoutToTop resets window and document scroll positions', () => {
    const scrollTo = vi.fn()
    vi.stubGlobal('scrollTo', scrollTo)
    document.documentElement.scrollTop = 40
    document.body.scrollTop = 40
    pinLayoutToTop()
    expect(scrollTo).toHaveBeenCalledWith(0, 0)
    expect(document.documentElement.scrollTop).toBe(0)
    expect(document.body.scrollTop).toBe(0)
  })
})
