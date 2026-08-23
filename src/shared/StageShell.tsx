import type { ReactNode } from 'react'

export function StageShell({
  children,
  header,
}: {
  children: ReactNode
  header?: ReactNode
}) {
  return (
    <main
      data-seed="af3fdd03"
      className="relative z-0 min-h-dvh overflow-x-clip bg-cyc font-cue"
    >
      <div className="cyc-wash pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-28">
        {header ? (
          <div className="sticky top-0 z-30 -mx-4 bg-cyc/50 px-4 pb-2 pt-[max(1.25rem,env(safe-area-inset-top))]">
            {header}
          </div>
        ) : null}
        {children}
      </div>
    </main>
  )
}
