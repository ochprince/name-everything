import { useLayoutEffect } from 'react'
import { PracticeCard } from '../components/PracticeCard'
import { loadCards } from '../content/loadCards'
import { useProgress } from '../hooks/useProgress'
import { pickNextCard } from '../lib/deck'
import {
  ackDailyContinue,
  currentSetView,
  markForgot,
  markGotIt,
  remainingPracticeCount,
  setPracticeCursor,
  todayKey,
  type ProgressState,
} from '../lib/storage'
import type { Card } from '../types/card'

function findCard(id: string | null): Card | null {
  if (!id) return null
  return loadCards().find((card) => card.id === id) ?? null
}

function pickAndCursor(progress: ProgressState): ProgressState {
  const picked = pickNextCard(
    loadCards(),
    progress,
    progress.recentPracticeTag,
  )
  if (!picked) return setPracticeCursor(progress, null, null)
  return setPracticeCursor(progress, picked.card.id, picked.recentTag)
}

function WrapScreen({
  title,
  action,
}: {
  title: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <article data-seed="af3fdd03" className="relative z-0 min-h-dvh overflow-x-clip font-cue">
      <div className="cyc-wash pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex h-dvh w-full max-w-md flex-col px-4 pb-28 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <header className="pt-2">
          <p className="text-center text-sm font-semibold tracking-[0.22em] text-day">
            Name Everything
          </p>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <p className="text-balance text-center text-3xl font-semibold tracking-[0.04em] text-day">
            {title}
          </p>
          {action ? (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex min-h-14 min-w-[12rem] items-center justify-center rounded-2xl bg-day px-6 font-cue text-lg font-semibold tracking-[0.08em] text-cyc transition-[filter] duration-200 ease-out hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day active:brightness-95"
            >
              {action.label}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export function PracticePage() {
  const { progress, update } = useProgress()
  const catalog = loadCards()
  const current = findCard(progress.currentCardId)
  const remaining = remainingPracticeCount(catalog, progress)
  const today = todayKey()
  const view = currentSetView(progress, remaining, today)

  useLayoutEffect(() => {
    if (view.wrap !== 'none') return
    if (current && !progress.strongIds.includes(current.id)) return
    if (remaining === 0) return
    update((p) => pickAndCursor(p))
  }, [current, progress.strongIds, remaining, update, view.wrap])

  function advanceAfter(mutate: (p: ProgressState) => ProgressState) {
    update((p) => pickAndCursor(mutate(p)))
  }

  if (view.wrap === 'pack') {
    return (
      <main className="relative z-0 min-h-dvh bg-cyc">
        <WrapScreen title="这一批都会了" />
      </main>
    )
  }

  if (view.wrap === 'daily') {
    return (
      <main className="relative z-0 min-h-dvh bg-cyc">
        <WrapScreen
          title="今日已完成"
          action={{
            label: '继续',
            onClick: () => {
              update((p) => pickAndCursor(ackDailyContinue(p, today)))
            },
          }}
        />
      </main>
    )
  }

  return (
    <main className="relative z-0 min-h-dvh bg-cyc">
      {current && !progress.strongIds.includes(current.id) ? (
        <PracticeCard
          key={current.id}
          card={current}
          progressLabel={`${view.gotInSet} / ${view.denom}`}
          hintLangDefault={progress.settings.hintLang}
          autoSpeak={progress.settings.autoSpeak}
          thinkHoldMs={progress.settings.thinkHoldMs}
          onGotIt={() => {
            advanceAfter((p) => markGotIt(p, current.id, today))
          }}
          onForgot={() => {
            advanceAfter((p) => markForgot(p, current.id, today))
          }}
          onTimeout={() => {
            update((p) => markForgot(p, current.id, today))
          }}
          onNext={() => {
            advanceAfter((p) => p)
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
