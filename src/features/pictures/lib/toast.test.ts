import { describe, it, expect, beforeEach, vi } from 'vitest'
import { pushToast, subscribeToasts, type ToastMessage } from './toast'

describe('toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('notifies subscribers and auto-dismisses', () => {
    const seen: ToastMessage[] = []
    const unsubscribe = subscribeToasts((toast) => {
      seen.push(toast)
    })
    expect(seen[0]).toBeNull()

    pushToast('已加入我的挑战')
    expect(seen.at(-1)?.text).toBe('已加入我的挑战')

    vi.advanceTimersByTime(2000)
    expect(seen.at(-1)).toBeNull()

    unsubscribe()
  })
})
