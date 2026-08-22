import { describe, expect, it, afterEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LearnListPage } from './LearnListPage'
import { renderWithProgress } from '../../../test/renderWithProgress'
import App from '../../../App'

const SCROLL_KEY = 'grammar/learn-list/scroll-y'
const PENDING_KEY = 'grammar/learn-list/scroll-pending'

function renderApp(initialEntry = '/') {
  return render(
    <MemoryRouter
      initialEntries={[initialEntry]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <App />
    </MemoryRouter>,
  )
}

describe('LearnListPage scroll restoration', () => {
  afterEach(() => {
    cleanup()
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('restores a saved scroll position on a pending return', async () => {
    sessionStorage.setItem(SCROLL_KEY, '420')
    sessionStorage.setItem(PENDING_KEY, '1')
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo

    renderWithProgress(<LearnListPage />)

    await new Promise((resolve) => requestAnimationFrame(resolve))
    expect(scrollTo).toHaveBeenCalledWith(0, 420)
    expect(sessionStorage.getItem(PENDING_KEY)).toBeNull()
  })

  it('does not scroll when a pending return has no saved position', async () => {
    sessionStorage.setItem(PENDING_KEY, '1')
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo

    renderWithProgress(<LearnListPage />)

    await new Promise((resolve) => requestAnimationFrame(resolve))
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('clears stale position and scrolls to top on a fresh entry (from home)', async () => {
    sessionStorage.setItem(SCROLL_KEY, '420')
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo
    const user = userEvent.setup()

    renderApp('/')
    await user.click(screen.getByRole('link', { name: /语法学习/ }))

    expect(screen.getByText('简单句')).toBeInTheDocument()
    expect(scrollTo).toHaveBeenCalledWith(0, 0)
    expect(sessionStorage.getItem(SCROLL_KEY)).toBeNull()
  })

  it('restores the scroll position when returning from a level page', async () => {
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo
    const user = userEvent.setup()

    renderApp('/')
    await user.click(screen.getByRole('link', { name: /语法学习/ }))
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      writable: true,
      value: 420,
    })
    await user.click(screen.getByRole('link', { name: /主谓 S\+V/ }))
    await user.click(screen.getByRole('link', { name: '返回' }))
    await new Promise((resolve) => requestAnimationFrame(resolve))

    expect(screen.getByText('简单句')).toBeInTheDocument()
    expect(scrollTo).toHaveBeenCalledWith(0, 420)
  })

  it('keeps the click-time position even if scrollY is clamped to 0 on unmount', async () => {
    const scrollTo = vi.fn()
    window.scrollTo = scrollTo
    const user = userEvent.setup()

    // In a real browser the level page's shorter DOM clamps window.scrollY
    // to 0 before the list unmounts; the position captured at click time
    // must survive that clamp.
    renderApp('/')
    await user.click(screen.getByRole('link', { name: /语法学习/ }))
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      writable: true,
      value: 420,
    })
    await user.click(screen.getByRole('link', { name: /主谓 S\+V/ }))
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      writable: true,
      value: 0,
    })
    await user.click(screen.getByRole('link', { name: '返回' }))
    await new Promise((resolve) => requestAnimationFrame(resolve))

    expect(screen.getByText('简单句')).toBeInTheDocument()
    expect(scrollTo).toHaveBeenCalledWith(0, 420)
  })
})
