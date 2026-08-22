import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { StageShell } from '../../../shared/StageShell'
import { StageHeader } from '../../../shared/StageHeader'
import { StageHint, useStageHint } from '../../../shared/StageHint'
import { playUiTap } from '../../../shared/uiSound'
import { LevelPassTrophy } from '../components/LevelPassTrophy'
import { LockPlaceholder, LockedLevelTile, levelTileMinClass } from '../../../shared/LockPlaceholder'
import {
  anchorForLevel,
  chaptersInOrder,
  levelsForChapter,
  pointById,
} from '../content/pack'
import { useGrammarProgress } from '../lib/storage'
import { isLevelPassed, isLevelUnlocked, levelListScoreLabel, levelUnlockHint } from '../lib/unlock'

const SCROLL_KEY = 'grammar/learn-list/scroll-y'
const PENDING_KEY = 'grammar/learn-list/scroll-pending'

export function LearnListPage() {
  const progress = useGrammarProgress()
  const chapters = chaptersInOrder()
  const { hint, showHint } = useStageHint()

  // Scroll restoration for the learn list. Clicking a level captures the
  // current scroll position and marks a pending return; the page's back link
  // is a regular <Link> (PUSH navigation), so the marker tells "coming back"
  // from "entering fresh".
  // Note: the position is captured in onClick, not in the unmount cleanup —
  // by the time the cleanup runs, the new page's DOM has replaced the list
  // and the browser has clamped scrollY to the shorter page (i.e. 0).
  useEffect(() => {
    const pending = sessionStorage.getItem(PENDING_KEY) === '1'
    sessionStorage.removeItem(PENDING_KEY)
    if (pending) {
      const saved = Number(sessionStorage.getItem(SCROLL_KEY) ?? '0')
      if (saved > 0) {
        requestAnimationFrame(() => window.scrollTo(0, saved))
      }
    } else {
      sessionStorage.removeItem(SCROLL_KEY)
      window.scrollTo(0, 0)
    }
  }, [])

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
                    const scoreLabel = levelListScoreLabel(level, progress)
                    const title = `${index + 1}. ${topic?.title_zh ?? level.id}`

                    if (!unlocked) {
                      return (
                        <li key={level.id}>
                          <LockedLevelTile
                            title={title}
                            onBlocked={() => showHint(levelUnlockHint(level, progress))}
                          />
                        </li>
                      )
                    }

                    return (
                      <li key={level.id}>
                        <Link
                          to={`/practice/grammar/learn/${level.id}`}
                          onClick={() => {
                            playUiTap()
                            // Capture the position before navigation starts:
                            // once the level page's shorter DOM replaces the
                            // list, the browser clamps scrollY to 0.
                            sessionStorage.setItem(
                              SCROLL_KEY,
                              String(window.scrollY),
                            )
                            sessionStorage.setItem(PENDING_KEY, '1')
                          }}
                          className={`flex ${levelTileMinClass} items-center gap-3 rounded-2xl bg-rose px-4 py-4 text-cyc transition-[filter] duration-200 ease-out hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyc active:brightness-95`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-lg font-semibold tracking-[0.04em]">
                              {title}
                            </span>
                            {anchor ? (
                              <span className="mt-1 block text-base font-medium tracking-[0.01em] text-cyc/60">
                                {anchor.en}
                              </span>
                            ) : null}
                            <span className="mt-1 block text-base font-medium tracking-[0.02em] text-cyc/70">
                              {scoreLabel}
                            </span>
                          </div>
                          {passed ? <LevelPassTrophy /> : null}
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
