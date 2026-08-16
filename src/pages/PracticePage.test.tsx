import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { loadCards } from '../content/loadCards'
import {
  defaultProgress,
  loadProgress,
  saveProgress,
  markGotIt,
  todayKey,
} from '../lib/storage'
import { PracticePage } from './PracticePage'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('PracticePage', () => {
  it('shows set progress and advances on Find it then Got it', async () => {
    const user = userEvent.setup()
    render(<PracticePage />)

    expect(screen.getByText('0 / 10')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '记录' }),
    ).not.toBeInTheDocument()

    const beforeId = loadProgress().currentCardId
    expect(beforeId).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Find it' }))
    await user.click(screen.getByRole('button', { name: 'Got it' }))
    expect(screen.getByText('1 / 10')).toBeInTheDocument()
    expect(loadProgress().currentCardId).toBeTruthy()
    expect(loadProgress().currentCardId).not.toBe(beforeId)
    expect(loadProgress().strongIds).toContain(beforeId)
  })

  it('keeps the same card after remount until Got it / Forgot / timeout', async () => {
    const user = userEvent.setup()
    const first = render(<PracticePage />)
    await user.click(screen.getByRole('button', { name: 'Find it' }))
    const word = screen.getByRole('heading', { level: 2 }).textContent
    const id = loadProgress().currentCardId
    expect(id).toBeTruthy()
    first.unmount()

    render(<PracticePage />)
    expect(loadProgress().currentCardId).toBe(id)
    await user.click(screen.getByRole('button', { name: 'Find it' }))
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(word!)
  })

  it('restores a saved currentCardId on first paint', async () => {
    const user = userEvent.setup()
    const card = loadCards()[0]
    saveProgress({
      ...defaultProgress(),
      currentCardId: card.id,
      recentPracticeTag: card.tags[0] ?? null,
    })
    render(<PracticePage />)
    expect(loadProgress().currentCardId).toBe(card.id)
    await user.click(screen.getByRole('button', { name: 'Find it' }))
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      card.word,
    )
  })

  it('timeout enqueues Forgot and advances without showing the word', () => {
    vi.useFakeTimers()
    render(<PracticePage />)
    const id = loadProgress().currentCardId
    expect(id).toBeTruthy()
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(loadProgress().forgotIds).toContain(id)
    expect(loadProgress().currentCardId).not.toBe(id)
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Find it' })).toBeInTheDocument()
  })

  it('shows 今日已完成 after 10 practice Got its and Continue starts the next set', async () => {
    const user = userEvent.setup()
    const catalog = loadCards()
    const today = todayKey()
    let progress = defaultProgress()
    for (const card of catalog.slice(0, 10)) {
      progress = markGotIt(progress, card.id, today)
    }
    progress = {
      ...progress,
      currentCardId: catalog[9].id,
      recentPracticeTag: catalog[9].tags[0] ?? null,
    }
    saveProgress(progress)
    render(<PracticePage />)

    expect(screen.getByText('今日已完成')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Find it' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '继续' }))
    expect(screen.getByText('0 / 10')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Find it' })).toBeInTheDocument()
  })

  it('shows 这一批都会了 when every card is 较好记忆', () => {
    const catalog = loadCards()
    const today = todayKey()
    let progress = defaultProgress()
    for (const card of catalog) {
      progress = markGotIt(progress, card.id, today)
    }
    saveProgress(progress)
    render(<PracticePage />)
    expect(screen.getByText('这一批都会了')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '继续' })).not.toBeInTheDocument()
  })
})
