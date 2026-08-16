import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { loadCards } from '../content/loadCards'
import {
  defaultProgress,
  loadProgress,
  saveProgress,
} from '../lib/storage'
import { PracticePage } from './PracticePage'

beforeEach(() => {
  localStorage.clear()
})

describe('PracticePage', () => {
  it('advances on Got it and has no 记录 control', async () => {
    const user = userEvent.setup()
    render(<PracticePage />)

    expect(screen.getByText('今日 0')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: '记录' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '显示提示' }))
    const beforeId = loadProgress().currentCardId
    expect(beforeId).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Got it' }))
    expect(screen.getByText('今日 1')).toBeInTheDocument()
    expect(loadProgress().currentCardId).toBeTruthy()
    expect(loadProgress().currentCardId).not.toBe(beforeId)
  })

  it('keeps the same card after remount until Got it / Forgot', async () => {
    const user = userEvent.setup()
    const first = render(<PracticePage />)
    await user.click(screen.getByRole('button', { name: '显示提示' }))
    const word = screen.getByRole('heading', { level: 2 }).textContent
    const id = loadProgress().currentCardId
    expect(id).toBeTruthy()
    first.unmount()

    render(<PracticePage />)
    expect(loadProgress().currentCardId).toBe(id)
    await user.click(screen.getByRole('button', { name: '显示提示' }))
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
    await user.click(screen.getByRole('button', { name: '显示提示' }))
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      card.word,
    )
  })
})
