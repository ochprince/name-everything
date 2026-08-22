import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { saveGrammarProgress, defaultGrammarProgress } from '../features/grammar/lib/storage'

beforeEach(() => {
  localStorage.clear()
})

function renderHome() {
  return render(
    <MemoryRouter
      initialEntries={['/']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <App />
    </MemoryRouter>,
  )
}

describe('practice home', () => {
  it('lists picture practice and grammar entries without starting a countdown', () => {
    renderHome()
    expect(screen.getByRole('heading', { name: '练习' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /词汇记忆/ })).toHaveAttribute(
      'href',
      '/practice/pictures',
    )
    expect(screen.getByRole('link', { name: /语法学习/ })).toHaveAttribute(
      'href',
      '/practice/grammar/learn',
    )
    expect(screen.queryByRole('button', { name: 'Aha!' })).not.toBeInTheDocument()
  })

  it('keeps 语法游戏 disabled until a level is passed', async () => {
    const user = userEvent.setup()
    renderHome()
    const tile = screen.getByTestId('tile-grammar-play')
    expect(tile).toHaveAttribute('aria-disabled', 'true')
    await user.click(tile)
    expect(screen.getByRole('status')).toHaveTextContent('先去语法学习过一关')
    expect(screen.getByRole('heading', { name: '练习' })).toBeInTheDocument()
  })

  it('opens 语法游戏 after a level is passed', () => {
    saveGrammarProgress({
      ...defaultGrammarProgress(),
      passedLevelIds: ['dative-1'],
      highScores: { 'dative-1': 3 },
    })
    renderHome()
    expect(screen.getByTestId('tile-grammar-play')).toHaveAttribute(
      'href',
      '/practice/grammar/play',
    )
  })

  it('shows last played level on grammar learn tile', () => {
    saveGrammarProgress({
      ...defaultGrammarProgress(),
      passedLevelIds: ['dative-1'],
      lastPlayedLevelId: 'dative-1',
      highScores: { 'dative-1': 3 },
    })
    renderHome()
    expect(screen.getByText('从例句开始学语法')).toBeInTheDocument()
    expect(screen.getByText('主谓双宾 S+V+IO+DO')).toBeInTheDocument()
  })

  it('shows last played level even when that level is not passed yet', () => {
    saveGrammarProgress({
      ...defaultGrammarProgress(),
      passedLevelIds: ['dative-1'],
      lastPlayedLevelId: 'svo-1',
      highScores: { 'dative-1': 3, 'svo-1': 1 },
    })
    renderHome()
    expect(screen.getByText('主谓宾 S+V+O')).toBeInTheDocument()
    expect(screen.queryByText('双宾 S+V+IO+DO')).not.toBeInTheDocument()
  })

  it('starts the picture loop only after choosing 词汇记忆', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.click(screen.getByRole('link', { name: /词汇记忆/ }))
    expect(screen.getByRole('link', { name: '返回' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('button', { name: 'Aha!' })).toBeInTheDocument()
  })
})
