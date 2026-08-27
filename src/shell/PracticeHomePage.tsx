import { Link } from 'react-router-dom'
import { StageShell } from '../shared/StageShell'
import { StageHeader } from '../shared/StageHeader'
import { StageHint, useStageHint } from '../shared/StageHint'
import { DoorIcon } from '../shared/DoorIcon'
import {
  secondaryOnMaterial,
  outlineDoorInner,
  cobaltDoorInner,
  dayDoorInner,
  framedDoorOuter,
  type StageMaterial,
} from '../shared/stageMaterials'
import { useGrammarProgress } from '../features/grammar/lib/storage'
import { useChallengeWords } from '../features/pictures/lib/challengeCollection'
import { ensurePictureWordsReady } from '../features/pictures/lib/pictureWordsCatalog'
import { practiceTiles, type PracticeTile } from './practiceModules'
import { useEffect, useState } from 'react'

const BANNER_IMAGE = `${import.meta.env.BASE_URL}images/home/banner-cup.jpg`
const FALLBACK_IMAGE = `${import.meta.env.BASE_URL}images/cards/fallback.svg`

const materialById: Record<string, StageMaterial> = {
  vocab: 'day',
  'grammar-learn': 'cobalt',
  'grammar-play': 'outline',
}

function HomeBanner() {
  const [src, setSrc] = useState(BANNER_IMAGE)

  return (
    <figure className="relative overflow-hidden rounded-2xl shadow-[0_22px_44px_-14px_rgba(0,0,0,0.75)]">
      <img
        src={src}
        alt=""
        className="aspect-[16/10] w-full object-cover"
        onError={() => setSrc(FALLBACK_IMAGE)}
      />
    </figure>
  )
}

export function PracticeHomePage() {
  const progress = useGrammarProgress()
  useChallengeWords()
  const tiles = practiceTiles(progress)
  const { hint, showHint } = useStageHint()

  useEffect(() => {
    void ensurePictureWordsReady()
  }, [])

  return (
    <>
      <StageShell header={<StageHeader title="练习" />}>
        <div className="flex flex-1 flex-col gap-5 pb-4 pt-6">
          <HomeBanner />
          <div className="flex flex-col gap-2.5">
            {tiles.map((tile) => (
              <ModuleTile
                key={tile.id}
                tile={tile}
                material={
                  tile.available
                    ? (materialById[tile.id] ?? 'day')
                    : 'outline'
                }
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
  material,
  onBlocked,
}: {
  tile: PracticeTile
  material: StageMaterial
  onBlocked: () => void
}) {
  const outerClass = `${framedDoorOuter}${
    material === 'cobalt' || material === 'day' ? ' active:brightness-95' : ''
  }`
  const detailClass = secondaryOnMaterial(material)

  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block text-xl font-semibold tracking-[0.06em]">
          {tile.title}
        </span>
        <span className={`mt-1 block text-base font-medium tracking-[0.02em] ${detailClass}`}>
          {tile.detail}
        </span>
        {tile.badge ? (
          <span className={`mt-0.5 block text-sm font-medium tracking-[0.04em] ${detailClass}`}>
            {tile.badge}
          </span>
        ) : null}
      </span>
      <DoorIcon
        open={tile.available}
        className={`size-[5.75rem] shrink-0 ${
          material === 'day' ? 'text-cyc' : 'text-day'
        }`}
      />
    </>
  )

  const innerClass =
    material === 'day'
      ? dayDoorInner
      : material === 'cobalt'
        ? cobaltDoorInner
        : outlineDoorInner

  const content = (
    <span className={`${innerClass} min-h-[7.5rem]`}>{body}</span>
  )

  if (!tile.available || !tile.to) {
    return (
      <button
        type="button"
        aria-disabled="true"
        data-testid={`tile-${tile.id}`}
        onClick={onBlocked}
        className={`${outerClass} cursor-not-allowed text-day/45`}
      >
        {content}
      </button>
    )
  }

  return (
    <Link to={tile.to} data-testid={`tile-${tile.id}`} className={outerClass}>
      {content}
    </Link>
  )
}
