import type { ReactNode } from 'react'
import { BackButton, BackLink } from './BackLink'

const sideSlot = 'inline-flex min-h-11 min-w-[3rem] items-center'

/** Stable title chrome — same grid on every stage so the center title does not drift. */
export function StageHeader({
  title,
  backTo,
  onBack,
  trailing,
}: {
  title: string
  backTo?: string
  /** Prefer over backTo when leaving a sheet / overlay without routing. */
  onBack?: () => void
  trailing?: ReactNode
}) {
  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 pt-1">
      <div className={`${sideSlot} justify-self-start`}>
        {onBack ? (
          <BackButton onClick={onBack} aria-label="返回列表" />
        ) : backTo ? (
          <BackLink to={backTo} />
        ) : null}
      </div>
      <h1 className="text-center text-sm font-semibold tracking-[0.22em] text-day">
        {title}
      </h1>
      <div className={`${sideSlot} justify-self-end`}>{trailing ?? null}</div>
    </header>
  )
}

/** Sticky pack for pages that do not use StageShell (复习 / 我的). */
export function StickyStageChrome({ children }: { children: ReactNode }) {
  return (
    <div className="sticky top-0 z-30 -mx-4 bg-cyc/50 px-4 pb-2 pt-[max(1.25rem,env(safe-area-inset-top))]">
      {children}
    </div>
  )
}
