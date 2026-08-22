import { Link } from 'react-router-dom'
import { StageShell } from '../../../shared/StageShell'
import { StageHeader } from '../../../shared/StageHeader'
import { StageHint, useStageHint } from '../../../shared/StageHint'
import { LockPlaceholder, LockedLevelTile, levelTileMinClass } from '../../../shared/LockPlaceholder'
import {
  anchorForLevel,
  chaptersInOrder,
  levelsForChapter,
  pointById,
} from '../content/pack'
import { useGrammarProgress } from '../lib/storage'
import { highScoreFor, isLevelPassed, isLevelUnlocked, thresholdFor } from '../lib/unlock'

export function LearnListPage() {
  const progress = useGrammarProgress()
  const chapters = chaptersInOrder()
  const { hint, showHint } = useStageHint()

  return (
    <>
      <StageShell header={<StageHeader backTo="/" title="语法学习" />}>
        <div className="flex flex-col gap-10 pt-8">
          {chapters.map((chapter) => {
          const levels = levelsForChapter(chapter.id)
          return (
            <section key={chapter.id} className="flex flex-col gap-3">
              <h2 className="text-xl font-semibold tracking-[0.08em] text-day">
                {chapter.title_zh}
              </h2>
              {chapter.description_zh ? (
                <p className="text-base font-medium tracking-[0.02em] text-day/75">
                  {chapter.description_zh}
                </p>
              ) : null}
              {!chapter.released ? (
                <LockPlaceholder label="章节未开放" />
              ) : (
                <ol className="flex flex-col gap-2">
                  {levels.map((level, index) => {
                    const anchor = anchorForLevel(level.id)
                    const topic = pointById(level.grammar_point_id)
                    const unlocked = isLevelUnlocked(level, progress)
                    const passed = isLevelPassed(level.id, progress)
                    const score = highScoreFor(level.id, progress)
                    const need = thresholdFor(level)
                    const title = `${index + 1}. ${topic?.title_zh ?? level.id}`

                    if (!unlocked) {
                      return (
                        <li key={level.id}>
                          <LockedLevelTile
                            title={title}
                            onBlocked={() => showHint('先过上一关')}
                          />
                        </li>
                      )
                    }

                    return (
                      <li key={level.id}>
                        <Link
                          to={`/practice/grammar/learn/${level.id}`}
                          className={`block ${levelTileMinClass} rounded-2xl bg-rose px-4 py-4 text-cyc transition-[filter] duration-200 ease-out hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyc active:brightness-95`}
                        >
                          <span className="text-lg font-semibold tracking-[0.04em]">
                            {title}
                          </span>
                          {anchor ? (
                            <span className="mt-1 block text-base font-medium tracking-[0.01em] text-cyc/60">
                              {anchor.en}
                            </span>
                          ) : null}
                          <span className="mt-1 block text-base font-medium tracking-[0.02em] text-cyc/70">
                            {passed
                              ? `最高 ${score} · 已过关`
                              : `最高 ${score} / ${need}`}
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ol>
              )}
            </section>
          )
        })}
        </div>
      </StageShell>
      <StageHint message={hint} />
    </>
  )
}
