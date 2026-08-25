/** Ignore tiny overlaps from browser chrome / subpixel noise. */
export const KEYBOARD_OVERLAP_LOCK_PX = 48

/** How much of the layout viewport is covered by the on-screen keyboard (approx). */
export function readKeyboardOverlapPx(): number {
  const vv = window.visualViewport
  if (!vv) return 0
  return Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
}

/**
 * Undo iOS scroll-into-view when focusing inputs. The black gap after dismiss is
 * leftover scroll offset — pulling the page down manually "fixes" it the same way.
 */
export function pinLayoutToTop(): void {
  window.scrollTo(0, 0)
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}
