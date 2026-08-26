import { Link } from 'react-router-dom'
import { StageShell } from '../shared/StageShell'
import { StageHeader } from '../shared/StageHeader'
import { DoorIcon } from '../shared/DoorIcon'
import {
  secondaryOnMaterial,
  outlineDoorInner,
  cobaltDoorInner,
  dayDoorInner,
  framedDoorOuter,
  type StageMaterial,
} from '../shared/stageMaterials'
import { passedLevelCount, useGrammarProgress } from '../features/grammar/lib/storage'
import { challengeWordCount, useChallengeWords } from '../features/pictures/lib/challengeCollection'
import { StageHint, useStageHint } from '../shared/StageHint'

type Door = {
  id: string
  title: string
  detail: string
  to: string | null
  available: boolean
  unavailableHint: string
  material: StageMaterial
}

export function ChallengeHubPage() {
  const grammar = useGrammarProgress()
  useChallengeWords()
  const { hint, showHint } = useStageHint()
  const grammarOpen = passedLevelCount(grammar) > 0
  const mineOpen = challengeWordCount() > 0

  const doors: Door[] = [
    {
      id: 'grammar',
      title: '语法挑战',
      detail: grammarOpen ? '已学句子，限时综合局' : '先去语法学习过一关',
      to: grammarOpen ? '/practice/grammar/play' : null,
      available: grammarOpen,
      unavailableHint: '先去语法学习过一关',
      material: 'cobalt',
    },
    {
      id: 'mine',
      title: '我的挑战',
      detail: mineOpen
        ? `收藏 ${challengeWordCount()} 句，开局最多 30 句`
        : '在词汇记忆里加入例句',
      to: mineOpen ? '/practice/pictures/play' : null,
      available: mineOpen,
      unavailableHint: '先在词汇记忆里「加入我的挑战」',
      material: 'day',
    },
  ]

  return (
    <>
      <StageShell header={<StageHeader backTo="/" title="挑战模式" />}>
        <div className="flex flex-1 flex-col gap-4 pt-4">
          <p className="text-pretty text-base font-medium tracking-[0.02em] text-day/70">
            选一种挑战：语法综合局，或你收藏的词汇例句。
          </p>
          <div className="flex flex-col gap-2.5">
            {doors.map((door) => (
              <ChallengeDoor
                key={door.id}
                door={door}
                onBlocked={() => showHint(door.unavailableHint)}
              />
            ))}
          </div>
        </div>
      </StageShell>
      <StageHint message={hint} />
    </>
  )
}

function ChallengeDoor({
  door,
  onBlocked,
}: {
  door: Door
  onBlocked: () => void
}) {
  const material = door.available ? door.material : 'outline'
  const outerClass = `${framedDoorOuter}${
    material === 'cobalt' || material === 'day' ? ' active:brightness-95' : ''
  }`
  const detailClass = secondaryOnMaterial(material)
  const inner =
    material === 'day'
      ? dayDoorInner
      : material === 'cobalt'
        ? cobaltDoorInner
        : outlineDoorInner

  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block text-xl font-semibold tracking-[0.06em]">
          {door.title}
        </span>
        <span className={`mt-1 block text-base font-medium tracking-[0.02em] ${detailClass}`}>
          {door.detail}
        </span>
      </span>
      <DoorIcon open={door.available} className="size-7 shrink-0 opacity-90" />
    </>
  )

  if (door.to && door.available) {
    return (
      <Link
        to={door.to}
        data-testid={`challenge-door-${door.id}`}
        className={outerClass}
      >
        <span className={inner}>{body}</span>
      </Link>
    )
  }

  return (
    <button
      type="button"
      data-testid={`challenge-door-${door.id}`}
      aria-disabled="true"
      onClick={onBlocked}
      className={`${outerClass} text-left`}
    >
      <span className={inner}>{body}</span>
    </button>
  )
}
