import { Link, Navigate } from 'react-router-dom'
import { StageShell } from '../../../shared/StageShell'
import { StageHeader } from '../../../shared/StageHeader'
import trophyPassed from '../../grammar/assets/trophy-passed.svg'
import { ArcadeEmptyPlaceholder } from '../../grammar/components/ArcadeEmptyPlaceholder'
import { ARCADE_SESSION_SIZE } from '../../grammar/lib/arcadeChallenge'
import type { ArcadeRecord } from '../../grammar/lib/storage'
import { challengeWordCount, useChallengeWords } from '../lib/challengeCollection'
import { useMyChallengeProgress } from '../lib/myChallengeProgress'

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

export function MyChallengePage() {
  useChallengeWords()
  const progress = useMyChallengeProgress()
  const count = challengeWordCount()

  if (count === 0) {
    return <Navigate to="/practice/challenge" replace />
  }

  const hasHistory = progress.history.length > 0

  return (
    <StageShell
      lockViewport
      header={
        <StageHeader
          backTo="/practice/challenge"
          title="我的挑战"
          trailing={
            <p className="rounded-xl bg-day px-2.5 py-1 text-sm font-semibold tracking-[0.12em] text-cyc">
              {count} 句
            </p>
          }
        />
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden pt-2">
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
                {progress.trophyCount}
              </p>
            </div>
          </div>
          <p className="px-0.5 text-sm font-medium tracking-[0.02em] text-day/55">
            从收藏例句中抽取最多 {ARCADE_SESSION_SIZE} 句；当前以输入作答为主。库满且全部过完才给奖杯。
          </p>
        </section>

        <section className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          {hasHistory ? (
            <>
              <h2 className="shrink-0 px-0.5 text-xs font-semibold tracking-[0.18em] text-day/45">
                最近
              </h2>
              <ol className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-y-contain">
                {progress.history.map((entry) => {
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
          to="/practice/pictures/play/run"
          className="mt-auto inline-flex min-h-14 shrink-0 items-center justify-center rounded-2xl bg-day px-6 text-lg font-semibold tracking-[0.08em] text-cyc transition-[filter] duration-200 ease-out hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day active:brightness-95"
        >
          开始挑战
        </Link>
      </div>
    </StageShell>
  )
}
