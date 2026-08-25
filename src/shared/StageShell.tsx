import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { showsBottomNav } from '../components/BottomNav'

/** Matches StageShell sticky chrome: safe-area pad + header row + pb-2 */
export const STAGE_CHROME_OFFSET =
  'calc(max(1.25rem, env(safe-area-inset-top)) + 3.5rem)'

/** Shared sticky title wash — soft cyc fade so page art can show through. */
export const STAGE_CHROME_CLASS =
  'sticky top-0 z-30 -mx-4 bg-gradient-to-b from-cyc/75 via-cyc/35 to-transparent px-4 pb-2 pt-[max(1.25rem,env(safe-area-inset-top))]'

/** Bottom inset for stages without BottomNav — primary CTAs must not add extra mb-*. */
export const STAGE_BOTTOM_PAD = 'pb-6'

export function StageShell({
  children,
  header,
}: {
  children: ReactNode
  header?: ReactNode
}) {
  const { pathname } = useLocation()
  const bottomPad = showsBottomNav(pathname) ? 'pb-28' : STAGE_BOTTOM_PAD

  return (
    <main
      data-seed="af3fdd03"
      className="relative z-0 min-h-dvh overflow-x-clip bg-cyc font-cue"
    >
      <div className="cyc-wash pointer-events-none absolute inset-0" />
      <div
        className={`relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 ${bottomPad}`}
      >
        {header ? <div className={STAGE_CHROME_CLASS}>{header}</div> : null}
        {children}
      </div>
    </main>
  )
}
