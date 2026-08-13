import { Volume2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { playCardAudio } from '../lib/playAudio'
import type { Card } from '../types/card'
import { FoldRow } from './FoldRow'

const FALLBACK_IMAGE = '/images/cards/fallback.svg'

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

function CueSpeaker({
  label,
  tone,
  onPlay,
}: {
  label: string
  tone: 'onRose' | 'onCyc'
  onPlay: () => void
}) {
  const onRose = tone === 'onRose'
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onPlay}
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full border transition-[filter] duration-200 ease-out hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:brightness-95 ${
        onRose
          ? 'border-cyc/45 text-cyc focus-visible:outline-cyc'
          : 'border-day/70 text-day focus-visible:outline-day'
      }`}
    >
      <Volume2 aria-hidden="true" className="size-4 stroke-[2.25]" />
    </button>
  )
}

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
      <div className="cyc-wash pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-28">
        <p className="px-20 pt-6 text-center text-sm font-semibold tracking-[0.28em] text-day">
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

        <div className="mt-10 flex items-center gap-2 rounded-2xl bg-rose px-3 py-3">
          <h2 className="min-w-0 flex-1 text-center text-xl font-medium leading-snug tracking-[0.01em] text-cyc">
            {card.sentence}
          </h2>
          <CueSpeaker
            label="朗读句子"
            tone="onRose"
            onPlay={() => playCardAudio(card.sentenceAudio, card.sentence)}
          />
        </div>

        <div className="mt-7 flex gap-3">
          <FoldRow
            key={`${card.id}-word-${expandWordDefault}`}
            label="Word"
            defaultOpen={expandWordDefault}
          >
            <span className="inline-flex items-center justify-center gap-1">
              <span>{card.word}</span>
              <CueSpeaker
                label="朗读单词"
                tone="onCyc"
                onPlay={() => playCardAudio(card.wordAudio, card.word)}
              />
            </span>
          </FoldRow>
          {card.zh ? (
            <FoldRow
              key={`${card.id}-zh-${expandZhDefault}`}
              label="中文"
              defaultOpen={expandZhDefault}
            >
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
