import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { loadCards } from '../content/loadCards'
import { defaultProgress, saveProgress } from '../lib/storage'
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
  })

  it('shows empty 记录 copy after switching to the pin queue', async () => {
    const user = userEvent.setup()
    render(<ReviewPage />)
    await user.click(screen.getByRole('tab', { name: '记录' }))
    expect(
      screen.getByText('点「记录」钉住想复习的卡片'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('暂时没有 Forgot，去练习里诚实点一下吧'),
    ).not.toBeInTheDocument()
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
})
