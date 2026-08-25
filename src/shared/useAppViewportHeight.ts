import { useEffect, useState } from 'react'
import { pinLayoutToTop, readKeyboardOverlapPx } from './appViewport'
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
