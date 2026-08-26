import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { PracticeCard } from '../components/PracticeCard'
import {
  fetchPictureWordBatch,
  fetchPictureWordsByWords,
} from '../content/fetchPictureWords'
import {
  BATCH_SIZE,
  batchFullyStrong,
  buildPracticePool,
  needsReviewPrompt,
} from '../content/practicePool'
import { useProgress } from '../hooks/useProgress'
import { pickNextCard } from '../lib/deck'
import { StageShell } from '../../../shared/StageShell'
import { StageHeader } from '../../../shared/StageHeader'
import {
  ackDailyContinue,
  currentSetView,
  markForgot,
  markGotIt,
  remainingPracticeCount,
  setBatchOffset,
  setPracticeCursor,
  todayKey,
  type ProgressState,
} from '../lib/storage'
import type { Card } from '../../../types/card'

function WrapScreen({
  title,
  action,
}: {
  title: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <StageShell header={<StageHeader backTo="/" title="词汇记忆" />}>
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
    </StageShell>
  )
}

export function PracticePage() {
  const { progress, update } = useProgress()
  const [batchCards, setBatchCards] = useState<Card[]>([])
  const [warmExtra, setWarmExtra] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [catalogDone, setCatalogDone] = useState(false)
  const [heldCard, setHeldCard] = useState<Card | null>(null)
  const advancingRef = useRef(false)

  const practicePool = useMemo(
    () => buildPracticePool(batchCards, warmExtra, progress),
    [batchCards, warmExtra, progress],
  )

  const batchRemaining = remainingPracticeCount(batchCards, progress)
  const remainingForView =
    catalogDone || batchCards.length === 0
      ? batchRemaining
      : batchFullyStrong(batchCards, progress)
        ? 1
        : batchRemaining
  const today = todayKey()
  const view = currentSetView(progress, remainingForView, today)
  const reviewPrompt = needsReviewPrompt(batchCards, practicePool, progress)

  const cardById = useMemo(() => {
    const map = new Map<string, Card>()
    for (const card of [...batchCards, ...warmExtra]) map.set(card.id, card)
    return map
  }, [batchCards, warmExtra])

  const current = progress.currentCardId
    ? (cardById.get(progress.currentCardId) ?? null)
    : null
  const shown = heldCard ?? current

  const warmIdsKey = progress.warmIds.join('\0')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const batch = await fetchPictureWordBatch(
          progress.batchOffset,
          BATCH_SIZE,
        )
        if (cancelled) return
        setBatchCards(batch)
        setCatalogDone(batch.length === 0)

        const batchIds = new Set(batch.map((c) => c.id))
        const warmMissing = progress.warmIds.filter((id) => !batchIds.has(id))
        const extras =
          warmMissing.length > 0
            ? await fetchPictureWordsByWords(warmMissing)
            : []
        if (cancelled) return
        setWarmExtra(extras)
      } catch (err) {
        if (cancelled) return
        setLoadError(err instanceof Error ? err.message : String(err))
        setBatchCards([])
        setWarmExtra([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
    // warmIdsKey: stable string so Got it / Forgot array identity does not refetch
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional warmIdsKey
  }, [progress.batchOffset, warmIdsKey])

  useLayoutEffect(() => {
    if (loading || loadError || catalogDone) return
    if (view.wrap !== 'none') return

    if (batchFullyStrong(batchCards, progress) && batchCards.length > 0) {
      if (advancingRef.current) return
      advancingRef.current = true
      void (async () => {
        try {
          const next = await fetchPictureWordBatch(
            progress.batchOffset + BATCH_SIZE,
            BATCH_SIZE,
          )
          if (next.length > 0) {
            update((p) => setBatchOffset(p, p.batchOffset + BATCH_SIZE))
          } else {
            setCatalogDone(true)
          }
        } catch (err) {
          setLoadError(err instanceof Error ? err.message : String(err))
        } finally {
          advancingRef.current = false
        }
      })()
      return
    }

    if (reviewPrompt) return

    const inPool =
      current && practicePool.some((card) => card.id === current.id)
    if (inPool) return
    if (practicePool.length === 0) return

    update((p) => {
      const picked = pickNextCard(practicePool, p, p.recentPracticeTag)
      if (!picked) return setPracticeCursor(p, null, null)
      return setPracticeCursor(p, picked.card.id, picked.recentTag)
    })
  }, [
    loading,
    loadError,
    catalogDone,
    view.wrap,
    batchCards,
    progress,
    practicePool,
    current,
    reviewPrompt,
    update,
  ])

  function advanceAfter(mutate: (p: ProgressState) => ProgressState) {
    update((p) => {
      const next = mutate(p)
      const pool = buildPracticePool(batchCards, warmExtra, next)
      const picked = pickNextCard(pool, next, next.recentPracticeTag)
      if (!picked) return setPracticeCursor(next, null, null)
      return setPracticeCursor(next, picked.card.id, picked.recentTag)
    })
  }

  if (loading) {
    return <WrapScreen title="加载中…" />
  }

  if (loadError) {
    return <WrapScreen title="词库加载失败" />
  }

  if (
    catalogDone &&
    (batchCards.length === 0 || batchFullyStrong(batchCards, progress))
  ) {
    return <WrapScreen title="这一批都会了" />
  }

  if (
    batchFullyStrong(batchCards, progress) &&
    batchCards.length > 0 &&
    !catalogDone
  ) {
    return <WrapScreen title="加载中…" />
  }

  if (view.wrap === 'pack') {
    return <WrapScreen title="这一批都会了" />
  }

  if (view.wrap === 'daily') {
    return (
      <WrapScreen
        title="今日已完成"
        action={{
          label: '继续',
          onClick: () => {
            update((p) => {
              const next = ackDailyContinue(p, today)
              const pool = buildPracticePool(batchCards, warmExtra, next)
              const picked = pickNextCard(pool, next, next.recentPracticeTag)
              if (!picked) return setPracticeCursor(next, null, null)
              return setPracticeCursor(next, picked.card.id, picked.recentTag)
            })
          },
        }}
      />
    )
  }

  if (reviewPrompt) {
    return <WrapScreen title="请先复习" />
  }

  return (
    <main className="relative z-0 min-h-dvh bg-cyc">
      {shown && !progress.strongIds.includes(shown.id) ? (
        <PracticeCard
          key={shown.id}
          card={shown}
          backTo="/"
          stageTitle="词汇记忆"
          progressLabel={`${view.gotInSet} / ${view.denom}`}
          hintLangDefault={progress.settings.hintLang}
          autoSpeak={progress.settings.autoSpeak}
          thinkHoldMs={progress.settings.thinkHoldMs}
          onGotIt={() => {
            setHeldCard(null)
            advanceAfter((p) => markGotIt(p, shown.id, today))
          }}
          onForgot={() => {
            setHeldCard(null)
            advanceAfter((p) => markForgot(p, shown.id, today))
          }}
          onTimeout={() => {
            setHeldCard(shown)
            update((p) => {
              const next = markForgot(p, shown.id, today)
              const pool = buildPracticePool(batchCards, warmExtra, next)
              const picked = pickNextCard(pool, next, next.recentPracticeTag)
              if (!picked) return setPracticeCursor(next, null, null)
              return setPracticeCursor(next, picked.card.id, picked.recentTag)
            })
          }}
          onNext={() => {
            setHeldCard(null)
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
