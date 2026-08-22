import type { ReactNode } from 'react'
import { BackLink } from './BackLink'

const sideSlot = 'inline-flex min-h-11 min-w-[3rem] items-center'

export function StageHeader({
  title,
  backTo,
  trailing,
}: {
  title: string
  backTo?: string
  trailing?: ReactNode
}) {
  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 pt-1">
      <div className={`${sideSlot} justify-self-start`}>
        {backTo ? <BackLink to={backTo} /> : null}
      </div>
      <h1 className="text-center text-sm font-semibold tracking-[0.22em] text-day">
        {title}
      </h1>
      <div className={`${sideSlot} justify-self-end`}>{trailing ?? null}</div>
    </header>
  )
}
