import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { ProgressProvider } from '../features/pictures/hooks/useProgress'

function renderNav() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <ProgressProvider>
        <BottomNav />
      </ProgressProvider>
    </MemoryRouter>,
  )
}

describe('BottomNav visual viewport sync', () => {
  const listeners = new Map<string, () => void>()
  let vv: {
    height: number
    offsetTop: number
    addEventListener: ReturnType<typeof vi.fn>
    removeEventListener: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    listeners.clear()
    vv = {
      height: 700,
      offsetTop: 0,
      addEventListener: vi.fn((type: string, cb: () => void) => {
        listeners.set(type, cb)
      }),
      removeEventListener: vi.fn(),
    }
    Object.defineProperty(window, 'visualViewport', {
      value: vv,
      configurable: true,
    })
    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      configurable: true,
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // jsdom 无 visualViewport，测试后清掉桩避免污染其他用例
    Reflect.deleteProperty(window, 'visualViewport')
  })

  it('keeps the nav pinned to the visual viewport bottom across viewport changes', () => {
    renderNav()
    const nav = screen.getByRole('navigation', { name: '主导航' })
    // 初始：innerHeight 800 - vv.height 700 = 100px 被浏览器 UI 遮挡 → bottom 98px（保留 -2px 过盈）
    expect(nav.style.bottom).toBe('98px')

    // 全屏：vv.height 变 800 → overlap 0 → bottom -2px
    vv.height = 800
    listeners.get('resize')?.()
    expect(nav.style.bottom).toBe('-2px')

    // URL 栏又出现：vv.height 变 720 → overlap 80 → bottom 78px
    vv.height = 720
    listeners.get('resize')?.()
    expect(nav.style.bottom).toBe('78px')
  })
})
