import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { StageShell } from '../../../shared/StageShell'
import { StageHeader } from '../../../shared/StageHeader'
import { ReportDialog } from '../components/ReportDialog'
import { LivesHearts } from '../components/LivesHearts'
import {
  anchorForLevel,
  levelById,
  playablesForLevel,
  pointById,
  sentenceById,
  slotsForSentence,
  grammarPack,
  type Sentence,
} from '../content/pack'
import {
  recordArcadeRun,
  recordLevelScore,
  useGrammarProgress,
} from '../lib/storage'
import {
  advanceSlot,
  applyCorrectBounce,
  applyWrong,
  beginSentence,
  buildQueue,
  isQueueFullyCleared,
  land,
  nextSentenceId,
  slotOptions,
  startRound,
  tick,
  type FallingState,
} from '../lib/engine'
import {
  arcadeEarnedTrophy,
  arcadeFallDurationMs,
  arcadeGroupNumber,
  buildArcadeQueue,
  shouldShowGroupSpeedBanner,
} from '../lib/arcadeChallenge'
import {
  bounceSentenceUp,
  resetSentenceMotion,
  shatterSentence,
} from '../lib/fallingMotion'
import gsap from 'gsap'
import { fallDurationFor, isLevelUnlocked, livesFor, nextLevelAfter, thresholdFor } from '../lib/unlock'
import { gameTuning } from '../content/tuning'
import { playUiCorrect, playUiFail, playUiSuccess, playUiTap, unlockUiSound } from '../../../shared/uiSound'
import { GroupSpeedBanner } from '../components/GroupSpeedBanner'
import { LevelPassTrophy } from '../components/LevelPassTrophy'

type SentenceOutcome = 'cleared' | 'failed'

type SentenceResult = {
  outcome: SentenceOutcome
  sentenceId: string
}

/** 提示底边落到底部蓝线时的进度（0→1 对应 start%→100%） */
const FALL_START_PERCENT = 10

function fallProgressToTop(progress: number): number {
  return FALL_START_PERCENT + progress * (100 - FALL_START_PERCENT)
}

function sentenceHitBottom(zoneEl: HTMLElement, wrapEl: HTMLElement): boolean {
  return (
    wrapEl.getBoundingClientRect().bottom >=
    zoneEl.getBoundingClientRect().bottom - 2
  )
}

export function FallingPlayPage({ mode }: { mode: 'level' | 'arcade' }) {
  const { levelId = '' } = useParams()
  const location = useLocation()
  const progress = useGrammarProgress()

  if (mode === 'arcade' && progress.passedLevelIds.length === 0) {
    return <Navigate to="/" replace />
  }

  const level = mode === 'level' ? levelById(levelId) : undefined
  if (mode === 'level' && (!level || !isLevelUnlocked(level, progress))) {
    return <Navigate to="/practice/grammar/learn" replace />
  }

  const pool =
    mode === 'level' && level
      ? {
          anchor: anchorForLevel(level.id),
          playables: playablesForLevel(level.id),
        }
      : {
          anchor: undefined,
          playables: grammarPack.sentences.filter(
            (sentence) =>
              sentence.kind === 'playable' &&
              progress.passedLevelIds.includes(sentence.level_id),
          ),
        }

  if (pool.playables.length === 0 && !pool.anchor) {
    return <Navigate to="/" replace />
  }

  return (
    <FallingBoard
      mode={mode}
      levelId={level?.id}
      backTo={
        mode === 'level'
          ? `/practice/grammar/learn/${levelId}`
          : '/practice/grammar/play'
      }
      lives={level ? livesFor(level) : undefined}
      fallMs={level ? fallDurationFor(level) : undefined}
      threshold={level ? thresholdFor(level) : undefined}
      queueSeed={`${mode}:${levelId}:${location.key}`}
      pool={pool}
      arcadePoolSize={mode === 'arcade' ? pool.playables.length : undefined}
    />
  )
}

