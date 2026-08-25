import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { showsBottomNav } from '../components/BottomNav'

/** Matches StageShell sticky chrome: safe-area pad + header row + pb-2 */
export const STAGE_CHROME_OFFSET =
  'calc(max(1.25rem, env(safe-area-inset-top)) + 3.5rem)'

/** Scroll past this Y before sticky chrome goes solid. ~half chrome height. */
export const STAGE_CHROME_SCROLL_THRESHOLD = 40

const STAGE_CHROME_LAYOUT = 'sticky z-30 -mx-4 px-4 pb-2'

const STAGE_CHROME_TOP =
  'top-0 pt-[max(1.25rem,env(safe-area-inset-top))]'

/** Pull 2px past the stick edge + matching pad so solid fill covers the hairline gap. */
const STAGE_CHROME_TOP_SOLID =
  'top-[-2px] pt-[max(calc(1.25rem+2px),calc(env(safe-area-inset-top)+2px))] stage-chrome-solid'

const STAGE_CHROME_WASH =
  'bg-gradient-to-b from-cyc/75 via-cyc/35 to-transparent'

/** Shared sticky title wash — soft cyc fade so page art can show through (top of page). */
export const STAGE_CHROME_CLASS = `${STAGE_CHROME_LAYOUT} ${STAGE_CHROME_TOP} ${STAGE_CHROME_WASH}`

/** Bottom inset for stages without BottomNav — primary CTAs must not add extra mb-*. */
export const STAGE_BOTTOM_PAD = 'pb-6'

/** Sticky chrome that goes solid bg-cyc once the page scrolls past the threshold. */
export function StageChrome({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.scrollY >= STAGE_CHROME_SCROLL_THRESHOLD,
  )

  useEffect(() => {
    const sync = () => {
      setScrolled(window.scrollY >= STAGE_CHROME_SCROLL_THRESHOLD)
    }
    sync()
    window.addEventListener('scroll', sync, { passive: true })
    return () => window.removeEventListener('scroll', sync)
  }, [])

  return (
    <div
      className={`${STAGE_CHROME_LAYOUT} ${
        scrolled
          ? `${STAGE_CHROME_TOP_SOLID} bg-cyc`
          : `${STAGE_CHROME_TOP} ${STAGE_CHROME_WASH}`
      }`}
    >
      {children}
    </div>
  )
}

export function StageShell({
  children,
  header,
  lockViewport = false,
}: {
  children: ReactNode
  header?: ReactNode
  /**
   * Pin the stage to the viewport (h-dvh, no document scroll) so children can
   * use flex-1 + overflow scroll with a pinned footer CTA.
   */
  lockViewport?: boolean
}) {
  const { pathname } = useLocation()
  const withBottomNav = showsBottomNav(pathname)
  const bottomPad = withBottomNav ? 'pb-28' : STAGE_BOTTOM_PAD

  const column = (
    <div
      className={`relative mx-auto flex w-full max-w-md flex-col px-4 ${bottomPad} ${
        withBottomNav
          ? 'min-h-full'
          : lockViewport
            ? 'h-full min-h-0'
            : 'min-h-dvh'
      }`}
    >
      {header ? <StageChrome>{header}</StageChrome> : null}
      {children}
    </div>
  )

  // Bottom-nav tabs scroll inside the viewport (same as 复习 / 我的) so the
  // scrollbar stops above the fixed nav instead of running the full window.
  if (withBottomNav) {
    return (
      <main
        data-seed="af3fdd03"
        className="relative z-0 h-dvh overflow-hidden bg-cyc font-cue"
      >
        <div className="cyc-wash pointer-events-none absolute inset-0" />
        <div className="relative h-full overflow-x-clip overflow-y-auto">
          {column}
        </div>
      </main>
    )
  }

  // Locked stages (e.g. 挑战模式 hub) keep the footer CTA pinned; only an
  // inner region may scroll — no document/window scroll.
  if (lockViewport) {
    return (
      <main
        data-seed="af3fdd03"
        className="relative z-0 h-dvh overflow-hidden bg-cyc font-cue"
      >
        <div className="cyc-wash pointer-events-none absolute inset-0" />
        {column}
      </main>
    )
  }

  return (
    <main
      data-seed="af3fdd03"
      className="relative z-0 min-h-dvh overflow-x-clip bg-cyc font-cue"
    >
      <div className="cyc-wash pointer-events-none absolute inset-0" />
      {column}
    </main>
  )
}
