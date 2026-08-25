import { describe, it, expect, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { act, render, screen } from '@testing-library/react'
import { StageShell, STAGE_CHROME_SCROLL_THRESHOLD } from './StageShell'

function renderShell() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <StageShell header={<span>语法学习</span>}>
        <div style={{ height: 2000 }}>content</div>
      </StageShell>
    </MemoryRouter>,
  )
}

function chromeEl() {
  return screen.getByText('语法学习').parentElement
}

function setScrollY(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
  act(() => {
    window.dispatchEvent(new Event('scroll'))
  })
}

afterEach(() => {
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
})

describe('StageShell sticky chrome scroll wash', () => {
  it('starts with the transparent gradient wash at the top', () => {
    renderShell()
    const chrome = chromeEl()
    expect(chrome?.className).toMatch(/from-cyc\/75/)
    expect(chrome?.className).not.toMatch(/(?:^|\s)bg-cyc(?:\s|$)/)
  })

  it('becomes solid bg-cyc after scrolling past the threshold', () => {
    renderShell()
    setScrollY(STAGE_CHROME_SCROLL_THRESHOLD)
    const chrome = chromeEl()
    expect(chrome?.className).toMatch(/(?:^|\s)bg-cyc(?:\s|$)/)
    expect(chrome?.className).not.toMatch(/from-cyc\/75/)
  })

  it('seals the sticky top edge when solid so light content cannot peek through', () => {
    renderShell()
    setScrollY(STAGE_CHROME_SCROLL_THRESHOLD)
    const chrome = chromeEl()
    expect(chrome?.className).toMatch(/\bstage-chrome-solid\b/)
    expect(chrome?.className).toMatch(/top-\[-2px\]/)
  })

  it('restores the gradient wash when scrolling back to the top', () => {
    renderShell()
    setScrollY(STAGE_CHROME_SCROLL_THRESHOLD)
    setScrollY(0)
    const chrome = chromeEl()
    expect(chrome?.className).toMatch(/from-cyc\/75/)
    expect(chrome?.className).not.toMatch(/(?:^|\s)bg-cyc(?:\s|$)/)
  })
})
