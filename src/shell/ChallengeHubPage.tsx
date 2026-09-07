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
import { isAiAllowed } from '../ai/allowance'
import { getOrCreateDeviceId } from '../ai/deviceId'
import {
  loadBestChain,
  CHAIN_TROPHY_SCORE,
} from '../features/pictures/lib/wordChain'
import trophyPassed from '../features/grammar/assets/trophy-passed.svg'
import { StageHint, useStageHint } from '../shared/StageHint'
import { useEffect, useState } from 'react'

type Door = {
  id: string
  title: string
  detail: string
  to: string | null
  available: boolean
  unavailableHint: string
  material: StageMaterial
  /** 历史最高分达到奖杯线时显示小金杯。 */
  earnedTrophy?: boolean
}

export function ChallengeHubPage() {
  const grammar = useGrammarProgress()
  useChallengeWords()
  const [aiOk, setAiOk] = useState<boolean | null>(null)
  useEffect(() => {
    let cancelled = false
    void isAiAllowed(getOrCreateDeviceId()).then((ok) => {
      if (!cancelled) setAiOk(ok)
    })
    return () => {
      cancelled = true
    }
  }, [])
  const { hint, showHint } = useStageHint()
  const grammarOpen = passedLevelCount(grammar) > 0
  const mineOpen = challengeWordCount() > 0
  const challengerOpen = grammarOpen && aiOk === true
  const chainBest = loadBestChain()

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
    {
      id: 'challenger',
      title: '挑战者',
      detail: challengerOpen
        ? '自由造句连战，3 句击败一个知识点'
        : aiOk === false
          ? '需要先开通 AI'
          : '先去语法学习过一关',
      to: challengerOpen ? '/practice/challenge/challenger' : null,
      available: challengerOpen,
      unavailableHint:
        aiOk === false ? '挑战者需要 AI 判定，请先开通' : '先去语法学习过一关',
      material: 'cobalt',
    },
    {
      id: 'chain',
      title: '词语接龙',
      detail: chainBest
        ? `历史最高 ${chainBest.score} 分 · ${chainBest.length} 词`
        : '词库词 ×2，词库外真词也能接',
      to: '/practice/challenge/chain',
      available: true,
      unavailableHint: '',
      material: 'day',
      earnedTrophy: chainBest !== null && chainBest.score >= CHAIN_TROPHY_SCORE,
    },
  ]

  return (
    <>
      <StageShell header={<StageHeader backTo="/" title="挑战模式" />}>
        <div className="flex flex-1 flex-col gap-4 pt-4">
          <p className="text-pretty text-base font-medium tracking-[0.02em] text-day/70">
            选一种挑战：语法综合局、你收藏的词汇例句、自由造句，或词语接龙。
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

/** Same door shell as PracticeHome ModuleTile — equal geometry, shared materials. */
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
  const innerClass =
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
          {door.earnedTrophy ? (
            <img
              src={trophyPassed}
              alt="已获词语接龙奖杯"
              title="词语接龙历史最高分达到 30 分奖杯线"
              className="ml-2 inline-block h-6 w-6 align-[-4px]"
            />
          ) : null}
        </span>
        <span className={`mt-1 block text-base font-medium tracking-[0.02em] ${detailClass}`}>
          {door.detail}
        </span>
      </span>
      <DoorIcon
        open={door.available}
        className={`size-[5.75rem] shrink-0 ${
          material === 'day' ? 'text-cyc' : 'text-day'
        }`}
      />
    </>
  )

  const content = <span className={`${innerClass} min-h-[7.5rem]`}>{body}</span>

  if (!door.available || !door.to) {
    return (
      <button
        type="button"
        data-testid={`challenge-door-${door.id}`}
        aria-disabled="true"
        onClick={onBlocked}
        className={`${outerClass} cursor-not-allowed text-left text-day/45`}
      >
        {content}
      </button>
    )
  }

  return (
    <Link
      to={door.to}
      data-testid={`challenge-door-${door.id}`}
      className={outerClass}
    >
      {content}
    </Link>
  )
}
