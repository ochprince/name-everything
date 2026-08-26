import { useEffect, useRef, useState } from 'react'
import { LangToggle } from '../components/LangToggle'
import { exportReports, clearReports, useGrammarReports } from '../features/grammar'
import { useProgress } from '../features/pictures/hooks/useProgress'
import {
  todayKey,
  PRODUCE_RATIO_LABELS,
  PRODUCE_RATIO_OPTIONS,
  THINK_HOLD_LABELS,
  THINK_HOLD_OPTIONS,
  type ThinkHoldMs,
  type HintLang,
  type ProduceRatioPercent,
} from '../features/pictures/lib/storage'
import { StageHeader, StickyStageChrome } from '../shared/StageHeader'

const holdButton =
  'min-h-11 min-w-[4.75rem] rounded-2xl px-3 font-cue text-base font-semibold tracking-[0.14em] transition-[filter,background-color,border-color] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day active:brightness-95'

const holdChip =
  'inline-flex min-h-9 items-center justify-center rounded-full px-3 font-cue text-[0.7rem] font-semibold tracking-[0.14em] transition-[filter,background-color,border-color] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day active:brightness-95'

function CueHold({
  label,
  on,
  onToggle,
}: {
  label: string
  on: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-lg font-medium tracking-[0.04em] text-day">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={onToggle}
        className={`${holdButton} ${
          on
            ? 'bg-day text-cyc hover:brightness-105'
            : 'border border-day/75 bg-cyc text-day hover:border-day hover:brightness-110'
        }`}
      >
        {on ? '开' : '关'}
      </button>
    </div>
  )
}

function GrammarReports() {
  const reports = useGrammarReports()
  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current)
    }
  }, [])

  async function copyReports() {
    const text = exportReports()
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // 降级：隐藏 textarea + execCommand（部分 iOS / 非安全上下文无 clipboard API）
      const area = document.createElement('textarea')
      area.value = text
      area.style.position = 'fixed'
      area.style.opacity = '0'
      document.body.appendChild(area)
      area.select()
      document.execCommand('copy')
      area.remove()
    }
    setCopied(true)
    if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current)
    copiedTimer.current = window.setTimeout(() => setCopied(false), 1500)
  }

  function downloadReports() {
    const blob = new Blob([exportReports()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'grammar-reports.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mt-14 flex flex-col gap-3 pb-8">
      <p className="text-lg font-medium tracking-[0.04em] text-day">语法报错</p>
      <p className="text-base font-medium tracking-[0.02em] text-day/80">
        {reports.length === 0 ? '还没有报错。' : `本机 ${reports.length} 条`}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copyReports()}
          className={`${holdButton} bg-day text-cyc hover:brightness-105`}
        >
          {copied ? '已复制' : '复制报错'}
        </button>
        <button
          type="button"
          onClick={downloadReports}
          className={`${holdButton} border border-day/75 bg-cyc text-day hover:border-day`}
        >
          下载文件
        </button>
        {reports.length > 0 ? (
          <button
            type="button"
            onClick={() => clearReports()}
            className={`${holdButton} border border-day/75 bg-cyc text-day hover:border-day`}
          >
            清空已导出
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function MePage() {
  const { progress, update } = useProgress()
  const todayCount = progress.gotItToday[todayKey()]?.length ?? 0
  const streak = progress.streaks.count

  function setHintLang(hintLang: HintLang) {
    update((p) => ({
      ...p,
      settings: { ...p.settings, hintLang },
    }))
  }

  function setThinkHold(thinkHoldMs: ThinkHoldMs) {
    update((p) => ({
      ...p,
      settings: { ...p.settings, thinkHoldMs },
    }))
  }

  function setProduceRatio(produceRatio: ProduceRatioPercent) {
    update((p) => ({
      ...p,
      settings: { ...p.settings, produceRatio },
    }))
  }

  return (
    <main
      data-seed="af3fdd03"
      className="relative z-0 h-dvh overflow-hidden bg-cyc font-cue"
    >
      <div className="cyc-wash pointer-events-none absolute inset-0" />

      <div className="relative h-full overflow-x-clip overflow-y-auto">
        <div className="mx-auto max-w-md px-4 pb-28">
        <StickyStageChrome>
          <StageHeader title="我的" />
        </StickyStageChrome>

        <ul className="mt-10 flex flex-col gap-5">
          <li className="flex items-center justify-between gap-4">
            <span className="text-lg font-medium tracking-[0.08em] text-day">
              今日已练
            </span>
            <span className="rounded-xl bg-day px-3 py-1 text-lg font-semibold tracking-[0.08em] text-cyc">
              {todayCount}
            </span>
          </li>
          <li className="flex items-center justify-between gap-4">
            <span className="text-lg font-medium tracking-[0.08em] text-day">
              连续天数
            </span>
            <span className="rounded-xl bg-day px-3 py-1 text-lg font-semibold tracking-[0.08em] text-cyc">
              {streak}
            </span>
          </li>
        </ul>

        <div className="mt-14 flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-lg font-medium tracking-[0.04em] text-day">
              默认提示
            </span>
            <LangToggle
              value={progress.settings.hintLang}
              onChange={setHintLang}
              label="默认提示"
            />
          </div>
          <CueHold
            label="自动发音"
            on={progress.settings.autoSpeak}
            onToggle={() =>
              update((p) => ({
                ...p,
                settings: {
                  ...p.settings,
                  autoSpeak: !p.settings.autoSpeak,
                },
              }))
            }
          />
          <CueHold
            label="音效"
            on={progress.settings.uiSound}
            onToggle={() =>
              update((p) => ({
                ...p,
                settings: {
                  ...p.settings,
                  uiSound: !p.settings.uiSound,
                },
              }))
            }
          />
          <div className="flex flex-col gap-3">
            <span className="text-lg font-medium tracking-[0.04em] text-day">
              思考时长
            </span>
            <div
              role="radiogroup"
              aria-label="思考时长"
              className="flex flex-wrap gap-1.5"
            >
              {THINK_HOLD_OPTIONS.map((ms) => (
                <button
                  key={ms}
                  type="button"
                  role="radio"
                  aria-checked={progress.settings.thinkHoldMs === ms}
                  aria-label={THINK_HOLD_LABELS[ms]}
                  onClick={() => setThinkHold(ms)}
                  className={`${holdChip} ${
                    progress.settings.thinkHoldMs === ms
                      ? 'bg-day text-cyc hover:brightness-105'
                      : 'border border-day/70 bg-transparent text-day/80 hover:border-day hover:text-day'
                  }`}
                >
                  {THINK_HOLD_LABELS[ms]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-lg font-medium tracking-[0.04em] text-day">
              输入模式占比
            </span>
            <div
              role="radiogroup"
              aria-label="输入模式占比"
              className="flex flex-wrap gap-1.5"
            >
              {PRODUCE_RATIO_OPTIONS.map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  role="radio"
                  aria-checked={progress.settings.produceRatio === ratio}
                  aria-label={PRODUCE_RATIO_LABELS[ratio]}
                  onClick={() => setProduceRatio(ratio)}
                  className={`${holdChip} ${
                    progress.settings.produceRatio === ratio
                      ? 'bg-day text-cyc hover:brightness-105'
                      : 'border border-day/70 bg-transparent text-day/80 hover:border-day hover:text-day'
                  }`}
                >
                  {PRODUCE_RATIO_LABELS[ratio]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <GrammarReports />
        </div>
      </div>
    </main>
  )
}
