import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProgress } from '../test/renderWithProgress'
import {
  defaultProgress,
  loadProgress,
  saveProgress,
  todayKey,
} from '../features/pictures/lib/storage'
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
    renderWithProgress(<MePage />)
    expect(screen.getByText('今日已练')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('连续天数')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('writes hintLang into progress.settings', async () => {
    const user = userEvent.setup()
    renderWithProgress(<MePage />)

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
      thinkHoldMs: 5000,
      uiSound: true,
      produceRatio: 50,
    })
    })
  })

  it('writes uiSound into progress.settings', async () => {
    const user = userEvent.setup()
    renderWithProgress(<MePage />)

    const toggle = screen.getByRole('switch', { name: '音效' })
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    await waitFor(() => {
      expect(loadProgress().settings.uiSound).toBe(false)
    })
  })

  it('writes autoSpeak into progress.settings', async () => {
    const user = userEvent.setup()
    renderWithProgress(<MePage />)

    const toggle = screen.getByRole('switch', { name: '自动发音' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    await waitFor(() => {
      expect(loadProgress().settings.autoSpeak).toBe(true)
    })
  })

  it('writes thinkHoldMs into progress.settings', async () => {
    const user = userEvent.setup()
    renderWithProgress(<MePage />)

    const five = screen.getByRole('radio', { name: '5s' })
    const three = screen.getByRole('radio', { name: '3s' })
    expect(five).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: '15s' })).toBeInTheDocument()
    expect(screen.getByText('思考时长')).toBeInTheDocument()

    await user.click(three)
    expect(three).toHaveAttribute('aria-checked', 'true')
    await waitFor(() => {
      expect(loadProgress().settings.thinkHoldMs).toBe(3000)
    })
  })

  it('writes produceRatio into progress.settings', async () => {
    const user = userEvent.setup()
    renderWithProgress(<MePage />)

    const half = screen.getByRole('radio', { name: '50%' })
    const all = screen.getByRole('radio', { name: '100%' })
    expect(half).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: '0%' })).toBeInTheDocument()
    expect(screen.getByText('输入模式占比')).toBeInTheDocument()

    await user.click(all)
    expect(all).toHaveAttribute('aria-checked', 'true')
    await waitFor(() => {
      expect(loadProgress().settings.produceRatio).toBe(100)
    })
  })
})
