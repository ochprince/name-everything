import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { screen, act, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProgress } from '../../../test/renderWithProgress'
import { TEST_PICTURE_CARDS } from '../content/testCards'
import {
  defaultProgress,
  loadProgress,
  saveProgress,
  markGotIt,
  todayKey,
} from '../lib/storage'
import { PracticePage } from './PracticePage'

vi.mock('../content/fetchPictureWords', () => ({
  fetchPictureWordBatch: vi.fn(async (offset: number, limit: number) =>
    TEST_PICTURE_CARDS.slice(offset, offset + limit),
  ),
  fetchPictureWordsByWords: vi.fn(async (words: string[]) =>
    TEST_PICTURE_CARDS.filter((c) => words.includes(c.id)),
  ),
}))

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('PracticePage', () => {
  it('shows set progress and advances on Aha! then Got it', async () => {
    const user = userEvent.setup()
    renderWithProgress(<PracticePage />)

    await waitFor(() => {
      expect(screen.getByText('0 / 10')).toBeInTheDocument()
    })
    expect(
      screen.queryByRole('button', { name: '记录' }),
    ).not.toBeInTheDocument()

    const beforeId = loadProgress().currentCardId
    expect(beforeId).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Aha!' }))
    await user.click(screen.getByRole('button', { name: 'Got it' }))
    expect(screen.getByText('1 / 10')).toBeInTheDocument()
    expect(loadProgress().currentCardId).toBeTruthy()
    expect(loadProgress().currentCardId).not.toBe(beforeId)
    expect(loadProgress().strongIds).toContain(beforeId)
  })

  it('keeps the same card after remount until Got it / Forgot / timeout', async () => {
    const user = userEvent.setup()
    const first = renderWithProgress(<PracticePage />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Aha!' })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: 'Aha!' }))
    const word = screen.getByRole('heading', { level: 2 }).textContent
    const id = loadProgress().currentCardId
    expect(id).toBeTruthy()
    first.unmount()

    renderWithProgress(<PracticePage />)
    await waitFor(() => {
      expect(loadProgress().currentCardId).toBe(id)
    })
    await user.click(screen.getByRole('button', { name: 'Aha!' }))
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(word!)
  })

  it('restores a saved currentCardId on first paint', async () => {
    const user = userEvent.setup()
    const card = TEST_PICTURE_CARDS[0]
    saveProgress({
      ...defaultProgress(),
      currentCardId: card.id,
      recentPracticeTag: card.tags[0] ?? null,
    })
    renderWithProgress(<PracticePage />)
    await waitFor(() => {
      expect(loadProgress().currentCardId).toBe(card.id)
    })
    await user.click(screen.getByRole('button', { name: 'Aha!' }))
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      card.word,
    )
  })

  it('timeout enqueues Forgot and waits for Next before advancing', async () => {
    vi.useFakeTimers()
    renderWithProgress(<PracticePage />)
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    const id = loadProgress().currentCardId
    expect(id).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Aha!' })).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
    expect(loadProgress().forgotIds).toContain(id)
    expect(loadProgress().reviewUnseenCount).toBe(1)
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Aha!' })).not.toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(loadProgress().currentCardId).not.toBe(id)
    expect(screen.getByRole('button', { name: 'Aha!' })).toBeInTheDocument()
  })

  it('does not restore a timeout card after leaving practice', async () => {
    vi.useFakeTimers()
    const first = renderWithProgress(<PracticePage />)
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    const id = loadProgress().currentCardId
    expect(id).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
    first.unmount()
    vi.useRealTimers()

    renderWithProgress(<PracticePage />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Aha!' })).toBeInTheDocument()
    })
    expect(loadProgress().currentCardId).not.toBe(id)
  })

  it('shows 今日已完成 after 10 practice Got its and Continue starts the next set', async () => {
    const user = userEvent.setup()
    const catalog = TEST_PICTURE_CARDS
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
    renderWithProgress(<PracticePage />)

    await waitFor(() => {
      expect(screen.getByText('今日已完成')).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: 'Aha!' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '继续' }))
    expect(screen.getByText('10 / 10')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aha!' })).toBeInTheDocument()
  })

  it('shows 这一批都会了 when every card is strong and no next batch', async () => {
    const catalog = TEST_PICTURE_CARDS
    saveProgress({
      ...defaultProgress(),
      strongIds: catalog.map((card) => card.id),
    })
    renderWithProgress(<PracticePage />)
    await waitFor(() => {
      expect(screen.getByText('这一批都会了')).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: '继续' })).not.toBeInTheDocument()
  })

  it('shows 请先复习 when the batch is only forgot', async () => {
    saveProgress({
      ...defaultProgress(),
      forgotIds: TEST_PICTURE_CARDS.map((c) => c.id),
    })
    renderWithProgress(<PracticePage />)
    await waitFor(() => {
      expect(screen.getByText('请先复习')).toBeInTheDocument()
    })
  })
})
