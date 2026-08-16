import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

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
    expect(screen.getByRole('link', { name: '练习' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: '复习' })).toHaveAttribute('href', '/review')
    expect(screen.getByRole('link', { name: '我的' })).toHaveAttribute('href', '/me')
  })

  it('keeps bottom nav on 我的', () => {
    renderApp('/me')
    expect(screen.getByRole('navigation', { name: '主导航' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '我的' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('marks 复习 current after navigating to /review', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('link', { name: '复习' }))
    expect(screen.getByRole('link', { name: '复习' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: '练习' })).not.toHaveAttribute(
      'aria-current',
    )
  })
})
