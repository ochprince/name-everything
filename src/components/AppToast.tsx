import { useEffect, useState } from 'react'
import { subscribeToasts, type ToastMessage } from '../features/pictures/lib/toast'

export function AppToast() {
  const [toast, setToast] = useState<ToastMessage>(null)

  useEffect(() => subscribeToasts(setToast), [])

  if (!toast) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] z-[60] flex justify-center px-4"
    >
      <p className="max-w-sm rounded-2xl border border-day/20 bg-day px-4 py-2.5 text-center text-sm font-semibold tracking-[0.06em] text-cyc shadow-[0_12px_28px_-12px_rgba(0,0,0,0.55)]">
        {toast.text}
      </p>
    </div>
  )
}
