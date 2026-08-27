import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { StageShell, STAGE_CHROME_OFFSET } from '../../../shared/StageShell'
import { StageHeader } from '../../../shared/StageHeader'
import {
  useKeyboardOverlapPx,
  usePinLayoutOnKeyboardDismiss,
} from '../../../shared/useAppViewportHeight'
import {
  KEYBOARD_OVERLAP_LOCK_PX,
  pinLayoutToTop,
  readKeyboardOverlapPx,
} from '../../../shared/appViewport'
import { isEditableTarget } from '../../../shared/keyboardOverlap'
import { ReportDialog } from '../components/ReportDialog'
import { LivesHearts } from '../components/LivesHearts'
import { FallingAnswerPad } from '../components/FallingAnswerPad'
import { sentenceHitBottom, shouldTrustDomLandCheck } from '../lib/fallingCollision'
import {
  clearsResultBeforeAdvance,
  planAfterSentence,
} from '../lib/afterSentencePlan'
import {
  anchorForLevel,
  levelById,
  playablesForLevel,
  pointById,
  sentenceById,
  slotsForSentence,
  grammarPack,
} from '../content/pack'
import {
  recordArcadeRun,
  recordLevelScore,
  useGrammarProgress,
} from '../lib/storage'
import { recordMyChallengeRun } from '../../pictures/lib/myChallengeProgress'
import {
  pickVocabAnswerMode,
  type VocabPlayable,
} from '../../pictures/lib/vocabChallenge'
import type { Sentence, SentenceSlot } from '../content/types'
import {
  advanceSlot,
  applyCorrectBounce,
  applyWrong,
  beginSentence,
  buildQueue,
  isQueueFullyCleared,
  land,
  markCleared,
  nextSentenceId,
  pickAnswerMode,
  slotOptions,
  startRound,
  tick,
  type AnswerMode,
  type FallingState,
  MAX_WRONG_PER_SENTENCE,
} from '../lib/engine'
import { englishAnswersMatch } from '../lib/englishAnswerCompare'
import { buildProduceHints } from '../lib/produceHints'
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
import { loadProgress } from '../../pictures/lib/storage'
import { playUiCorrect, playUiFail, playUiSuccess, playUiTap, unlockUiSound } from '../../../shared/uiSound'
import { GroupSpeedBanner } from '../components/GroupSpeedBanner'
import { LevelPassTrophy } from '../components/LevelPassTrophy'
import { fireMultiBurst, fireSingleBurst, playLetdown, shakeTitle } from '../lib/celebrate'

type SentenceOutcome = 'cleared' | 'failed'

type SentenceResult = {
  outcome: SentenceOutcome
  sentenceId: string
}

/** 提示底边落到底部蓝线时的进度（0→1 对应 start%→100%） */
const FALL_START_PERCENT = 10

/** 选项区到屏幕底的空隙（离底留白；会话页无底栏） */
const GAME_BOTTOM_GAP_PX = 32

const SAFE_BOTTOM = 'max(0.5rem, env(safe-area-inset-bottom))'

/**
 * rAF 单帧增量上限（毫秒）。iOS Safari 后台时 rAF 暂停，恢复首帧的
 * now - last 等于后台全部时长；超出此上限视为「后台挂起恢复」，不计入
 * 下落时间，防止剩余时间被一次扣光触发落底失败（切回前台突然播失败音效）。
 */
const MAX_FRAME_DT_MS = 250

function fallProgressToTop(progress: number): number {
  return FALL_START_PERCENT + progress * (100 - FALL_START_PERCENT)
}

