import { Link } from 'react-router-dom'
import { StageShell } from '../shared/StageShell'
import { StageHint, useStageHint } from '../shared/StageHint'
import { useGrammarProgress } from '../features/grammar/lib/storage'
import { practiceTiles, type PracticeTile } from './practiceModules'

export function PracticeHomePage() {
  const progress = useGrammarProgress()
  const tiles = practiceTiles(progress)
  const { hint, showHint } = useStageHint()

  return (
    <>
      <StageShell
        header={
          <h1 className="pt-2 text-center text-sm font-semibold tracking-[0.22em] text-day">
            练习
          </h1>
        }
      >
        <div className="flex flex-1 flex-col gap-5 pb-4 pt-8">
          <div className="flex flex-col gap-2.5">
            {tiles.map((tile) => (
              <ModuleTile
                key={tile.id}
                tile={tile}
                onBlocked={() => {
                  if (tile.unavailableHint) showHint(tile.unavailableHint)
                }}
              />
            ))}
          </div>
        </div>
      </StageShell>
      <StageHint message={hint} />
    </>
  )
}

function ModuleTile({
  tile,
  onBlocked,
}: {
  tile: PracticeTile
  onBlocked: () => void
}) {
  const className =
    'flex min-h-[5.5rem] w-full flex-col justify-center rounded-2xl px-5 py-4 text-left transition-[filter] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyc'

  if (!tile.available || !tile.to) {
    return (
      <button
        type="button"
        aria-disabled="true"
        data-testid={`tile-${tile.id}`}
        onClick={onBlocked}
        className={`${className} cursor-not-allowed border border-day/20 bg-cyc/80 text-day/45`}
      >
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-xl font-semibold tracking-[0.06em]">{tile.title}</span>
          <span className="text-sm font-semibold tracking-[0.18em] text-day/35">未解锁</span>
        </span>
        <span className="mt-1 text-base font-medium tracking-[0.02em]">{tile.detail}</span>
      </button>
    )
  }

  return (
    <Link
      to={tile.to}
      data-testid={`tile-${tile.id}`}
      className={`${className} bg-rose text-cyc hover:brightness-105 active:brightness-95`}
    >
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-xl font-semibold tracking-[0.06em]">{tile.title}</span>
        {tile.badge ? (
          <span className="shrink-0 text-sm font-medium tracking-[0.04em] text-cyc/55">
            {tile.badge}
          </span>
        ) : null}
      </span>
      <span className="mt-1 text-lg font-medium tracking-[0.01em]">{tile.detail}</span>
    </Link>
  )
}
