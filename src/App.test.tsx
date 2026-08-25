import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { defaultProgress, saveProgress } from './features/pictures/lib/storage'
import {
  defaultGrammarProgress,
  saveGrammarProgress,
} from './features/grammar/lib/storage'

beforeEach(() => {
  localStorage.clear()
})

function renderApp(path = '/') {
  return render(
    <MemoryRouter
      initialEntries={[path]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <App />
    </MemoryRouter>,
  )
}

describe('app shell routes', () => {
  it('shows 练习, 复习, and 我的 nav links', () => {
    renderApp()
    expect(screen.getByRole('link', { name: /练习/ })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: /复习/ })).toHaveAttribute('href', '/review')
    expect(screen.getByRole('link', { name: /我的/ })).toHaveAttribute('href', '/me')
  })

  it('keeps bottom nav on 我的', () => {
    renderApp('/me')
    expect(screen.getByRole('navigation', { name: '主导航' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /我的/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('keeps bottom nav on 复习', () => {
    renderApp('/review')
    expect(screen.getByRole('navigation', { name: '主导航' })).toBeInTheDocument()
  })

  it.each(['/practice/pictures', '/practice/grammar/learn'])(
    'hides bottom nav on %s',
    (path) => {
      renderApp(path)
      expect(
        screen.queryByRole('navigation', { name: '主导航' }),
      ).not.toBeInTheDocument()
    },
  )

  it('hides bottom nav on 挑战模式', () => {
    localStorage.setItem('grammar/arcade-rules-intro/v1', '1')
    saveGrammarProgress({
      ...defaultGrammarProgress(),
      passedLevelIds: ['dative-1'],
    })
    renderApp('/practice/grammar/play')
    expect(
      screen.queryByRole('navigation', { name: '主导航' }),
    ).not.toBeInTheDocument()
  })

  it('marks 复习 current after navigating to /review', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('link', { name: /复习/ }))
    expect(screen.getByRole('link', { name: /复习/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: /练习/ })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('shows a review unseen count and clears it after opening 复习', async () => {
    const user = userEvent.setup()
    saveProgress({
      ...defaultProgress(),
      forgotIds: ['ladder'],
      reviewUnseenCount: 2,
    })
    renderApp()
    expect(screen.getByTestId('review-unseen')).toHaveTextContent('2')
    await user.click(screen.getByRole('link', { name: /复习/ }))
    expect(screen.queryByTestId('review-unseen')).not.toBeInTheDocument()
  })
})
