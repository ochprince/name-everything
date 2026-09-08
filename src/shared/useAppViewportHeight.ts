import { useEffect, useState } from 'react'
import { pinLayoutToTop, readKeyboardOverlapPx, KEYBOARD_OVERLAP_LOCK_PX } from './appViewport'
import {
  effectiveKeyboardOverlapPx,
  isEditableTarget,
} from './keyboardOverlap'

/** Live keyboard overlap in CSS pixels (0 when closed / no editable focused). */
export function useKeyboardOverlapPx(): number {
  const [overlap, setOverlap] = useState(0)

  useEffect(() => {
    const sync = () => {
      const focused = isEditableTarget(document.activeElement)
      setOverlap(
        effectiveKeyboardOverlapPx(readKeyboardOverlapPx(), focused),
      )
    }
    sync()
    const vv = window.visualViewport
    vv?.addEventListener('resize', sync)
    vv?.addEventListener('scroll', sync)
    window.addEventListener('resize', sync)
    document.addEventListener('focusin', sync)
    const onFocusOut = () => {
      // Blur first: drop inset immediately so a remounted board can't collapse.
      setOverlap(0)
      window.setTimeout(sync, 50)
      window.setTimeout(sync, 300)
      window.setTimeout(sync, 600)
    }
    window.addEventListener('focusout', onFocusOut)
    return () => {
      vv?.removeEventListener('resize', sync)
      vv?.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
      document.removeEventListener('focusin', sync)
      window.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  return overlap
}

/** Pin document scroll to top after keyboard dismiss (iOS leftover offset). */
export function usePinLayoutOnKeyboardDismiss(): void {
  useEffect(() => {
    const restore = () => {
      pinLayoutToTop()
      window.setTimeout(pinLayoutToTop, 50)
      window.setTimeout(pinLayoutToTop, 300)
      window.setTimeout(pinLayoutToTop, 600)
    }
    window.addEventListener('focusout', restore)
    return () => window.removeEventListener('focusout', restore)
  }, [])
}

/**
 * 输入框聚焦期间把页面钉在顶部（iOS 语法学习输入模式同款）。
 * iOS 聚焦底部输入框会把页面/可视视口整体滚上去（window.scrollY 或
 * visualViewport.offsetTop 变大），把上方内容顶出视野。这里不是键盘状态
 * 变化时钉一次，而是 enabled 期间常驻监听：focusin 先发制人钉顶，之后
 * window scroll / visualViewport scroll / resize 任一事件发现偏移或键盘
 * 已开就持续钉回，直到失焦或 enabled 变 false。
 */
export function usePinViewportWhileEditable(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return
    const pin = () => pinLayoutToTop()
    const onFocusIn = (event: FocusEvent) => {
      if (!isEditableTarget(event.target)) return
      pin()
      requestAnimationFrame(pin)
      window.setTimeout(pin, 50)
      window.setTimeout(pin, 300)
    }
    const onScroll = () => {
      if (
        window.scrollY > 0 ||
        (window.visualViewport?.offsetTop ?? 0) > 0 ||
        readKeyboardOverlapPx() > KEYBOARD_OVERLAP_LOCK_PX
      ) {
        pin()
      }
    }
    document.addEventListener('focusin', onFocusIn)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.visualViewport?.addEventListener('scroll', onScroll)
    window.visualViewport?.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('focusin', onFocusIn)
      window.removeEventListener('scroll', onScroll)
      window.visualViewport?.removeEventListener('scroll', onScroll)
      window.visualViewport?.removeEventListener('resize', onScroll)
      pin()
    }
  }, [enabled])
}
