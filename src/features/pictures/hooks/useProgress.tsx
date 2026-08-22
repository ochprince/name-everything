import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  loadProgress,
  saveProgress,
  type ProgressState,
} from '../lib/storage'

type ProgressContextValue = {
  progress: ProgressState
  update: (fn: (p: ProgressState) => ProgressState) => void
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress())

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  const update = useCallback((fn: (p: ProgressState) => ProgressState) => {
    setProgress((p) => fn(p))
  }, [])

  const value = useMemo(() => ({ progress, update }), [progress, update])
  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  )
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) {
    throw new Error('useProgress must be used within ProgressProvider')
  }
  return ctx
}
