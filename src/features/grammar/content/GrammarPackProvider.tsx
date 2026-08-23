import { useEffect, useState, type ReactNode } from 'react'
import { fetchGrammarContentFromSupabase } from './fetchPackFromSupabase'
import {
  loadGameTuningFromJson,
  loadGrammarPackFromJson,
} from './loadPackFromJson'
import { isGrammarPackLoaded, setGrammarPack } from './packStore'
import { isGameTuningLoaded, setGameTuning } from './tuningStore'
import { isSupabaseConfigured } from '../../../lib/supabase'

type LoadState = 'loading' | 'ready' | 'error'

export function GrammarPackProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LoadState>(() =>
    isGrammarPackLoaded() && isGameTuningLoaded() ? 'ready' : 'loading',
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isGrammarPackLoaded() && isGameTuningLoaded()) {
      setState('ready')
      return
    }

    let cancelled = false

    async function load() {
      try {
        if (isSupabaseConfigured()) {
          const { pack, tuning } = await fetchGrammarContentFromSupabase()
          if (cancelled) return
          setGrammarPack(pack)
          setGameTuning(tuning)
        } else {
          setGrammarPack(loadGrammarPackFromJson())
          setGameTuning(loadGameTuningFromJson())
        }
        if (cancelled) return
        setState('ready')
      } catch (cause) {
        if (cancelled) return
        setError(cause instanceof Error ? cause.message : 'Failed to load grammar content')
        setState('error')
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (state === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cyc font-cue text-day">
        <p className="text-base font-medium tracking-[0.08em] text-day/80">加载语法内容…</p>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-cyc px-6 font-cue text-day">
        <p className="text-center text-base font-medium tracking-[0.04em]">
          语法内容加载失败
        </p>
        <p className="text-center text-sm text-day/70">{error}</p>
      </div>
    )
  }

  return children
}