export function FallingPlayPage({
  mode,
  vocabPlayables,
}: {
  mode: 'level' | 'arcade' | 'vocab'
  vocabPlayables?: VocabPlayable[]
}) {
  const { levelId = '' } = useParams()
  const location = useLocation()
  const progress = useGrammarProgress()

  if (mode === 'arcade' && progress.passedLevelIds.length === 0) {
    return <Navigate to="/" replace />
  }

  if (mode === 'vocab' && (!vocabPlayables || vocabPlayables.length === 0)) {
    return <Navigate to="/practice/pictures/play" replace />
  }

  const level = mode === 'level' ? levelById(levelId) : undefined
  if (mode === 'level' && (!level || !isLevelUnlocked(level, progress))) {
    return <Navigate to="/practice/grammar/learn" replace />
  }

  const pool =
    mode === 'level' && level
      ? { playables: playablesForLevel(level.id) }
      : mode === 'vocab' && vocabPlayables
        ? { playables: vocabPlayables.map((item) => item.sentence) }
        : {
            playables: grammarPack.sentences.filter(
              (sentence) =>
                sentence.kind === 'playable' &&
                progress.passedLevelIds.includes(sentence.level_id),
            ),
          }

  if (pool.playables.length === 0) {
    return <Navigate to={mode === 'vocab' ? '/practice/pictures/play' : '/'} replace />
  }

  const content =
    mode === 'vocab' && vocabPlayables
      ? {
          sentenceById: (id: string) =>
            vocabPlayables.find((item) => item.sentence.id === id)?.sentence,
          slotsForSentence: (id: string) => {
            const slot = vocabPlayables.find((item) => item.sentence.id === id)?.slot
            return slot ? [slot] : []
          },
          pickAnswerModeFor: (id: string, ratio: number) =>
            pickVocabAnswerMode(
              vocabPlayables.find((item) => item.sentence.id === id),
              ratio,
            ),
        }
      : {
          sentenceById,
          slotsForSentence,
        }

  return (
    <FallingBoard
      mode={mode}
      levelId={level?.id}
      backTo={
        mode === 'level'
          ? `/practice/grammar/learn/${levelId}`
          : mode === 'vocab'
            ? '/practice/pictures/play'
            : '/practice/grammar/play'
      }
      lives={level ? livesFor(level) : undefined}
      fallMs={level ? fallDurationFor(level) : undefined}
      threshold={level ? thresholdFor(level) : undefined}
      queueSeed={`${mode}:${levelId}:${location.key}`}
      pool={pool}
      arcadePoolSize={
        mode === 'arcade' || mode === 'vocab' ? pool.playables.length : undefined
      }
      content={content}
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
  content,
}: {
  mode: 'level' | 'arcade' | 'vocab'
  levelId?: string
  backTo: string
  lives?: number
  fallMs?: number
  threshold?: number
  queueSeed: string
  pool: {
    playables: Sentence[]
  }
  arcadePoolSize?: number
  content: {
    sentenceById: (id: string) => Sentence | undefined
    slotsForSentence: (id: string) => SentenceSlot[]
    /** Vocab (and future packs): gate MCQ per sentence from data readiness. */
    pickAnswerModeFor?: (sentenceId: string, produceRatio: number) => AnswerMode
  }
}) {
  const queue = useMemo(() => {
    if (mode === 'arcade' || mode === 'vocab') return buildArcadeQueue(pool.playables)
    return buildQueue(pool.playables)
  }, [mode, pool.playables, queueSeed])
  const firstId = queue[0]
  // 输入模式占比来自「我的」设置（0–100%，默认 50%）；游戏中途不会变更。
  const produceRatio = useMemo(
    () => loadProgress().settings.produceRatio / 100,
    [],
  )
  const resolveAnswerMode = (sentenceId: string) =>
    content.pickAnswerModeFor?.(sentenceId, produceRatio) ??
    pickAnswerMode(produceRatio)
  const initialFallMs =
    mode === 'arcade' || mode === 'vocab' ? arcadeFallDurationMs(0) : fallMs
  const [state, setState] = useState<FallingState | null>(() =>
    firstId
      ? startRound(firstId, lives, initialFallMs, resolveAnswerMode(firstId))
      : null,
  )
  const [options, setOptions] = useState<string[]>([])
  const [produceDraft, setProduceDraft] = useState('')
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
  // Shrink the absolute board above the soft keyboard so fall % / land line retarget.
  const keyboardOverlapPx = useKeyboardOverlapPx()
  // 输入模式：键盘弹出时顶部中文隐藏，中文例句改由 placeholder 轮播提示。
  const keyboardOpen = keyboardOverlapPx > KEYBOARD_OVERLAP_LOCK_PX
  usePinLayoutOnKeyboardDismiss()

  useEffect(() => {
    // SPA remount after produce can inherit iOS/visualViewport scroll leftovers.
    pinLayoutToTop()
  }, [])

  stateRef.current = state
  sentenceResultRef.current = sentenceResult

  const allQueueCleared = isQueueFullyCleared(queue, clearedIds)
  const sentencesLeft = queue.filter((id) => !clearedIds.has(id)).length

  const sentence = state?.sentenceId
    ? content.sentenceById(state.sentenceId)
    : undefined
  const resultSentence = sentenceResult
    ? content.sentenceById(sentenceResult.sentenceId)
    : undefined
  const slots = sentence ? content.slotsForSentence(sentence.id) : []
  const slot = slots[state?.slotIndex ?? 0]
  // placeholder 轮播提示：中文例句 / 关卡名 / 首词提示 / 标杆例句（每条带前缀）。
  const produceHints = useMemo(() => {
    if (!sentence || state?.answerMode !== 'produce') return undefined
    const level = sentence.level_id ? levelById(sentence.level_id) : undefined
    const point = level ? pointById(level.grammar_point_id) : undefined
    const anchor = level ? anchorForLevel(level.id) : undefined
    return buildProduceHints({
      zh: sentence.zh,
      en: sentence.en,
      levelTitle: point?.title_zh,
      anchorEn: anchor?.en,
    })
  }, [sentence?.id, sentence?.zh, sentence?.en, state?.answerMode])

  useEffect(() => {
    if (!slot || state?.answerMode === 'produce') {
      setOptions([])
      return
    }
    setOptions(slotOptions(slot))
  }, [slot?.id, state?.answerMode])

  useEffect(() => {
    setProduceDraft('')
  }, [state?.sentenceId])

  // iOS focuses the produce field by scrolling the page up. That parks the fall
  // start above the visible viewport (long wait to see text) and leaves a black
  // gap after dismiss until the user scrolls back. Keep scroll pinned at top and
  // let keyboardOverlapPx shrink the board instead.
  useEffect(() => {
    if (state?.answerMode !== 'produce' || sentenceResult) return

    const pin = () => pinLayoutToTop()

    const onFocusIn = (event: FocusEvent) => {
      if (!isEditableTarget(event.target)) return
      pin()
      requestAnimationFrame(pin)
      window.setTimeout(pin, 50)
      window.setTimeout(pin, 300)
    }

    const onScroll = () => {
      if (
        window.scrollY > 0 ||
        (window.visualViewport?.offsetTop ?? 0) > 0 ||
        readKeyboardOverlapPx() > KEYBOARD_OVERLAP_LOCK_PX
      ) {
        pin()
      }
    }

    document.addEventListener('focusin', onFocusIn)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.visualViewport?.addEventListener('scroll', onScroll)
    window.visualViewport?.addEventListener('resize', onScroll)

    return () => {
      document.removeEventListener('focusin', onFocusIn)
      window.removeEventListener('scroll', onScroll)
      window.visualViewport?.removeEventListener('scroll', onScroll)
      window.visualViewport?.removeEventListener('resize', onScroll)
      pin()
    }
  }, [state?.answerMode, state?.sentenceId, sentenceResult])

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
    // 输入模式无下落倒计时：不跑计时循环。
    if (state.answerMode === 'produce') return

    let frame = 0
    let last = performance.now()
    const loop = (now: number) => {
      // iOS Safari 后台时 rAF 暂停，恢复首帧 now - last = 后台全部时长；
      // 直接按 dt 扣减会把剩余下落时间一次扣光 → 落底失败 → 切回前台
      // 瞬间突然听到失败音效（用户实测偶发）。钳制单帧增量上限，
      // 后台时长不计入下落——切回时句子从切走位置继续。
      const dt = Math.min(now - last, MAX_FRAME_DT_MS)
      last = now
      setState((current) => {
        if (!current || current.status !== 'playing') return current
        return tick(current, dt)
      })
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [state?.status, state?.sentenceId, state?.answerMode, sentenceResult])

  useLayoutEffect(() => {
    if (sentenceResultRef.current) return
    const current = stateRef.current
    if (!current || current.status !== 'playing') return
    // 输入模式不因落底/超时失败（无下落）。
    if (current.answerMode === 'produce') return
    if (bottomHandledRef.current) return

    const hitByTime = current.remainingMs <= 0
    const zone = fallZoneRef.current
    const wrap = sentenceWrapRef.current
    const trustDom = shouldTrustDomLandCheck({
      inputFocused: isEditableTarget(document.activeElement),
      keyboardOverlapPx,
    })
    const hitByDom =
      trustDom && zone && wrap ? sentenceHitBottom(zone, wrap) : false

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
    if (mode === 'vocab' && arcadePoolSize !== undefined) {
      const cleared = isQueueFullyCleared(queue, clearedIds)
      recordMyChallengeRun(state.score, queue.length, cleared, arcadePoolSize)
    }
  }, [state, mode, levelId, threshold, queue, clearedIds, arcadePoolSize])

  // 结算页动画：成功态（过关/挑战成功）多发烟花；失败态小失落。
  const settleContentRef = useRef<HTMLDivElement>(null)
  const settleTitleRef = useRef<HTMLParagraphElement>(null)
  const sessionCleared =
    (mode === 'arcade' || mode === 'vocab') &&
    isQueueFullyCleared(queue, clearedIds)
  const passed =
    mode === 'level' && threshold !== undefined && (state?.score ?? 0) >= threshold

  useEffect(() => {
    if (state?.status !== 'over') return
    if (passed || sessionCleared) {
      fireMultiBurst(document.body, 3)
    } else {
      if (settleContentRef.current) playLetdown(settleContentRef.current)
      if (settleTitleRef.current) shakeTitle(settleTitleRef.current)
    }
  }, [state?.status, passed, sessionCleared])

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
    if (round.answerMode !== 'mcq') return
    if (!slot || round.status !== 'playing' || sentenceResult) return
    if (option !== slot.correct) {
      playUiFail()
      if (sentenceRef.current) gsap.killTweensOf(sentenceRef.current)
      // 本格已错满一次：第 2 次选错立即失败（最多允许选错一次）
      if ((stateRef.current?.wrongCount ?? 0) + 1 >= MAX_WRONG_PER_SENTENCE) {
        const current = stateRef.current
        if (!current || current.status !== 'playing' || !current.sentenceId) return
        bottomHandledRef.current = true
        const failId = current.sentenceId
        const landed = land({ ...current, wrongCount: current.wrongCount + 1 })
        stateRef.current = landed
        setState(landed)
        if (sentenceRef.current) shatterSentence(sentenceRef.current)
        setSentenceResult({ outcome: 'failed', sentenceId: failId })
        return
      }
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

  function submitProduce() {
    unlockUiSound()
    if (round.status !== 'playing' || sentenceResult) return
    if (round.answerMode !== 'produce' || !sentence) return
    const trimmed = produceDraft.trim()
    if (!trimmed) return

    if (!englishAnswersMatch(trimmed, sentence.en)) {
      // 只比对一次：错误直接失败（-1 心 → 失败页看正确答案），不再允许重输。
      playUiFail()
      if (sentenceRef.current) gsap.killTweensOf(sentenceRef.current)
      setState((current) => (current ? land(current) : current))
      setSentenceResult({ outcome: 'failed', sentenceId: sentence.id })
      return
    }

    setState((current) => {
      if (!current || !current.sentenceId) return current
      bottomHandledRef.current = true
      setClearedIds((prev) => new Set(prev).add(current.sentenceId!))
      playUiSuccess()
      setSentenceResult({ outcome: 'cleared', sentenceId: current.sentenceId })
      return markCleared(current)
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
      mode === 'arcade' || mode === 'vocab'
        ? arcadeFallDurationMs(clearedIds.size)
        : fallMs
    const answerMode = resolveAnswerMode(nextId)
    setState((current) =>
      current ? beginSentence(current, nextId, nextFallMs, answerMode) : current,
    )
  }

  function continueAfterSentence() {
    if (!state || !sentenceResult) return
    playUiTap()

    const hasMoreSentences = !allQueueCleared && state.status !== 'over'
    const plan = planAfterSentence({
      mode,
      clearedCount: clearedIds.size,
      hasMoreSentences,
      groupNumber: arcadeGroupNumber(clearedIds.size),
      shouldShowBanner: shouldShowGroupSpeedBanner,
    })

    // Keep the result screen until the banner finishes — clearing it while
    // remainingMs is still 0 re-mounts the board and instantly re-fails.
    if (!clearsResultBeforeAdvance(plan) && plan.kind === 'group_banner') {
      pendingAdvanceRef.current = () => {
        setSentenceResult(null)
        advanceToNextSentence()
      }
      setGroupBanner(plan.groupNumber)
      return
    }

    setSentenceResult(null)
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
      <>
        {groupBanner !== null ? (
          <GroupSpeedBanner
            groupNumber={groupBanner}
            onComplete={handleGroupBannerComplete}
          />
        ) : null}
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
      </>
    )
  }

  if (state.status === 'over') {
    const passed =
      mode === 'level' && threshold !== undefined && state.score >= threshold
    const nextLevel =
      mode === 'level' && passed && levelId ? nextLevelAfter(levelId) : null
    const nextTopic = nextLevel ? pointById(nextLevel.grammar_point_id) : undefined
    const sessionCleared =
      (mode === 'arcade' || mode === 'vocab') &&
      isQueueFullyCleared(queue, clearedIds)
    const earnedTrophy =
      (mode === 'arcade' || mode === 'vocab') &&
      arcadePoolSize !== undefined &&
      arcadeEarnedTrophy(sessionCleared, queue.length, arcadePoolSize)

    return (
      <StageShell
        header={<StageHeader backTo={backTo} title="结算" />}
      >
        <div
          ref={settleContentRef}
          className="flex flex-1 flex-col items-center justify-center gap-6"
        >
          {mode === 'arcade' || mode === 'vocab' ? (
            <>
              <p
                ref={settleTitleRef}
                className="text-3xl font-semibold tracking-[0.04em] text-day"
              >
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
            <p
              ref={settleTitleRef}
              className="text-3xl font-semibold tracking-[0.04em] text-day"
            >
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
              mode === 'arcade' || mode === 'vocab'
                ? `第 ${arcadeGroupNumber(clearedIds.size)} 组 · 还剩 ${sentencesLeft} 句`
                : `还剩 ${sentencesLeft} 句`
            }
            trailing={<LivesHearts count={state.lives} max={maxLives} size="sm" />}
          />
        }
      >
      <div
        className="absolute inset-x-0 flex min-h-0 flex-col"
        style={{
          top: STAGE_CHROME_OFFSET,
          bottom: `calc(${SAFE_BOTTOM} + ${GAME_BOTTOM_GAP_PX + keyboardOverlapPx}px)`,
        }}
      >
        <div
          ref={fallZoneRef}
          className="relative min-h-0 flex-1 overflow-hidden"
        >
          {round.answerMode === 'mcq' ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cobalt to-transparent opacity-80"
            />
          ) : null}
          {sentence ? (
            round.answerMode === 'produce' ? (
              keyboardOpen ? null : (
                <div className="pt-6">
                  <p
                    ref={sentenceRef}
                    className={`text-center text-2xl font-medium leading-snug tracking-[0.01em] ${
                      state.lastWrong ? 'text-rose' : 'text-day'
                    }`}
                  >
                    {sentence.zh}
                  </p>
                </div>
              )
            ) : (
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
            )
          ) : null}
        </div>
        <div className="mt-4">
          {round.answerMode === 'produce' ? (
            <FallingAnswerPad
              mode="produce"
              draft={produceDraft}
              onDraftChange={setProduceDraft}
              onSubmit={submitProduce}
              hints={produceHints}
            />
          ) : (
            <FallingAnswerPad
              mode="mcq"
              options={options}
              onPick={pick}
            />
          )}
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
  // 失败页防误触：页面切换瞬间玩家连点的残余点击可能落到「下一句」上，
  // 导致来不及看正确答案。失败时按钮静默延迟 500ms 才可点；成功页无需延迟。
  const [nextReady, setNextReady] = useState(cleared)

  useEffect(() => {
    if (outcome === 'cleared') {
      setNextReady(true)
      return
    }
    setNextReady(false)
    const timer = setTimeout(() => setNextReady(true), 500)
    return () => clearTimeout(timer)
  }, [outcome, sentence.id])

  useEffect(() => {
    if (outcome !== 'failed') return
    playUiFail()
  }, [outcome, sentence.id])

  // 动画：单句成功页单发烟花；失败页碎心由 LivesHearts 的 breakingIndex 触发。
  useEffect(() => {
    if (cleared) fireSingleBurst(document.body)
  }, [cleared, sentence.id])

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
            {/* 刚失去的心 = 下标 lives（第一颗灰心），由它触发碎心动画 */}
            <LivesHearts count={lives} max={maxLives} size="md" breakingIndex={lives} />
          </div>
        ) : null}
        <button
          type="button"
          onClick={onNext}
          disabled={!nextReady}
          className="mt-auto inline-flex min-h-14 items-center justify-center rounded-2xl bg-day px-6 text-lg font-semibold tracking-[0.08em] text-cyc transition-[filter] duration-200 ease-out hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day active:brightness-95 disabled:pointer-events-none"
        >
          {showSettlement ? '查看结算' : '下一句'}
        </button>
      </div>
    </StageShell>
  )
}
