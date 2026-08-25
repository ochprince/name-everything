import { useEffect, useState } from 'react'
import { pinLayoutToTop, readKeyboardOverlapPx } from './appViewport'

/** Live keyboard overlap in CSS pixels (0 when closed). */
export function useKeyboardOverlapPx(): number {
  const [overlap, setOverlap] = useState(readKeyboardOverlapPx)

  useEffect(() => {
    const sync = () => setOverlap(readKeyboardOverlapPx())
    sync()
    const vv = window.visualViewport
    vv?.addEventListener('resize', sync)
    vv?.addEventListener('scroll', sync)
    window.addEventListener('resize', sync)
    const onFocusOut = () => {
      window.setTimeout(sync, 50)
      window.setTimeout(sync, 300)
      window.setTimeout(sync, 600)
    }
    window.addEventListener('focusout', onFocusOut)
    return () => {
      vv?.removeEventListener('resize', sync)
      vv?.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
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
