import { useEffect, useRef, useState } from 'react'
import { playCardAudio, stopCardAudio } from '../lib/playAudio'
import type { ForgetHoldMs, HintLang } from '../lib/storage'
import type { Card } from '../types/card'
import { LangToggle } from './LangToggle'

const FALLBACK_IMAGE = '/images/cards/fallback.svg'

export interface PracticeCardProps {
  card: Card
  hintLangDefault?: HintLang
  autoSpeak?: boolean
  forgetHoldMs?: ForgetHoldMs
  onGotIt: () => void
  onForgot: () => void
  todayCount?: number
  chrome?: 'stage' | 'sheet'
}

const cueButton =
  'inline-flex min-h-14 flex-1 items-center justify-center rounded-2xl px-2.5 text-center font-cue text-lg font-semibold tracking-[0.08em] transition-[filter,background-color,border-color] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day active:brightness-95'

const iconButton =
  'inline-flex size-14 items-center justify-center rounded-full border border-day/70 text-day pointer-events-none'

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

function EyeOffIcon({ className }: { className?: string }) {
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
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  )
}

function CueSpeaker({
  label,
  tone,
  onPlay,
}: {
  label: string
  tone: 'onRose' | 'onCyc'
  onPlay: () => void
}) {
  const onRose = tone === 'onRose'
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onPlay}
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full border transition-[filter] duration-200 ease-out hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:brightness-95 ${
        onRose
          ? 'border-cyc/45 text-cyc focus-visible:outline-cyc'
          : 'border-day/70 text-day focus-visible:outline-day'
      }`}
    >
      <VolumeIcon className="size-4 stroke-[2.25]" />
    </button>
  )
}

const WAVE_W = 28
const WAVE_H = 56
const WAVE_MID = 14
const WAVE_AMP = 5
const WAVE_GAP = 3.5
const WAVE_OVERLAP = 4

function tideCurve(offset: number): string {
  const x = WAVE_MID + offset
  const right = x + WAVE_AMP
  const left = x - WAVE_AMP
  return `M${x} 0C${right} 14 ${right} 20 ${x} 28C${left} 36 ${left} 42 ${x} ${WAVE_H}`
}

const TIDE_WATER =
  `M-${WAVE_OVERLAP} 0H${WAVE_MID}C${WAVE_MID + WAVE_AMP} 14 ${WAVE_MID + WAVE_AMP} 20 ${WAVE_MID} 28C${WAVE_MID - WAVE_AMP} 36 ${WAVE_MID - WAVE_AMP} 42 ${WAVE_MID} ${WAVE_H}H-${WAVE_OVERLAP}Z`
const TIDE_LINE_LEFT = tideCurve(-WAVE_GAP)
const TIDE_LINE_MID = tideCurve(0)
const TIDE_LINE_RIGHT = tideCurve(WAVE_GAP)

function ForgetTide({ durationMs }: { durationMs: number }) {
  return (
    <span className="forget-tide" aria-hidden="true">
      <span
        className="forget-tide-sheet"
        style={{ animationDuration: `${durationMs}ms` }}
      >
        <span className="forget-tide-water" />
        <svg
          className="forget-tide-wave"
          viewBox={`-${WAVE_OVERLAP} 0 ${WAVE_W + WAVE_OVERLAP} ${WAVE_H}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <path fill="#1e3a8a" d={TIDE_WATER} />
          <g
            fill="none"
            stroke="#f4f1ea"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          >
            <path d={TIDE_LINE_LEFT} />
            <path d={TIDE_LINE_MID} />
            <path d={TIDE_LINE_RIGHT} />
          </g>
        </svg>
      </span>
    </span>
  )
}

