import type { ReactNode } from 'react'

/** Matches StageShell sticky chrome: safe-area pad + header row + pb-2 */
export const STAGE_CHROME_OFFSET =
  'calc(max(1.25rem, env(safe-area-inset-top)) + 3.5rem)'

export function StageShell({
  children,
  header,
  headerTone = 'solid',
}: {
  children: ReactNode
  header?: ReactNode
  /** clear — transparent sticky chrome so page art can sit under the title */
  headerTone?: 'solid' | 'clear'
}) {
  return (
    <main
      data-seed="af3fdd03"
      className="relative z-0 min-h-dvh overflow-x-clip bg-cyc font-cue"
    >
      <div className="cyc-wash pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-28">
        {header ? (
          <div
            className={`sticky top-0 z-30 -mx-4 px-4 pb-2 pt-[max(1.25rem,env(safe-area-inset-top))] ${
              headerTone === 'clear'
                ? 'bg-gradient-to-b from-cyc/75 via-cyc/35 to-transparent'
                : 'bg-cyc/50'
            }`}
          >
            {header}
          </div>
        ) : null}
        {children}
      </div>
    </main>
  )
}
