import { describe, expect, it, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { LearnListPage } from './LearnListPage'
import { renderWithProgress } from '../../../test/renderWithProgress'

const SCROLL_KEY = 'grammar/learn-list/scroll-y'

describe('LearnListPage scroll restoration', () => {
  afterEach(() => {
    cleanup()
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('restores a saved scroll position on mount', async () => {
    sessionStorage.setItem(SCROLL_KEY, '420')
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo

    renderWithProgress(<LearnListPage />)

    await new Promise((resolve) => requestAnimationFrame(resolve))
    expect(scrollTo).toHaveBeenCalledWith(0, 420)
  })

  it('does not scroll when no position was saved', async () => {
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo

    renderWithProgress(<LearnListPage />)

    await new Promise((resolve) => requestAnimationFrame(resolve))
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('saves the current scroll position on unmount', () => {
    const { unmount } = renderWithProgress(<LearnListPage />)

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      writable: true,
      value: 777,
    })
    unmount()

    expect(sessionStorage.getItem(SCROLL_KEY)).toBe('777')
  })
})
