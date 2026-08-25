import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { showsBottomNav } from '../components/BottomNav'

const DEFAULT_HINT_MS = 1000

export function useStageHint(durationMs = DEFAULT_HINT_MS) {
  const [hint, setHint] = useState<{ msg: string; id: number } | null>(null)

  const showHint = useCallback((msg: string) => {
    setHint({ msg, id: Date.now() })
  }, [])

  useEffect(() => {
    if (!hint) return
    const id = window.setTimeout(() => setHint(null), durationMs)
    return () => window.clearTimeout(id)
  }, [hint, durationMs])

  return { hint: hint?.msg ?? null, showHint }
}

export function StageHint({ message }: { message: string | null }) {
  const { pathname } = useLocation()
  if (!message) return null

  const bottom = showsBottomNav(pathname)
    ? 'bottom-[calc(5.75rem+env(safe-area-inset-bottom))]'
    : 'bottom-[calc(1.5rem+env(safe-area-inset-bottom))]'

  return (
    <p
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-0 z-40 mx-auto w-full max-w-md px-4 ${bottom} text-center`}
    >
      <span className="inline-block rounded-2xl border border-rose/30 bg-cyc/95 px-4 py-2 text-base font-medium tracking-[0.04em] text-rose shadow-[0_8px_24px_-8px_rgba(0,0,0,0.65)]">
        {message}
      </span>
    </p>
  )
}
