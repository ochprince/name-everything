import { useState } from 'react'
import { PracticeCard } from '../components/PracticeCard'
import { loadCards } from '../content/loadCards'
import { useProgress } from '../hooks/useProgress'
import { pickNextCard } from '../lib/deck'
import {
  markForgot,
  markGotIt,
  todayKey,
  togglePin,
  type ProgressState,
} from '../lib/storage'
import type { Card } from '../types/card'

function advanceFrom(
  progress: ProgressState,
  recentTag: string | null,
): { current: Card | null; recentTag: string | null } {
  const picked = pickNextCard(loadCards(), progress, recentTag)
  return {
    current: picked?.card ?? null,
    recentTag: picked?.recentTag ?? null,
  }
}

export function PracticePage() {
  const { progress, update } = useProgress()
  const [hand, setHand] = useState(() => advanceFrom(progress, null))
  const { current, recentTag } = hand

  const todayCount = progress.gotItToday[todayKey()]?.length ?? 0

  function advance(nextProgress: ProgressState) {
    setHand(advanceFrom(nextProgress, recentTag))
  }

  return (
    <main className="relative min-h-dvh bg-cyc">
      <p className="pointer-events-none absolute right-4 top-6 z-10 font-cue text-sm font-semibold tracking-[0.2em] text-rose">
        今日 {todayCount}
      </p>
      {current ? (
        <PracticeCard
          card={current}
          pinned={progress.pinnedIds.includes(current.id)}
          expandWordDefault={progress.settings.expandWord}
          expandZhDefault={progress.settings.expandZh}
          onGotIt={() => {
            const next = markGotIt(progress, current.id, todayKey())
            update(() => next)
            advance(next)
          }}
          onForgot={() => {
            const next = markForgot(progress, current.id)
            update(() => next)
            advance(next)
          }}
          onTogglePin={() => {
            update((p) => togglePin(p, current.id))
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
