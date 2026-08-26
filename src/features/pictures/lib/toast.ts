export type ToastMessage = { id: string; text: string } | null

type Listener = (toast: ToastMessage) => void

const listeners = new Set<Listener>()
let timer: ReturnType<typeof setTimeout> | null = null
let current: ToastMessage = null

function emit(toast: ToastMessage) {
  current = toast
  listeners.forEach((listener) => listener(toast))
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener)
  listener(current)
  return () => {
    listeners.delete(listener)
  }
}

export function pushToast(text: string, durationMs = 1800) {
  if (timer !== null) {
    clearTimeout(timer)
    timer = null
  }
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `toast-${Date.now()}`
  emit({ id, text })
  timer = setTimeout(() => {
    timer = null
    emit(null)
  }, durationMs)
}
