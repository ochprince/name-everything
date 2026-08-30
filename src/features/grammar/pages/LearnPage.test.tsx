import { describe, expect, it, afterEach, beforeEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../../App'

// jsdom 29 实现了 HTMLDialogElement 构造函数但未实现 showModal/close 方法——
// 补桩避免 open() 抛 TypeError 变成 unhandled error（Vitest 会报 false positive）。
if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.removeAttribute('open')
  }
}

function renderApp(initialEntry = '/practice/grammar/learn/sv-1') {
  return render(
    <MemoryRouter
      initialEntries={[initialEntry]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <App />
    </MemoryRouter>,
  )
}

describe('LearnPage report button', () => {
  beforeEach(() => {
    localStorage.clear()
    window.scrollTo = vi.fn()
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('shows a report button to the left of the medal badge', async () => {
    renderApp()

    const flag = await screen.findByRole('button', { name: '报错本关' })
    const badge = screen.getByLabelText(/最高/)

    // The flag button must sit before (left of) the medal/score badge.
    const position = flag.compareDocumentPosition(badge)
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('opens the dialog with the knowledge-point / example-sentence hint', async () => {
    const user = userEvent.setup()
    renderApp()

    const flag = await screen.findByRole('button', { name: '报错本关' })
    await user.click(flag)

    expect(
      screen.getByText('可反馈知识点问题，或建议补充游戏例句'),
    ).toBeInTheDocument()
  })
})
