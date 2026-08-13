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

  it('writes expandWord and expandZh into progress.settings', async () => {
    const user = userEvent.setup()
    render(<MePage />)

    const wordSwitch = screen.getByRole('switch', { name: '默认展开目标词' })
    const zhSwitch = screen.getByRole('switch', { name: '默认展开中文' })
    expect(wordSwitch).toHaveAttribute('aria-checked', 'false')
    expect(zhSwitch).toHaveAttribute('aria-checked', 'false')

    await user.click(wordSwitch)
    await user.click(zhSwitch)

    expect(wordSwitch).toHaveAttribute('aria-checked', 'true')
    expect(zhSwitch).toHaveAttribute('aria-checked', 'true')
    await waitFor(() => {
      expect(loadProgress().settings).toEqual({
        expandWord: true,
        expandZh: true,
      })
    })
  })
})
