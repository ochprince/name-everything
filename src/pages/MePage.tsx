import { useProgress } from '../hooks/useProgress'
import { todayKey } from '../lib/storage'

const holdButton =
  'min-h-11 min-w-[4.75rem] rounded-2xl px-3 font-cue text-base font-semibold tracking-[0.14em] transition-[filter,background-color,border-color] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day active:brightness-95'

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
        {on ? 'HOLD' : 'OUT'}
      </button>
    </div>
  )
}

export function MePage() {
  const { progress, update } = useProgress()
  const todayCount = progress.gotItToday[todayKey()]?.length ?? 0
  const streak = progress.streaks.count

  return (
    <main
      data-seed="af3fdd03"
      className="relative min-h-dvh overflow-x-hidden bg-cyc font-cue"
    >
      {/* THESIS: Me is a cue sheet of practice light, not a stats dashboard. OWN-WORLD: cyc/cobalt/rose/day; counts as plot levels; expand defaults as cue holds. STORY: Read today's work and streak, hold Word / 中文 open if that's how you practice. FIRST VIEWPORT: Phone column, cyc wash, 我的, two cue-sheet rows, two HOLD/OUT marks. FORM: Cyclorama dawn, Operate, committed, seed af3fdd03. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md */}
      <div className="cyc-wash pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-md px-4 pb-28">
        <h1 className="px-4 pt-6 text-center text-sm font-semibold tracking-[0.28em] text-day">
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
          <CueHold
            label="默认展开目标词"
            on={progress.settings.expandWord}
            onToggle={() =>
              update((p) => ({
                ...p,
                settings: {
                  ...p.settings,
                  expandWord: !p.settings.expandWord,
                },
              }))
            }
          />
          <CueHold
            label="默认展开中文"
            on={progress.settings.expandZh}
            onToggle={() =>
              update((p) => ({
                ...p,
                settings: {
                  ...p.settings,
                  expandZh: !p.settings.expandZh,
                },
              }))
            }
          />
        </div>
      </div>
    </main>
  )
}
