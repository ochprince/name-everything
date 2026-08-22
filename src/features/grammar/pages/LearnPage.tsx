import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { StageShell } from '../../../shared/StageShell'
import { StageHeader } from '../../../shared/StageHeader'
import { ReportDialog } from '../components/ReportDialog'
import { ScoreBadge } from '../components/ScoreBadge'
import {
  anchorForLevel,
  levelById,
  pointById,
  spansForSentence,
} from '../content/pack'
import { useGrammarProgress } from '../lib/storage'
import { highScoreFor, isLevelUnlocked, thresholdFor } from '../lib/unlock'

export function LearnPage() {
  const { levelId = '' } = useParams()
  const progress = useGrammarProgress()
  const level = levelById(levelId)
  const anchor = level ? anchorForLevel(level.id) : undefined
  const unlocked = level ? isLevelUnlocked(level, progress) : false
  const spans = useMemo(
    () =>
      anchor
        ? spansForSentence(anchor.id).filter(
            (span) => span.end - span.start < (anchor.en.length ?? 0),
          )
        : [],
    [anchor],
  )
  const [activeSpanId, setActiveSpanId] = useState<string | null>(null)

  if (!level || !anchor || !unlocked) {
    return <Navigate to="/practice/grammar/learn" replace />
  }

  const activeSpan = spans.find((span) => span.id === activeSpanId)
  const point = activeSpan ? pointById(activeSpan.grammar_point_id) : undefined
  const score = highScoreFor(level.id, progress)
  const need = thresholdFor(level)
  const topic = pointById(level.grammar_point_id)

  return (
    <StageShell
      header={
        <StageHeader
          backTo="/practice/grammar/learn"
          title={topic?.title_zh ?? '学习'}
          trailing={<ScoreBadge score={score} need={need} />}
        />
      }
    >
      <div className="flex flex-1 flex-col gap-6 px-2 pt-8">
        <p className="text-2xl font-medium leading-snug tracking-[0.01em] text-day">
          <ClickableSentence
            en={anchor.en}
            spans={spans}
            activeId={activeSpanId}
            onPick={setActiveSpanId}
          />
        </p>
        {anchor.zh ? (
          <p className="text-lg font-medium tracking-[0.02em] text-rose">{anchor.zh}</p>
        ) : null}

        <div className="min-h-[7.5rem]">
          {point ? (
            <div className="cue-raise relative rounded-2xl bg-rose px-4 py-4 pr-14 text-cyc">
              <div className="absolute right-3 top-3">
                <ReportDialog
                  target={{
                    asset_type: 'grammar_point',
                    asset_id: point.id,
                    level_id: level.id,
                  }}
                  label="报错这个知识点"
                  className="border-cyc/25 text-cyc/70 hover:border-cyc/45 hover:text-cyc"
                />
              </div>
              <p className="text-xl font-semibold tracking-[0.04em]">{point.title_zh}</p>
              <p className="mt-2 text-lg font-medium tracking-[0.02em]">{point.body_zh}</p>
            </div>
          ) : (
            <p className="text-lg font-medium tracking-[0.02em] text-day/70">
              {topic?.body_zh}
            </p>
          )}
        </div>

        <Link
          to={`/practice/grammar/learn/${level.id}/play`}
          className="mt-auto mb-4 inline-flex min-h-14 items-center justify-center rounded-2xl bg-day px-6 font-cue text-lg font-semibold tracking-[0.08em] text-cyc transition-[filter] duration-200 ease-out hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day active:brightness-95"
        >
          开始游戏
        </Link>
      </div>
    </StageShell>
  )
}

function ClickableSentence({
  en,
  spans,
  activeId,
  onPick,
}: {
  en: string
  spans: { id: string; start: number; end: number }[]
  activeId: string | null
  onPick: (id: string) => void
}) {
  const pieces: { key: string; text: string; spanId?: string }[] = []
  let cursor = 0
  const ordered = [...spans].sort((a, b) => a.start - b.start)
  for (const span of ordered) {
    if (span.start < cursor) continue
    if (span.start > cursor) {
      pieces.push({ key: `t-${cursor}`, text: en.slice(cursor, span.start) })
    }
    pieces.push({
      key: span.id,
      text: en.slice(span.start, span.end),
      spanId: span.id,
    })
    cursor = span.end
  }
  if (cursor < en.length) {
    pieces.push({ key: `t-${cursor}`, text: en.slice(cursor) })
  }

  return (
    <>
      {pieces.map((piece) =>
        piece.spanId ? (
          <button
            key={piece.key}
            type="button"
            onClick={() => onPick(piece.spanId!)}
            className={`rounded-md px-0.5 transition-colors duration-200 ease-out ${
              activeId === piece.spanId
                ? 'bg-rose text-cyc'
                : 'underline decoration-rose/80 decoration-2 underline-offset-4'
            }`}
          >
            {piece.text}
          </button>
        ) : (
          <span key={piece.key}>{piece.text}</span>
        ),
      )}
    </>
  )
}