export function PracticeCard({
  card,
  hintLangDefault = 'en',
  autoSpeak = false,
  forgetHoldMs = 5000,
  onGotIt,
  onForgot,
  todayCount,
  chrome = 'stage',
}: PracticeCardProps) {
  const [imageSrc, setImageSrc] = useState(card.image)
  const [revealed, setRevealed] = useState(false)
  const [hintLang, setHintLang] = useState<HintLang>(
    card.zh && hintLangDefault === 'zh' ? 'zh' : 'en',
  )
  const [forgetting, setForgetting] = useState(false)
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const forgetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sheet = chrome === 'sheet'
  const showZh = hintLang === 'zh' && Boolean(card.zh)

  function clearAutoSpeak() {
    if (autoTimer.current !== null) {
      clearTimeout(autoTimer.current)
      autoTimer.current = null
    }
    stopCardAudio()
  }

  function hideCues() {
    if (forgetting) return
    clearAutoSpeak()
    setRevealed(false)
  }

  function startAutoSpeak() {
    if (!autoSpeak) return
    playCardAudio(card.wordAudio, card.word)
    autoTimer.current = setTimeout(() => {
      autoTimer.current = null
      playCardAudio(card.sentenceAudio, card.sentence)
    }, 3000)
  }

  function revealCues() {
    setRevealed(true)
    startAutoSpeak()
  }

  function clearForgetHold() {
    if (forgetTimer.current !== null) {
      clearTimeout(forgetTimer.current)
      forgetTimer.current = null
    }
    setForgetting(false)
  }

  function confirmForgot() {
    if (forgetting) {
      clearForgetHold()
      clearAutoSpeak()
      onForgot()
      return
    }
    if (forgetHoldMs === 0) {
      clearAutoSpeak()
      onForgot()
      return
    }
    const wasHidden = !revealed
    setRevealed(true)
    setForgetting(true)
    if (wasHidden) startAutoSpeak()
    forgetTimer.current = setTimeout(() => {
      forgetTimer.current = null
      clearAutoSpeak()
      onForgot()
    }, forgetHoldMs)
  }

  function confirmGotIt() {
    clearForgetHold()
    clearAutoSpeak()
    onGotIt()
  }

  useEffect(() => {
    setImageSrc(card.image)
  }, [card.image])

  useEffect(() => {
    setRevealed(false)
    setForgetting(false)
    setHintLang(card.zh && hintLangDefault === 'zh' ? 'zh' : 'en')
    if (autoTimer.current !== null) {
      clearTimeout(autoTimer.current)
      autoTimer.current = null
    }
    if (forgetTimer.current !== null) {
      clearTimeout(forgetTimer.current)
      forgetTimer.current = null
    }
    stopCardAudio()
  }, [card.id, card.zh, hintLangDefault])

  useEffect(() => {
    return () => {
      if (autoTimer.current !== null) clearTimeout(autoTimer.current)
      if (forgetTimer.current !== null) clearTimeout(forgetTimer.current)
      stopCardAudio()
    }
  }, [])

  useEffect(() => {
    if (!revealed) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') hideCues()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [revealed, forgetting])

  return (
    <article data-seed="af3fdd03" className="relative z-0 min-h-dvh overflow-x-clip font-cue">
      <div className="cyc-wash pointer-events-none absolute inset-0" />
      <div
        className={`relative mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden px-4 ${
          sheet ? 'pb-6 pt-16' : 'pb-28 pt-[max(1.25rem,env(safe-area-inset-top))]'
        }`}
      >
        {sheet ? null : (
          <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 pt-2">
            <span aria-hidden="true" />
            <p className="text-center text-sm font-semibold tracking-[0.22em] text-day">
              Name Everything
            </p>
            {typeof todayCount === 'number' ? (
              <p className="justify-self-end rounded-xl bg-rose px-2.5 py-1 text-sm font-semibold tracking-[0.12em] text-cyc">
                今日 {todayCount}
              </p>
            ) : (
              <span aria-hidden="true" />
            )}
          </header>
        )}

        <figure
          data-testid="card-photo"
          className={`flex shrink-0 justify-center px-2 ${sheet ? 'mt-3' : 'mt-4'}${
            revealed ? ' cursor-pointer' : ''
          }`}
          onClick={revealed ? hideCues : undefined}
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
          className="flex min-h-[12.5rem] flex-1 cursor-pointer flex-col overflow-y-auto overscroll-contain"
          onClick={revealed ? hideCues : undefined}
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
                    <p
                      className="text-center text-3xl font-semibold tracking-[0.04em]"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {card.zh}
                    </p>
                  ) : (
                    <>
                      <h2
                        className="text-center text-3xl font-semibold tracking-[0.04em]"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {card.word}
                      </h2>
                      <span onClick={(event) => event.stopPropagation()}>
                        <CueSpeaker
                          label="朗读单词"
                          tone="onCyc"
                          onPlay={() => playCardAudio(card.wordAudio, card.word)}
                        />
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="cue-raise-late flex w-full shrink-0 items-center gap-2 rounded-2xl bg-rose px-3 py-3">
                <p
                  className="min-w-0 flex-1 text-pretty text-center text-xl font-medium leading-snug tracking-[0.01em] text-cyc"
                  onClick={(event) => event.stopPropagation()}
                >
                  {card.sentence}
                </p>
                <span onClick={(event) => event.stopPropagation()}>
                  <CueSpeaker
                    label="朗读句子"
                    tone="onRose"
                    onPlay={() =>
                      playCardAudio(card.sentenceAudio, card.sentence)
                    }
                  />
                </span>
              </div>
              <div
                data-testid="lang-rail"
                className="flex shrink-0 justify-center pb-1 pt-1"
              >
                <span onClick={(event) => event.stopPropagation()}>
                  <LangToggle
                    value={hintLang}
                    onChange={setHintLang}
                    hasZh={Boolean(card.zh)}
                  />
                </span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              aria-label="显示提示"
              aria-expanded="false"
              aria-controls="card-cues"
              onClick={revealCues}
              className="flex min-h-full w-full flex-1 cursor-pointer flex-col items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-day"
            >
              <span className={iconButton} aria-hidden="true">
                <EyeOffIcon className="size-6 stroke-[2.25]" />
              </span>
            </button>
          )}
        </div>

        <div className="mt-auto flex shrink-0 gap-2.5 pt-4">
          <button
            type="button"
            onClick={confirmForgot}
            className={`${cueButton} forgot-cue bg-cyc text-day hover:brightness-110`}
          >
            {forgetting ? <ForgetTide durationMs={forgetHoldMs} /> : null}
            <span className="relative z-10">Forgot</span>
          </button>
          <button
            type="button"
            onClick={confirmGotIt}
            className={`${cueButton} bg-day text-cyc hover:brightness-105`}
          >
            Got it
          </button>
        </div>
      </div>
    </article>
  )
}
