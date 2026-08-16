import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { loadCards } from '../content/loadCards'
import { defaultProgress, loadProgress, saveProgress, todayKey } from '../lib/storage'
import { ReviewPage } from './ReviewPage'

beforeEach(() => {
  localStorage.clear()
})

describe('ReviewPage', () => {
  it('shows empty Forgot copy when the queue is empty', () => {
    render(<ReviewPage />)
    expect(
      screen.getByText('暂时没有 Forgot，去练习里诚实点一下吧'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: '记录' })).not.toBeInTheDocument()
  })

  it('removes a forgot card from the list after Got it', async () => {
    const user = userEvent.setup()
    const card = loadCards()[0]
    saveProgress({
      ...defaultProgress(),
      forgotIds: [card.id],
    })
    render(<ReviewPage />)

    expect(screen.getByText(card.sentence)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: card.sentence }))
    await user.click(screen.getByRole('button', { name: 'Got it' }))

    expect(screen.queryByText(card.sentence)).not.toBeInTheDocument()
    expect(
      screen.getByText('暂时没有 Forgot，去练习里诚实点一下吧'),
    ).toBeInTheDocument()
  })

  it('returns to the list from the overlay close control', async () => {
    const user = userEvent.setup()
    const card = loadCards()[0]
    saveProgress({
      ...defaultProgress(),
      forgotIds: [card.id],
    })
    render(<ReviewPage />)

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
    const card = loadCards()[0]
    saveProgress({
      ...defaultProgress(),
      forgotIds: [card.id],
    })
    render(<ReviewPage />)

    await user.click(screen.getByRole('button', { name: card.sentence }))
    await user.click(screen.getByRole('button', { name: 'Got it' }))

    const progress = loadProgress()
    expect(progress.forgotIds).not.toContain(card.id)
    expect(progress.warmIds).toContain(card.id)
    expect(progress.strongIds).not.toContain(card.id)
    expect(progress.gotItToday[todayKey()] ?? []).not.toContain(card.id)
  })
})
