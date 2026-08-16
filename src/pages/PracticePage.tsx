import { useLayoutEffect } from 'react'
import { PracticeCard } from '../components/PracticeCard'
import { loadCards } from '../content/loadCards'
import { useProgress } from '../hooks/useProgress'
import { pickNextCard } from '../lib/deck'
import {
  markForgot,
  markGotIt,
  setPracticeCursor,
  todayKey,
  type ProgressState,
} from '../lib/storage'
import type { Card } from '../types/card'

function findCard(id: string | null): Card | null {
  if (!id) return null
  return loadCards().find((card) => card.id === id) ?? null
}

function pickAndCursor(
  progress: ProgressState,
): ProgressState {
  const picked = pickNextCard(
    loadCards(),
    progress,
    progress.recentPracticeTag,
  )
  if (!picked) return setPracticeCursor(progress, null, null)
  return setPracticeCursor(progress, picked.card.id, picked.recentTag)
}

export function PracticePage() {
  const { progress, update } = useProgress()
  const current = findCard(progress.currentCardId)
  const todayCount = progress.gotItToday[todayKey()]?.length ?? 0

  useLayoutEffect(() => {
    if (current) return
    update((p) => pickAndCursor(p))
  }, [current, update])

  function advanceAfter(mutate: (p: ProgressState) => ProgressState) {
    update((p) => pickAndCursor(mutate(p)))
  }

  return (
    <main className="relative z-0 min-h-dvh bg-cyc">
      {current ? (
        <PracticeCard
          key={current.id}
          card={current}
          todayCount={todayCount}
          hintLangDefault={progress.settings.hintLang}
          autoSpeak={progress.settings.autoSpeak}
          forgetHoldMs={progress.settings.forgetHoldMs}
          onGotIt={() => {
            advanceAfter((p) => markGotIt(p, current.id, todayKey()))
          }}
          onForgot={() => {
            advanceAfter((p) => markForgot(p, current.id))
          }}
        />
      ) : (
        <>
          <div className="cyc-wash pointer-events-none absolute inset-0" />
          <p className="relative px-4 pt-24 text-center font-cue text-sm font-semibold tracking-[0.28em] text-rose">
            没有卡片
          </p>
        </>
      )}
    </main>
  )
}
