import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  defaultProgress,
  loadProgress,
  saveProgress,
  todayKey,
} from '../lib/storage'
import { MePage } from './MePage'

beforeEach(() => {
  localStorage.clear()
})

describe('MePage', () => {
  it('shows today got-it count and streak count', () => {
    saveProgress({
      ...defaultProgress(),
      gotItToday: { [todayKey()]: ['cup', 'door', 'bag'] },
      streaks: { lastActiveDate: todayKey(), count: 4 },
    })
    render(<MePage />)
    expect(screen.getByText('今日已练')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('连续天数')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('writes hintLang into progress.settings', async () => {
    const user = userEvent.setup()
    render(<MePage />)

    const en = screen.getByRole('radio', { name: 'EN' })
    const zh = screen.getByRole('radio', { name: 'ZH' })
    expect(en).toHaveAttribute('aria-checked', 'true')
    expect(zh).toHaveAttribute('aria-checked', 'false')

    await user.click(zh)

    expect(zh).toHaveAttribute('aria-checked', 'true')
    await waitFor(() => {
      expect(loadProgress().settings).toEqual({
        hintLang: 'zh',
        autoSpeak: false,
        forgetHoldMs: 5000,
      })
    })
  })

  it('writes autoSpeak into progress.settings', async () => {
    const user = userEvent.setup()
    render(<MePage />)

    const toggle = screen.getByRole('switch', { name: '自动发音' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    await waitFor(() => {
      expect(loadProgress().settings.autoSpeak).toBe(true)
    })
  })

  it('writes forgetHoldMs into progress.settings', async () => {
    const user = userEvent.setup()
    render(<MePage />)

    const five = screen.getByRole('radio', { name: '5s' })
    const three = screen.getByRole('radio', { name: '3s' })
    expect(five).toHaveAttribute('aria-checked', 'true')

    await user.click(three)
    expect(three).toHaveAttribute('aria-checked', 'true')
    await waitFor(() => {
      expect(loadProgress().settings.forgetHoldMs).toBe(3000)
    })
  })
})
