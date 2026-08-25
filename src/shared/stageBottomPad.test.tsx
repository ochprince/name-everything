import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import App from '../App'
import {
  defaultGrammarProgress,
  saveGrammarProgress,
} from '../features/grammar/lib/storage'
import { STAGE_BOTTOM_PAD } from './StageShell'

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

  it('nested stages keep document scroll (min-h-dvh) so window scroll restore works', () => {
    renderApp('/practice/pictures')
    const main = document.querySelector('main')
    expect(main).toHaveClass('min-h-dvh')
    expect(main).not.toHaveClass('h-dvh')
    expect(main).not.toHaveClass('overflow-hidden')
  })

  it('词汇记忆 primary actions sit on STAGE_BOTTOM_PAD only', () => {
    renderApp('/practice/pictures')
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
})
