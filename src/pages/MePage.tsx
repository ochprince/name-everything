import { LangToggle } from '../components/LangToggle'
import { useProgress } from '../hooks/useProgress'
import {
  todayKey,
  THINK_HOLD_LABELS,
  THINK_HOLD_OPTIONS,
  type ThinkHoldMs,
  type HintLang,
} from '../lib/storage'

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

  return (
    <main
      data-seed="af3fdd03"
      className="relative z-0 h-dvh overflow-hidden bg-cyc font-cue"
    >
      <div className="cyc-wash pointer-events-none absolute inset-0" />

      <div className="relative h-full overflow-x-clip overflow-y-auto">
        <div className="mx-auto max-w-md px-4 pb-28">
        <h1 className="pt-[max(1.5rem,env(safe-area-inset-top))] text-center text-sm font-semibold tracking-[0.22em] text-day">
          我的
        </h1>

        <ul className="mt-10 flex flex-col gap-5">
          <li className="flex items-center justify-between gap-4">
            <span className="text-lg font-medium tracking-[0.08em] text-day">
              今日已练
            </span>
            <span className="rounded-xl bg-rose px-3 py-1 text-lg font-semibold tracking-[0.08em] text-cyc">
              {todayCount}
            </span>
          </li>
          <li className="flex items-center justify-between gap-4">
            <span className="text-lg font-medium tracking-[0.08em] text-day">
              连续天数
            </span>
            <span className="rounded-xl bg-rose px-3 py-1 text-lg font-semibold tracking-[0.08em] text-cyc">
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
        </div>
        </div>
      </div>
    </main>
  )
}
