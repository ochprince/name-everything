import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { STAGE_CHROME_OFFSET, StageShell } from '../../../shared/StageShell'
import { StageHeader } from '../../../shared/StageHeader'
import { StageHint, useStageHint } from '../../../shared/StageHint'
import { playUiTap } from '../../../shared/uiSound'
import { LevelPassTrophy } from '../components/LevelPassTrophy'
import { LockPlaceholder, LockedLevelTile } from '../../../shared/LockPlaceholder'
import { ListChevron } from '../../../shared/DoorIcon'
import {
  chapterListMaterial,
  secondaryOnMaterial,
  stageListShell,
  stageMaterialClass,
  type StageMaterial,
} from '../../../shared/stageMaterials'
import {
  anchorForLevel,
  chaptersInOrder,
  levelsForChapter,
  pointById,
} from '../content/pack'
import { useGrammarProgress } from '../lib/storage'
import {
  isLevelClearedOnContent,
  isLevelInProgress,
  isLevelUnlocked,
  levelListScoreLabel,
  levelListScoreTone,
  levelUnlockHint,
} from '../lib/unlock'

const SCROLL_KEY = 'grammar/learn-list/scroll-y'
const PENDING_KEY = 'grammar/learn-list/scroll-pending'
const TOP_BANNER = 'https://i.imgur.com/rTUxgy2.jpg'

export function LearnListPage() {
  const progress = useGrammarProgress()
  const chapters = chaptersInOrder()
  const { hint, showHint } = useStageHint()

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
      <StageShell
        headerTone="clear"
        header={<StageHeader backTo="/" title="语法学习" />}
      >
        <div
          className="relative -mx-4 shrink-0"
          style={{ marginTop: `calc(-1 * ${STAGE_CHROME_OFFSET})` }}
        >
          <img
            src={TOP_BANNER}
            alt=""
            className="block w-full object-cover object-[50%_56%]"
            style={{ height: `calc(7rem + ${STAGE_CHROME_OFFSET})` }}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-cyc/70 to-transparent" />
        </div>

        <div className="relative z-10 -mt-6 flex flex-col gap-9 pb-4">
          {chapters.map((chapter, chapterIndex) => {
            const levels = levelsForChapter(chapter.id)
            // Alternate by chapter: 简单句 day, 谓语 cobalt, 非谓语 day…
            const chapterMaterial = chapterListMaterial(chapterIndex)
            return (
              <section key={chapter.id} className="flex flex-col gap-3">
                <div className="px-0.5">
                  <h2 className="text-lg font-semibold tracking-[0.1em] text-day">
                    {chapter.title_zh}
                  </h2>
                  {chapter.description_zh ? (
                    <p className="mt-1 text-sm font-medium tracking-[0.04em] text-day/65">
                      {chapter.description_zh}
                    </p>
                  ) : null}
                </div>
                {!chapter.released ? (
                  <LockPlaceholder label="章节未开放" />
                ) : (
                  <ol className="flex flex-col gap-2.5">
                    {levels.map((level, index) => {
                      const anchor = anchorForLevel(level.id)
                      const topic = pointById(level.grammar_point_id)
                      const unlocked = isLevelUnlocked(level, progress)
                      const cleared = isLevelClearedOnContent(level.id, progress)
                      const inProgress = isLevelInProgress(level, progress)
                      const scoreLabel = levelListScoreLabel(level, progress)
                      const scoreTone = levelListScoreTone(level, progress)
                      const levelNo = String(index + 1).padStart(2, '0')
                      const topicTitle = topic?.title_zh ?? level.id
                      // Keep chapter color (day/cobalt); in-progress is badge-only
                      const material: StageMaterial = chapterMaterial

                      if (!unlocked) {
                        return (
                          <li key={level.id}>
                            <LockedLevelTile
                              title={topicTitle}
                              levelNo={levelNo}
                              detail={anchor?.en}
                              onBlocked={() => showHint(levelUnlockHint(level, progress))}
                            />
                          </li>
                        )
                      }

                      const secondary = secondaryOnMaterial(material)
                      const markMuted =
                        material === 'cobalt' ? 'text-day/50' : 'text-cyc/40'
                      const progressLabel =
                        material === 'cobalt' ? 'text-day' : 'text-cyc'

                      return (
                        <li key={level.id}>
                          <Link
                            to={`/practice/grammar/learn/${level.id}`}
                            onClick={() => {
                              playUiTap()
                              sessionStorage.setItem(SCROLL_KEY, String(window.scrollY))
                              sessionStorage.setItem(PENDING_KEY, '1')
                            }}
                            className={`${stageListShell} ${stageMaterialClass(material)}`}
                            data-chapter-material={material}
                          >
                            <div className="min-w-0 flex-1">
                              <span
                                className={`block text-[0.7rem] font-semibold tracking-[0.2em] ${markMuted}`}
                              >
                                LEVEL {levelNo}
                              </span>
                              <span className="mt-1.5 block text-lg font-semibold tracking-[0.04em]">
                                {topicTitle}
                              </span>
                              {anchor ? (
                                <span
                                  className={`mt-1 block text-base font-medium tracking-[0.06em] ${secondary}`}
                                >
                                  {anchor.en}
                                </span>
                              ) : null}
                              <span
                                className={`mt-1.5 block text-sm font-medium tracking-[0.02em] ${secondary}`}
                              >
                                {scoreTone === 'update' && scoreLabel.endsWith('有更新') ? (
                                  <>
                                    {scoreLabel.slice(0, -'有更新'.length)}
                                    <span className="text-sky-400">有更新</span>
                                  </>
                                ) : (
                                  scoreLabel
                                )}
                              </span>
                            </div>
                            <span className="flex shrink-0 items-center gap-2 self-center">
                              {inProgress ? (
                                <span
                                  className={`inline-flex items-center gap-1.5 text-sm font-semibold tracking-[0.08em] ${progressLabel}`}
                                >
                                  <span
                                    aria-hidden="true"
                                    className="size-2.5 rounded-full bg-rose"
                                  />
                                  进行中
                                </span>
                              ) : null}
                              {cleared ? <LevelPassTrophy /> : null}
                              <ListChevron className={`size-5 ${markMuted}`} />
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
