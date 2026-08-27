import { useEffect, useRef, useState } from 'react'
import { playCardAudio, stopCardAudio } from '../lib/playAudio'
import {
  hasChallengeWord,
  toggleChallengeWord,
} from '../lib/challengeCollection'
import { pushToast } from '../lib/toast'
import type { HintLang, ThinkHoldMs } from '../lib/storage'
import type { Card } from '../../../types/card'
import { StageHeader } from '../../../shared/StageHeader'
import { STAGE_BOTTOM_PAD } from '../../../shared/StageShell'
import { isQuark } from '../../../shared/isQuark'
import { LangToggle } from '../../../components/LangToggle'
import { ReportDialog } from '../../grammar/components/ReportDialog'

const FALLBACK_IMAGE = `${import.meta.env.BASE_URL}images/cards/fallback.svg`

export interface PracticeCardProps {
  card: Card
  hintLangDefault?: HintLang
  autoSpeak?: boolean
  thinkHoldMs?: ThinkHoldMs
  onGotIt: () => void
  onForgot: () => void
  onTimeout?: () => void
  onNext?: () => void
  progressLabel?: string
  chrome?: 'stage' | 'sheet'
  backTo?: string
  onBack?: () => void
  stageTitle?: string
}

const cueButton =
  'inline-flex min-h-14 flex-1 items-center justify-center rounded-2xl px-2.5 text-center font-cue text-lg font-semibold tracking-[0.08em] transition-[filter,background-color,border-color] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day active:brightness-95'

function VolumeIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12.5 9.5 17 19 7.5" />
    </svg>
  )
}