function FallingBoard({
  mode,
  levelId,
  backTo,
  lives,
  fallMs,
  threshold,
  queueSeed,
  pool,
  arcadePoolSize,
}: {
  mode: 'level' | 'arcade'
  levelId?: string
  backTo: string
  lives?: number
  fallMs?: number
  threshold?: number
  queueSeed: string
  pool: {
    anchor: ReturnType<typeof anchorForLevel>
    playables: ReturnType<typeof playablesForLevel>
  }
  arcadePoolSize?: number
}) {
  const queue = useMemo(() => {
    if (mode === 'arcade') return buildArcadeQueue(pool.playables)
    return buildQueue(mode, pool.anchor, pool.playables)
  }, [mode, pool.anchor, pool.playables, queueSeed])
  const firstId = queue[0]
  const initialFallMs =
    mode === 'arcade' ? arcadeFallDurationMs(0) : fallMs
  const [state, setState] = useState<FallingState | null>(() =>
    firstId ? startRound(firstId, lives, initialFallMs) : null,
  )
  const [options, setOptions] = useState<string[]>([])
  const [sentenceResult, setSentenceResult] = useState<SentenceResult | null>(null)
  const [clearedIds, setClearedIds] = useState<Set<string>>(() => new Set())
  const [groupBanner, setGroupBanner] = useState<number | null>(null)
  const usedRef = useRef<string[]>(firstId ? [firstId] : [])
  const settled = useRef(false)
  const pendingAdvanceRef = useRef<(() => void) | null>(null)
  const fallZoneRef = useRef<HTMLDivElement>(null)
  const sentenceWrapRef = useRef<HTMLDivElement>(null)
  const sentenceRef = useRef<HTMLParagraphElement>(null)
  const bottomHandledRef = useRef(false)
  const stateRef = useRef(state)
  const sentenceResultRef = useRef(sentenceResult)

  stateRef.current = state
  sentenceResultRef.current = sentenceResult

  const allQueueCleared = isQueueFullyCleared(queue, clearedIds)
  const sentencesLeft = queue.filter((id) => !clearedIds.has(id)).length

  const sentence = state?.sentenceId ? sentenceById(state.sentenceId) : undefined
  const resultSentence = sentenceResult
    ? sentenceById(sentenceResult.sentenceId)
    : undefined
  const slots = sentence ? slotsForSentence(sentence.id) : []
  const slot = slots[state?.slotIndex ?? 0]

  useEffect(() => {
    if (!slot) return
    setOptions(slotOptions(slot))
  }, [slot?.id])

  const triggerLandFail = useCallback(() => {
    if (bottomHandledRef.current || sentenceResultRef.current) return
    const current = stateRef.current
    if (!current || current.status !== 'playing' || !current.sentenceId) return

    bottomHandledRef.current = true
    const failId = current.sentenceId
    const landed = land({ ...current, remainingMs: 0 })
    stateRef.current = landed
    setState(landed)
    if (sentenceRef.current) shatterSentence(sentenceRef.current)
    setSentenceResult({ outcome: 'failed', sentenceId: failId })
  }, [])

  useEffect(() => {
    resetSentenceMotion(sentenceRef.current)
    bottomHandledRef.current = false
  }, [state?.sentenceId, state?.slotIndex])

  useEffect(() => {
    if (!state || state.status !== 'playing' || sentenceResult) return

    let frame = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = now - last
      last = now
      setState((current) => {
        if (!current || current.status !== 'playing') return current
        return tick(current, dt)
      })
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [state?.status, state?.sentenceId, sentenceResult])

  useLayoutEffect(() => {
    if (sentenceResultRef.current) return
    const current = stateRef.current
    if (!current || current.status !== 'playing') return
    if (bottomHandledRef.current) return

    const hitByTime = current.remainingMs <= 0
    const zone = fallZoneRef.current
    const wrap = sentenceWrapRef.current
    const hitByDom = zone && wrap ? sentenceHitBottom(zone, wrap) : false

    if (hitByTime || hitByDom) {
      triggerLandFail()
    }
  })

  useLayoutEffect(() => {
    if (!state || state.status !== 'over' || settled.current) return
    settled.current = true
    if (mode === 'level' && levelId && threshold !== undefined) {
      recordLevelScore(levelId, state.score, threshold)
    }
    if (mode === 'arcade' && arcadePoolSize !== undefined) {
      const cleared = isQueueFullyCleared(queue, clearedIds)
      recordArcadeRun(state.score, queue.length, cleared, arcadePoolSize)
    }
  }, [state, mode, levelId, threshold, queue, clearedIds, arcadePoolSize])

  if (!state || !firstId) {
    return <Navigate to={backTo} replace />
  }

  const round = state
  const maxLives = lives ?? gameTuning.lives
  const fallT =
    round.fallDurationMs <= 0
      ? 1
      : 1 - Math.max(0, round.remainingMs) / round.fallDurationMs

  function pick(option: string) {
    unlockUiSound()
    if (!slot || round.status !== 'playing' || sentenceResult) return
    if (option !== slot.correct) {
      playUiFail()
      if (sentenceRef.current) gsap.killTweensOf(sentenceRef.current)
      setState((current) => (current ? applyWrong(current) : current))
      return
    }
    setState((current) => {
      if (!current) return current
      const next = advanceSlot(current, slots.length)
      if (next.score > current.score && current.sentenceId) {
        bottomHandledRef.current = true
        setClearedIds((prev) => new Set(prev).add(current.sentenceId!))
        playUiSuccess()
        setSentenceResult({ outcome: 'cleared', sentenceId: current.sentenceId })
        return next
      }
      const bounced = applyCorrectBounce(next)
      bottomHandledRef.current = false
      playUiCorrect()
      if (sentenceRef.current) bounceSentenceUp(sentenceRef.current)
      return bounced
    })
  }

  function advanceToNextSentence() {
    if (!state) return

    if (state.status === 'over') return

    if (allQueueCleared) {
      setState((current) => (current ? { ...current, status: 'over' } : current))
      return
    }

    const nextId = nextSentenceId(queue, state.sentenceId, usedRef.current, clearedIds)
    if (!nextId) {
      setState((current) => (current ? { ...current, status: 'over' } : current))
      return
    }
    if (!usedRef.current.includes(nextId)) {
      usedRef.current = [...usedRef.current, nextId]
    }
    const nextFallMs =
      mode === 'arcade'
        ? arcadeFallDurationMs(clearedIds.size)
        : fallMs
    setState((current) =>
      current ? beginSentence(current, nextId, nextFallMs) : current,
    )
  }

  function continueAfterSentence() {
    if (!state || !sentenceResult) return
    playUiTap()
    setSentenceResult(null)

    const hasMoreSentences = !allQueueCleared && state.status !== 'over'
    if (
      mode === 'arcade' &&
      shouldShowGroupSpeedBanner(clearedIds.size, hasMoreSentences)
    ) {
      pendingAdvanceRef.current = advanceToNextSentence
      setGroupBanner(arcadeGroupNumber(clearedIds.size))
      return
    }

    advanceToNextSentence()
  }

  function handleGroupBannerComplete() {
    setGroupBanner(null)
    const advance = pendingAdvanceRef.current
    pendingAdvanceRef.current = null
    advance?.()
  }

  if (sentenceResult && resultSentence) {
    return (
      <SentenceResultScreen
        outcome={sentenceResult.outcome}
        sentence={resultSentence}
        lives={state.lives}
        maxLives={maxLives}
        gameOver={state.status === 'over'}
        showSettlement={state.status === 'over' || allQueueCleared}
        onNext={continueAfterSentence}
        backTo={backTo}
      />
    )
  }

  if (state.status === 'over') {
    const passed =
      mode === 'level' && threshold !== undefined && state.score >= threshold
    const nextLevel =
      mode === 'level' && passed && levelId ? nextLevelAfter(levelId) : null
    const nextTopic = nextLevel ? pointById(nextLevel.grammar_point_id) : undefined
    const sessionCleared =
      mode === 'arcade' && isQueueFullyCleared(queue, clearedIds)
    const earnedTrophy =
      mode === 'arcade' &&
      arcadePoolSize !== undefined &&
      arcadeEarnedTrophy(sessionCleared, queue.length, arcadePoolSize)

    return (
      <StageShell
        header={<StageHeader backTo={backTo} title="结算" />}
      >
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          {mode === 'arcade' ? (
            <>
              <p className="text-3xl font-semibold tracking-[0.04em] text-day">
                {sessionCleared ? '挑战成功' : `本局 ${state.score} 句`}
              </p>
              {sessionCleared ? (
                <p className="text-lg font-medium text-day/80">
                  完成 {state.score}/{queue.length} 句
                </p>
              ) : null}
              {earnedTrophy ? (
                <div className="flex flex-col items-center gap-2">
                  <LevelPassTrophy />
                  <p className="text-base font-medium tracking-[0.06em] text-gold">
                    获得奖杯
                  </p>
                </div>
              ) : null}
              {sessionCleared && !earnedTrophy ? (
                <p className="text-base font-medium tracking-[0.04em] text-day/70">
                  句子库未满 30 句，暂无奖杯
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-3xl font-semibold tracking-[0.04em] text-day">
              完成 {state.score} 句
            </p>
          )}
          {mode === 'level' ? (
            <>
              <p className="text-lg font-medium text-rose">
                {passed ? '过关了' : `还差，过关要 ${threshold} 句`}
              </p>
              {passed ? (
                <LivesHearts count={state.lives} max={maxLives} size="md" />
              ) : null}
            </>
          ) : null}
          <div className="flex w-full max-w-sm flex-col gap-3">
            {nextLevel ? (
              <Link
                to={`/practice/grammar/learn/${nextLevel.id}`}
                onClick={() => playUiTap()}
                className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-day px-6 text-lg font-semibold tracking-[0.08em] text-cyc transition-[filter] duration-200 ease-out hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day active:brightness-95"
              >
                下一关：{nextTopic?.title_zh ?? nextLevel.id}
              </Link>
            ) : null}
            <Link
              to={backTo}
              className={`inline-flex min-h-14 items-center justify-center rounded-2xl px-6 text-lg font-semibold tracking-[0.08em] transition-[filter] duration-200 ease-out hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day active:brightness-95 ${
                nextLevel
                  ? 'border border-day/75 text-day hover:bg-day/10'
                  : 'bg-day text-cyc'
              }`}
            >
              返回
            </Link>
          </div>
        </div>
      </StageShell>
    )
  }

  return (
    <>
      {groupBanner !== null ? (
        <GroupSpeedBanner
          groupNumber={groupBanner}
          onComplete={handleGroupBannerComplete}
        />
      ) : null}
      <StageShell
        header={
          <StageHeader
            backTo={backTo}
            title={
              mode === 'arcade'
                ? `第 ${arcadeGroupNumber(clearedIds.size)} 组 · 还剩 ${sentencesLeft} 句`
                : `还剩 ${sentencesLeft} 句`
            }
            trailing={<LivesHearts count={state.lives} max={maxLives} size="sm" />}
          />
        }
      >
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div ref={fallZoneRef} className="relative min-h-[14rem] flex-1 overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cobalt to-transparent opacity-80"
          />
          {sentence ? (
            <div
              ref={sentenceWrapRef}
              className="pointer-events-none absolute inset-x-4"
              style={{
                top: `${fallProgressToTop(fallT)}%`,
                transform: 'translateY(-100%)',
              }}
            >
              <p
                ref={sentenceRef}
                className={`text-center text-2xl font-medium leading-snug tracking-[0.01em] will-change-transform ${
                  state.lastWrong ? 'text-rose' : 'text-day'
                }`}
              >
                {sentence.zh}
              </p>
            </div>
          ) : null}
        </div>
        <div className="mt-2 rounded-2xl border border-day/20 bg-cyc/40 px-3 py-4">
          <div className="grid grid-cols-2 gap-2">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => pick(option)}
                className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-day/75 bg-cyc px-3 text-lg font-semibold tracking-[0.04em] text-day transition-[filter,background-color] duration-200 ease-out hover:border-day hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day active:brightness-95"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
      </StageShell>
    </>
  )
}

function SentenceResultScreen({
  outcome,
  sentence,
  lives,
  maxLives,
  gameOver,
  showSettlement,
  onNext,
  backTo,
}: {
  outcome: SentenceOutcome
  sentence: Sentence
  lives: number
  maxLives: number
  gameOver: boolean
  showSettlement: boolean
  onNext: () => void
  backTo: string
}) {
  const cleared = outcome === 'cleared'

  useEffect(() => {
    if (outcome !== 'failed') return
    playUiFail()
  }, [outcome, sentence.id])

  return (
    <StageShell
      header={
        <StageHeader
          backTo={backTo}
          title="本句"
          trailing={
            <ReportDialog
              target={{
                asset_type: 'sentence',
                asset_id: sentence.id,
                level_id: sentence.level_id,
              }}
              label="报错本句"
            />
          }
        />
      }
    >
      <div className="flex flex-1 flex-col gap-6 pt-10">
        <p
          className={`text-center text-2xl font-semibold tracking-[0.04em] ${
            cleared ? 'text-day' : 'text-rose'
          }`}
        >
          {cleared ? '成功' : '失败'}
        </p>
        <div className="rounded-2xl bg-day px-4 py-4 text-cyc">
          <p className="text-lg font-medium tracking-[0.02em] text-cyc/75">{sentence.zh}</p>
          <p className="mt-3 text-2xl font-medium leading-snug tracking-[0.01em]">
            {sentence.en}
          </p>
        </div>
        {!cleared && !gameOver ? (
          <div className="flex justify-center">
            <LivesHearts count={lives} max={maxLives} size="md" />
          </div>
        ) : null}
        <button
          type="button"
          onClick={onNext}
          className="mt-auto mb-4 inline-flex min-h-14 items-center justify-center rounded-2xl bg-day px-6 text-lg font-semibold tracking-[0.08em] text-cyc transition-[filter] duration-200 ease-out hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day active:brightness-95"
        >
          {showSettlement ? '查看结算' : '下一句'}
        </button>
      </div>
    </StageShell>
  )
}
