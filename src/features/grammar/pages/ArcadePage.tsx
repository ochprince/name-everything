import { Link, Navigate } from 'react-router-dom'
import { StageShell, STAGE_CHROME_OFFSET } from '../../../shared/StageShell'
import { StageHeader } from '../../../shared/StageHeader'
import trophyPassed from '../assets/trophy-passed.svg'
import { ArcadeEmptyPlaceholder } from '../components/ArcadeEmptyPlaceholder'
import { ChallengeRulesDialog } from '../components/ChallengeRulesDialog'
import { ARCADE_SESSION_SIZE } from '../lib/arcadeChallenge'
import { useGrammarProgress, type ArcadeRecord } from '../lib/storage'

function entryEarnedTrophy(entry: ArcadeRecord): boolean {
  return entry.cleared && entry.total >= ARCADE_SESSION_SIZE
}

function formatHistoryTime(at: string): string {
  return new Date(at).toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function HistoryScore({ entry }: { entry: ArcadeRecord }) {
  return (
    <span className="text-lg font-semibold tabular-nums tracking-[0.04em]">
      {entry.score}
      <span className="text-day/55">/{entry.total}</span>
    </span>
  )
}

export function ArcadePage() {
  const progress = useGrammarProgress()
  if (progress.passedLevelIds.length === 0) {
    return <Navigate to="/" replace />
  }

  const hasHistory = progress.arcadeHistory.length > 0

  return (
    <StageShell
      header={
        <StageHeader
          backTo="/"
          title="挑战模式"
          trailing={
            <div className="flex items-center gap-1">
              <ChallengeRulesDialog />
            </div>
          }
        />
      }
    >
      <div
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden pt-2"
        style={{ maxHeight: `calc(100dvh - ${STAGE_CHROME_OFFSET} - 7rem)` }}
      >
        <section className="flex flex-col gap-2">
          <h2 className="px-0.5 text-xs font-semibold tracking-[0.18em] text-day/45">
            累计奖杯
          </h2>
          <div className="flex items-center justify-center gap-4 rounded-2xl border border-day/10 bg-cobalt/25 px-5 py-4">
            <img
              src={trophyPassed}
              alt=""
              className="size-12 shrink-0 drop-shadow-[0_2px_6px_rgba(80,50,0,0.35)]"
              draggable={false}
            />
            <div className="min-w-0">
              <p className="text-4xl font-semibold tabular-nums leading-none tracking-[0.04em] text-day">
                {progress.arcadeTrophyCount}
              </p>
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          {hasHistory ? (
            <>
              <h2 className="shrink-0 px-0.5 text-xs font-semibold tracking-[0.18em] text-day/45">
                最近
              </h2>
              <ol className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-y-contain">
                {progress.arcadeHistory.map((entry) => {
                  const earnedTrophy = entryEarnedTrophy(entry)
                  return (
                    <li
                      key={entry.id}
                      className="flex items-center gap-3 rounded-xl bg-cobalt px-3 py-3 text-day"
                    >
                      <time
                        dateTime={entry.at}
                        className="shrink-0 text-xs font-medium tabular-nums tracking-[0.02em] text-day/50"
                      >
                        {formatHistoryTime(entry.at)}
                      </time>
                      <span className="min-w-0 flex-1" aria-hidden="true" />
                      <span className="flex size-8 shrink-0 items-center justify-center">
                        {earnedTrophy ? (
                          <img
                            src={trophyPassed}
                            alt=""
                            className="size-7 drop-shadow-[0_1px_2px_rgba(80,50,0,0.35)]"
                            draggable={false}
                          />
                        ) : null}
                      </span>
                      <HistoryScore entry={entry} />
                    </li>
                  )
                })}
              </ol>
            </>
          ) : (
            <ArcadeEmptyPlaceholder />
          )}
        </section>

        <Link
          to="/practice/grammar/play/run"
          className="mb-4 mt-auto inline-flex min-h-14 shrink-0 items-center justify-center rounded-2xl bg-day px-6 text-lg font-semibold tracking-[0.08em] text-cyc transition-[filter] duration-200 ease-out hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day active:brightness-95"
        >
          开始挑战
        </Link>
      </div>
    </StageShell>
  )
}