function CueSpeaker({
  label,
  tone,
  onPlay,
}: {
  label: string
  tone: 'onDay' | 'onCyc'
  onPlay: () => void
}) {
  const onDay = tone === 'onDay'
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onPlay}
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full border transition-[filter] duration-200 ease-out hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:brightness-95 ${
        onDay
          ? 'border-cyc/45 text-cyc focus-visible:outline-cyc'
          : 'border-day/70 text-day focus-visible:outline-day'
      }`}
    >
      <VolumeIcon className="size-4 stroke-[2.25]" />
    </button>
  )
}

export function PracticeCard({
  card,
  hintLangDefault = 'en',
  autoSpeak = false,
  thinkHoldMs = 5000,
  onGotIt,
  onForgot,
  onTimeout,
  onNext,
  progressLabel,
  chrome = 'stage',
  backTo,
  onBack,
  stageTitle = 'Name Everything',
}: PracticeCardProps) {
  const [imageSrc, setImageSrc] = useState(card.image)
  const sheet = chrome === 'sheet'
  const [revealed, setRevealed] = useState(sheet)
  const [timeoutHold, setTimeoutHold] = useState(false)
  const [hintLang, setHintLang] = useState<HintLang>(
    card.zh && hintLangDefault === 'zh' ? 'zh' : 'en',
  )
  const [remaining, setRemaining] = useState(Math.round(thinkHoldMs / 1000))
  const [inChallenge, setInChallenge] = useState(() => hasChallengeWord(card.word))
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onTimeoutRef = useRef(onTimeout)
  const autoSpeakRef = useRef(autoSpeak)
  const cardRef = useRef(card)
  const showZh = hintLang === 'zh' && Boolean(card.zh)

  onTimeoutRef.current = onTimeout
  autoSpeakRef.current = autoSpeak
  cardRef.current = card

  function clearAutoSpeak() {
    if (autoTimer.current !== null) {
      clearTimeout(autoTimer.current)
      autoTimer.current = null
    }
    stopCardAudio()
  }

  function startAutoSpeak() {
    if (!autoSpeakRef.current) return
    const next = cardRef.current
    playCardAudio(next.wordAudio, next.word)
    if (isQuark()) return // 夸克：3 秒后的句子播放是点击栈外调用，会黑屏
    autoTimer.current = setTimeout(() => {
      autoTimer.current = null
      playCardAudio(next.sentenceAudio, next.sentence)
    }, 3000)
  }

  function revealCues() {
    setRevealed(true)
    startAutoSpeak()
  }

  function confirmForgot() {
    clearAutoSpeak()
    onForgot()
  }

  function confirmGotIt() {
    clearAutoSpeak()
    onGotIt()
  }

  function confirmNext() {
    clearAutoSpeak()
    onNext?.()
  }

  function onToggleChallenge() {
    const added = toggleChallengeWord(card.word)
    setInChallenge(added)
    pushToast(added ? '已加入我的挑战' : '已移出我的挑战')
  }

  useEffect(() => {
    setImageSrc(card.image)
  }, [card.image])

  useEffect(() => {
    setRevealed(sheet)
    setTimeoutHold(false)
    setHintLang(card.zh && hintLangDefault === 'zh' ? 'zh' : 'en')
    setRemaining(Math.round(thinkHoldMs / 1000))
    setInChallenge(hasChallengeWord(card.word))
    if (autoTimer.current !== null) {
      clearTimeout(autoTimer.current)
      autoTimer.current = null
    }
    stopCardAudio()
  }, [card.id, card.word, card.zh, hintLangDefault, sheet, thinkHoldMs])

  useEffect(() => {
    if (sheet || revealed) return
    setRemaining(Math.round(thinkHoldMs / 1000))
    const interval = setInterval(() => {
      setRemaining((secs) => Math.max(0, secs - 1))
    }, 1000)
    const timeout = setTimeout(() => {
      setRevealed(true)
      setTimeoutHold(true)
    }, thinkHoldMs)
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [card.id, revealed, sheet, thinkHoldMs])

  useEffect(() => {
    if (!timeoutHold) return
    if (isQuark()) {
      // 夸克：倒计时结束的自动朗读是点击栈外调用，会整屏黑屏——静默跳过
      onTimeoutRef.current?.()
      return
    }
    startAutoSpeak()
    onTimeoutRef.current?.()
    // Speak + enqueue once per timeout-hold, using the current card.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeoutHold])

  useEffect(() => {
    if (!sheet || !autoSpeak) return
    if (isQuark()) return // 夸克：复习打开的自动朗读是点击栈外调用，会黑屏
    playCardAudio(card.wordAudio, card.word)
    autoTimer.current = setTimeout(() => {
      autoTimer.current = null
      playCardAudio(card.sentenceAudio, card.sentence)
    }, 3000)
    return () => {
      if (autoTimer.current !== null) {
        clearTimeout(autoTimer.current)
        autoTimer.current = null
      }
      stopCardAudio()
    }
  }, [autoSpeak, card.id, card.sentence, card.sentenceAudio, card.word, card.wordAudio, sheet])

  useEffect(() => {
    return () => {
      if (autoTimer.current !== null) clearTimeout(autoTimer.current)
      stopCardAudio()
    }
  }, [])

  return (
    <article data-seed="af3fdd03" className="relative z-0 min-h-dvh overflow-x-clip font-cue">
      <div className="cyc-wash pointer-events-none absolute inset-0" />
      <div
        className={`relative mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden px-4 ${STAGE_BOTTOM_PAD}`}
      >
        <div className="shrink-0 bg-cyc pb-2 pt-[max(1.25rem,env(safe-area-inset-top))]">
          <StageHeader
            backTo={sheet ? undefined : backTo}
            onBack={sheet ? onBack : undefined}
            title={sheet ? '复习' : stageTitle}
            trailing={
              <div className="flex items-center gap-1.5">
                <ReportDialog
                  target={{ asset_type: 'picture_word', asset_id: card.word }}
                  label="报错"
                  tone="onCyc"
                  size="sm"
                />
                {!sheet && progressLabel ? (
                  <p className="inline-flex h-7 items-center rounded-xl bg-day px-2.5 text-sm font-semibold tracking-[0.12em] text-cyc">
                    {progressLabel}
                  </p>
                ) : null}
              </div>
            }
          />
        </div>

        <figure
          data-testid="card-photo"
          className={`flex shrink-0 justify-center px-2 ${sheet ? 'mt-3' : 'mt-2'}`}
        >
          <img
            src={imageSrc}
            alt=""
            decoding="async"
            className="aspect-[4/3] h-auto w-full max-h-[32vh] rounded-xl object-cover shadow-[0_22px_44px_-14px_rgba(0,0,0,0.7)]"
            onError={() => setImageSrc(FALLBACK_IMAGE)}
          />
        </figure>

        <div
          data-testid="cue-panel"
          className="flex min-h-[12.5rem] flex-1 flex-col overflow-y-auto overscroll-contain"
        >
          {revealed ? (
            <div className="flex min-h-full flex-col justify-center gap-3 py-2">
              <div
                data-testid="cue-stage"
                aria-label="提示区"
                className="flex w-full shrink-0 flex-col items-center justify-center"
              >
                <div
                  id="card-cues"
                  data-testid="card-cues"
                  className="cue-raise flex min-h-11 w-full items-center justify-center gap-2 text-day"
                >
                  {showZh ? (
                    <p className="text-center text-3xl font-semibold tracking-[0.04em]">
                      {card.zh}
                    </p>
                  ) : (
                    <>
                      <h2 className="text-center text-3xl font-semibold tracking-[0.04em]">
                        {card.word}
                      </h2>
                      <CueSpeaker
                        label="朗读单词"
                        tone="onCyc"
                        onPlay={() => playCardAudio(card.wordAudio, card.word)}
                      />
                    </>
                  )}
                </div>
              </div>
              <div
                data-testid="sentence-band"
                className="cue-raise-late flex w-full shrink-0 items-center gap-2 rounded-2xl bg-day px-3 py-3"
              >
                <p className="min-w-0 flex-1 text-pretty text-center text-xl font-medium leading-snug tracking-[0.01em] text-cyc">
                  {card.sentence}
                </p>
                <CueSpeaker
                  label="朗读句子"
                  tone="onDay"
                  onPlay={() =>
                    playCardAudio(card.sentenceAudio, card.sentence)
                  }
                />
              </div>
              <div
                data-testid="lang-rail"
                className="flex shrink-0 justify-center pb-1 pt-1"
              >
                <LangToggle
                  value={hintLang}
                  onChange={setHintLang}
                  hasZh={Boolean(card.zh)}
                />
              </div>
            </div>
          ) : (
            <div className="flex min-h-full w-full flex-1 flex-col items-center justify-center">
              <p
                data-testid="think-countdown"
                aria-live="polite"
                className="text-center text-6xl font-semibold tabular-nums tracking-[0.04em] text-day"
              >
                {remaining}
              </p>
            </div>
          )}
        </div>

        <div className="mt-auto flex shrink-0 items-center gap-2.5 pt-4">
          {timeoutHold ? (
            <button
              type="button"
              onClick={confirmNext}
              className={`${cueButton} bg-day text-cyc hover:brightness-105`}
            >
              Next
            </button>
          ) : revealed ? (
            <>
              <button
                type="button"
                onClick={confirmForgot}
                className={`${cueButton} forgot-cue bg-cyc text-day hover:brightness-110`}
              >
                Forgot
              </button>
              <button
                type="button"
                onClick={confirmGotIt}
                className={`${cueButton} bg-day text-cyc hover:brightness-105`}
              >
                Got it
              </button>
              <button
                type="button"
                aria-label={inChallenge ? '已加入' : '加入我的挑战'}
                aria-pressed={inChallenge}
                onClick={onToggleChallenge}
                className={`inline-flex size-14 shrink-0 items-center justify-center rounded-2xl transition-[filter,background-color,border-color] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day active:brightness-95 ${
                  inChallenge
                    ? 'bg-day text-cyc hover:brightness-105'
                    : 'bg-cobalt text-day hover:brightness-110'
                }`}
              >
                {inChallenge ? (
                  <CheckIcon className="size-5" />
                ) : (
                  <PlusIcon className="size-5" />
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={revealCues}
              className={`${cueButton} bg-day text-cyc hover:brightness-105`}
            >
              Aha!
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
