import { describe, it, expect, beforeEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { loadProgress } from '../lib/storage'
import { PracticePage } from './PracticePage'

beforeEach(() => {
  localStorage.clear()
})

describe('PracticePage', () => {
  it('shows today got-it count, advances on Got it, and stays on 记录', async () => {
    const user = userEvent.setup()
    render(<PracticePage />)

    expect(screen.getByText('今日 0')).toBeInTheDocument()
    const sentence = screen.getByRole('heading', { level: 2 }).textContent
    expect(sentence).toBeTruthy()

    await user.click(screen.getByRole('button', { name: '记录' }))
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(sentence!)
    expect(screen.getByRole('button', { name: '已记录' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Got it' }))
    expect(screen.getByText('今日 1')).toBeInTheDocument()
  })

  it('keeps a pin when Got it is batched with 记录', () => {
    render(<PracticePage />)
    const pin = screen.getByRole('button', { name: '记录' })
    const gotIt = screen.getByRole('button', { name: 'Got it' })

    act(() => {
      pin.click()
      gotIt.click()
    })

    expect(loadProgress().pinnedIds).toHaveLength(1)
    expect(screen.getByText('今日 1')).toBeInTheDocument()
  })
})
