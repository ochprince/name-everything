import { useCallback, useEffect, useState } from 'react'
import {
  loadProgress,
  saveProgress,
  type ProgressState,
} from '../lib/storage'

export function useProgress() {
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress())

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  const update = useCallback((fn: (p: ProgressState) => ProgressState) => {
    setProgress((p) => fn(p))
  }, [])

  return { progress, update }
}
