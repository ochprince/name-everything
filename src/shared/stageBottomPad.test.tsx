import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import App from '../App'
import {
  defaultGrammarProgress,
  saveGrammarProgress,
} from '../features/grammar/lib/storage'
import { STAGE_BOTTOM_PAD } from './StageShell'
import { TEST_PICTURE_CARDS } from '../features/pictures/content/testCards'

vi.mock('../features/pictures/content/fetchPictureWords', () => ({
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

function renderApp(path: string) {
  return render(
    <MemoryRouter
      initialEntries={[path]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <App />
    </MemoryRouter>,
  )
}

describe('stage primary CTA bottom inset', () => {
  it('exports a single pad token for stages without bottom nav', () => {
    expect(STAGE_BOTTOM_PAD).toBe('pb-6')
  })

  it('nested stages keep document scroll (min-h-dvh) so window scroll restore works', async () => {
    renderApp('/practice/pictures')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Aha!' })).toBeInTheDocument()
    })
    const main = document.querySelector('main')
    expect(main).toHaveClass('min-h-dvh')
    expect(main).not.toHaveClass('h-dvh')
    expect(main).not.toHaveClass('overflow-hidden')
  })

  it('词汇记忆 primary actions sit on STAGE_BOTTOM_PAD only', async () => {
    renderApp('/practice/pictures')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Aha!' })).toBeInTheDocument()
    })
    const row = screen.getByRole('button', { name: 'Aha!' }).parentElement
    expect(row?.parentElement?.className).toContain(STAGE_BOTTOM_PAD)
  })

  it('开始游戏 has no extra mb-4 — shell pad owns the inset', () => {
    renderApp('/practice/grammar/learn/sv-1')
    expect(screen.getByRole('link', { name: '开始游戏' }).className).not.toMatch(
      /\bmb-4\b/,
    )
  })

  it('开始挑战 has no extra mb-4 — shell pad owns the inset', () => {
    localStorage.setItem('grammar/arcade-rules-intro/v1', '1')
    saveGrammarProgress({
      ...defaultGrammarProgress(),
      passedLevelIds: ['dative-1'],
    })
    renderApp('/practice/grammar/play')
    expect(screen.getByRole('link', { name: '开始挑战' }).className).not.toMatch(
      /\bmb-4\b/,
    )
  })

  it('开始挑战 column does not reserve old bottom-nav height', () => {
    localStorage.setItem('grammar/arcade-rules-intro/v1', '1')
    saveGrammarProgress({
      ...defaultGrammarProgress(),
      passedLevelIds: ['dative-1'],
    })
    renderApp('/practice/grammar/play')
    const column = screen.getByRole('link', { name: '开始挑战' }).parentElement
    expect(column?.getAttribute('style') ?? '').not.toMatch(/7rem/)
  })

  it('挑战模式 locks viewport so 开始挑战 stays pinned while history scrolls', () => {
    localStorage.setItem('grammar/arcade-rules-intro/v1', '1')
    saveGrammarProgress({
      ...defaultGrammarProgress(),
      passedLevelIds: ['dative-1'],
      arcadeHistory: [
        {
          id: 'a1',
          at: '2026-08-25T12:00:00.000Z',
          score: 20,
          total: 25,
          cleared: false,
        },
      ],
    })
    renderApp('/practice/grammar/play')

    const main = document.querySelector('main')
    expect(main).toHaveClass('h-dvh')
    expect(main).toHaveClass('overflow-hidden')
    expect(main).not.toHaveClass('min-h-dvh')

    const history = screen.getByRole('list')
    expect(history.className).toMatch(/overflow-y-auto/)

    const cta = screen.getByRole('link', { name: '开始挑战' })
    expect(cta.className).toMatch(/shrink-0/)
    expect(cta.parentElement?.className).toMatch(/min-h-0/)
  })
})
