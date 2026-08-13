import { useEffect, useState } from 'react'
import type { Card } from '../types/card'
import { FoldRow } from './FoldRow'

const FALLBACK_IMAGE = '/images/cards/fallback.svg'

const DIRECTION_CONTRACT = `<!--
THESIS: The object stands on a night-to-dawn cyclorama; English is the spoken line in the horizon, not a vocab flashcard.
OWN-WORLD: Depthless cyc black, a cobalt horizon band, rose gathering toward day-wash; lighting-plot stencil caps; the photo is an actor inset on the wash, never a cream card.
STORY: See the thing, say the sentence, optionally raise Word / 中文 like a lighting cue; Got it is day.
FIRST VIEWPORT: Phone column — cyc wash full screen; 4:3 object photo floating with side margins; sentence on the rose band; two collapsed cue rows; Forgot / 记录 / Got it as cues, Got it filled day-wash.
FORM: Cyclorama dawn, Operate, committed color strategy, seed af3fdd03.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`

export interface PracticeCardProps {
  card: Card
  pinned: boolean
  expandWordDefault: boolean
  expandZhDefault: boolean
  onGotIt: () => void
  onForgot: () => void
  onTogglePin: () => void
}

const cueButton =
  'min-h-14 flex-1 rounded-2xl px-2.5 font-cue text-lg font-semibold tracking-[0.08em] transition-[filter,background-color,border-color] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day active:brightness-95'

export function PracticeCard({
  card,
  pinned,
  expandWordDefault,
  expandZhDefault,
  onGotIt,
  onForgot,
  onTogglePin,
}: PracticeCardProps) {
  const [imageSrc, setImageSrc] = useState(card.image)

  useEffect(() => {
    setImageSrc(card.image)
  }, [card.image])

  return (
    <article data-seed="af3fdd03" className="relative min-h-dvh overflow-x-hidden font-cue">
      <div hidden aria-hidden="true" dangerouslySetInnerHTML={{ __html: DIRECTION_CONTRACT }} />
      <div className="cyc-wash pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-28">
        <p className="pt-6 text-center text-sm font-semibold tracking-[0.28em] text-day">
          Name Everything
        </p>

        <figure className="mt-8">
          <img
            src={imageSrc}
            alt=""
            className="aspect-[4/3] w-full rounded-2xl object-cover shadow-[0_22px_44px_-14px_rgba(0,0,0,0.7)]"
            onError={() => setImageSrc(FALLBACK_IMAGE)}
          />
        </figure>

        <div className="mt-10 rounded-2xl bg-rose px-4 py-3">
          <h2 className="text-center text-xl font-medium leading-snug tracking-[0.01em] text-cyc">
            {card.sentence}
          </h2>
        </div>

        <div className="mt-7 flex gap-3">
          <FoldRow label="Word" defaultOpen={expandWordDefault}>
            {card.word}
          </FoldRow>
          {card.zh ? (
            <FoldRow label="中文" defaultOpen={expandZhDefault}>
              {card.zh}
            </FoldRow>
          ) : null}
        </div>

        <div className="mt-auto flex gap-2.5 pt-10">
          <button
            type="button"
            onClick={onForgot}
            className={`${cueButton} border border-day/75 bg-cyc text-day hover:border-day hover:brightness-110`}
          >
            Forgot
          </button>
          <button
            type="button"
            onClick={onTogglePin}
            className={`${cueButton} bg-rose text-cyc hover:brightness-105`}
          >
            {pinned ? '已记录' : '记录'}
          </button>
          <button
            type="button"
            onClick={onGotIt}
            className={`${cueButton} bg-day text-cyc hover:brightness-105`}
          >
            Got it
          </button>
        </div>
      </div>
    </article>
  )
}
