import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProgress } from '../test/renderWithProgress'
import { TEST_PICTURE_CARDS } from '../features/pictures/content/testCards'
import { defaultProgress, loadProgress, saveProgress, todayKey } from '../features/pictures/lib/storage'
import { ReviewPage } from './ReviewPage'

vi.mock('../features/pictures/content/fetchPictureWords', () => ({
  fetchPictureWordBatch: vi.fn(async () => TEST_PICTURE_CARDS),
  fetchPictureWordsByWords: vi.fn(async (words: string[]) =>
    TEST_PICTURE_CARDS.filter((c) => words.includes(c.id)),
  ),
}))

beforeEach(() => {
  localStorage.clear()
})

describe('ReviewPage', () => {
  it('shows empty Forgot copy when the queue is empty', async () => {
    renderWithProgress(<ReviewPage />)
    await waitFor(() => {
      expect(
        screen.getByText('暂时没有 Forgot，去练习里诚实点一下吧'),
      ).toBeInTheDocument()
    })
    expect(screen.queryByRole('tab', { name: '记录' })).not.toBeInTheDocument()
  })

  it('removes a forgot card from the list after Got it', async () => {
    const user = userEvent.setup()
    const card = TEST_PICTURE_CARDS[0]
    saveProgress({
      ...defaultProgress(),
      forgotIds: [card.id],
    })
    renderWithProgress(<ReviewPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: card.sentence })).toBeInTheDocument()
    })
    expect(screen.getByText(card.word, { selector: 'mark' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: card.sentence }))
    await user.click(screen.getByRole('button', { name: 'Got it' }))

    expect(screen.queryByText(card.sentence)).not.toBeInTheDocument()
    expect(
      screen.getByText('暂时没有 Forgot，去练习里诚实点一下吧'),
    ).toBeInTheDocument()
  })

  it('returns to the list from the overlay close control', async () => {
    const user = userEvent.setup()
    const card = TEST_PICTURE_CARDS[0]
    saveProgress({
      ...defaultProgress(),
      forgotIds: [card.id],
    })
    renderWithProgress(<ReviewPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: card.sentence })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: card.sentence }))
    expect(screen.getByRole('button', { name: 'Got it' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '返回列表' }))

    expect(
      screen.queryByRole('button', { name: 'Got it' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: card.sentence })).toBeInTheDocument()
  })

  it('review Got it leaves the card in the practice pool as 有点记忆', async () => {
    const user = userEvent.setup()
    const card = TEST_PICTURE_CARDS[0]
    saveProgress({
      ...defaultProgress(),
      forgotIds: [card.id],
    })
    renderWithProgress(<ReviewPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: card.sentence })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: card.sentence }))
    await user.click(screen.getByRole('button', { name: 'Got it' }))

    const progress = loadProgress()
    expect(progress.forgotIds).not.toContain(card.id)
    expect(progress.warmIds).toContain(card.id)
    expect(progress.strongIds).not.toContain(card.id)
    expect(progress.gotItToday[todayKey()] ?? []).not.toContain(card.id)
  })

  it('clears the review unseen badge when the page opens', async () => {
    const card = TEST_PICTURE_CARDS[0]
    saveProgress({
      ...defaultProgress(),
      forgotIds: [card.id],
      reviewUnseenCount: 3,
    })
    renderWithProgress(<ReviewPage />)
    await waitFor(() => {
      expect(loadProgress().reviewUnseenCount).toBe(0)
    })
  })

  it('leaves extra space under the queue so highlights clear the dawn wash', async () => {
    const card = TEST_PICTURE_CARDS[0]
    saveProgress({
      ...defaultProgress(),
      forgotIds: [card.id],
    })
    renderWithProgress(<ReviewPage />)
    await waitFor(() => {
      expect(document.getElementById('review-queue')).toHaveClass('pb-40')
    })
  })

  it('sizes the cyclorama to the viewport so the wash is not stretched by the list', async () => {
    const card = TEST_PICTURE_CARDS[0]
    saveProgress({
      ...defaultProgress(),
      forgotIds: [card.id],
    })
    renderWithProgress(<ReviewPage />)
    await waitFor(() => {
      const main = document.querySelector('main')
      expect(main).toHaveClass('h-dvh')
    })
    const main = document.querySelector('main')
    expect(main).toHaveClass('overflow-hidden')
    expect(main?.querySelector('.cyc-wash')).toHaveClass('absolute', 'inset-0')
  })
})
