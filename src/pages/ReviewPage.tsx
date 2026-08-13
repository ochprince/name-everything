import { useEffect, useRef, useState } from 'react'
import { PracticeCard } from '../components/PracticeCard'
import { loadCards } from '../content/loadCards'
import { useProgress } from '../hooks/useProgress'
import {
  markForgot,
  markGotIt,
  todayKey,
  togglePin,
} from '../lib/storage'
import type { Card } from '../types/card'

const FALLBACK_IMAGE = '/images/cards/fallback.svg'

type QueueTab = 'forgot' | 'pinned'

const cueTab =
  'min-h-14 flex-1 rounded-2xl px-2.5 font-cue text-lg font-semibold tracking-[0.08em] transition-[filter,background-color,border-color] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day'

function CueThumb({ src }: { src: string }) {
  const [imageSrc, setImageSrc] = useState(src)

  useEffect(() => {
    setImageSrc(src)
  }, [src])

  return (
    <img
      src={imageSrc}
      alt=""
      className="aspect-[4/3] w-[5.5rem] shrink-0 rounded-xl object-cover shadow-[0_12px_24px_-10px_rgba(0,0,0,0.7)]"
      onError={() => setImageSrc(FALLBACK_IMAGE)}
    />
  )
}

function cardsForIds(ids: string[]): Card[] {
  const catalog = loadCards()
  return ids.flatMap((id) => {
    const card = catalog.find((item) => item.id === id)
    return card ? [card] : []
  })
}

export function ReviewPage() {
  const { progress, update } = useProgress()
  const [tab, setTab] = useState<QueueTab>('forgot')
  const [openId, setOpenId] = useState<string | null>(null)

  const sheetRef = useRef<HTMLDialogElement>(null)
  const queueIds = tab === 'forgot' ? progress.forgotIds : progress.pinnedIds
  const listed = cardsForIds(queueIds)
  const openCard = openId
    ? loadCards().find((card) => card.id === openId) ?? null
    : null

  useEffect(() => {
    const sheet = sheetRef.current
    if (!openCard || !sheet || sheet.open) return
    if (typeof sheet.showModal === 'function') {
      sheet.showModal()
    } else {
      sheet.setAttribute('open', '')
    }
  }, [openCard])

  const emptyCopy =
    tab === 'forgot'
      ? '暂时没有 Forgot，去练习里诚实点一下吧'
      : '点「记录」钉住想复习的卡片'

  function closeSheet() {
    setOpenId(null)
  }

  return (
    <main data-seed="af3fdd03" className="relative min-h-dvh overflow-x-hidden bg-cyc font-cue">
      {/* THESIS: Review is a cue sheet of honest queues on the cyclorama, not a cream flashcard list. OWN-WORLD: cyc/cobalt/rose/day; channel tabs; actor-inset thumbs; sentence on the wash. STORY: Scan Forgot or 记录, raise the same practice card, Got it is day. FIRST VIEWPORT: Phone column, cyc wash, 复习, two channels, thumb+sentence rows or rose-band empty cue. FORM: Cyclorama dawn, Operate, committed, seed af3fdd03. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md */}
      <div className="cyc-wash pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-md px-4 pb-28">
        <h1 className="px-4 pt-6 text-center text-sm font-semibold tracking-[0.28em] text-day">
          复习
        </h1>

        <div
          role="tablist"
          aria-label="复习队列"
          className="mt-8 flex gap-2.5"
        >
          <button
            type="button"
            role="tab"
            id="review-tab-forgot"
            aria-selected={tab === 'forgot'}
            aria-controls="review-queue"
            tabIndex={tab === 'forgot' ? 0 : -1}
            className={`${cueTab} ${
              tab === 'forgot'
                ? 'bg-day text-cyc hover:brightness-105'
                : 'border border-day/75 bg-cyc text-day hover:border-day hover:brightness-110'
            }`}
            onClick={() => setTab('forgot')}
          >
            Forgot
          </button>
          <button
            type="button"
            role="tab"
            id="review-tab-pinned"
            aria-selected={tab === 'pinned'}
            aria-controls="review-queue"
            tabIndex={tab === 'pinned' ? 0 : -1}
            className={`${cueTab} ${
              tab === 'pinned'
                ? 'bg-day text-cyc hover:brightness-105'
                : 'border border-day/75 bg-cyc text-day hover:border-day hover:brightness-110'
            }`}
            onClick={() => setTab('pinned')}
          >
            记录
          </button>
        </div>

        <div
          role="tabpanel"
          id="review-queue"
          aria-labelledby={
            tab === 'forgot' ? 'review-tab-forgot' : 'review-tab-pinned'
          }
        >
          {listed.length === 0 ? (
            <div className="mt-16 rounded-2xl bg-rose px-4 py-5">
              <p className="text-center text-lg font-medium leading-snug tracking-[0.01em] text-cyc">
                {emptyCopy}
              </p>
            </div>
          ) : (
            <ul className="mt-10 flex flex-col gap-5">
              {listed.map((card) => (
                <li key={card.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(card.id)}
                    className="flex w-full items-center gap-4 rounded-2xl text-left transition-[filter] duration-200 ease-out hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day"
                  >
                    <CueThumb src={card.image} />
                    <span className="line-clamp-2 text-lg font-medium leading-snug tracking-[0.01em] text-day">
                      {card.sentence}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {openCard ? (
        <dialog
          ref={sheetRef}
          aria-label="练习卡片"
          className="cue-sheet"
          onCancel={(event) => {
            event.preventDefault()
            closeSheet()
          }}
          onClose={closeSheet}
        >
          <button
            type="button"
            aria-label="返回列表"
            onClick={closeSheet}
            className="absolute left-4 top-5 z-40 min-h-11 rounded-2xl px-3 font-cue text-lg font-semibold tracking-[0.08em] text-day transition-[filter] duration-200 ease-out hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day"
          >
            返回
          </button>
          <PracticeCard
            key={openCard.id}
            card={openCard}
            pinned={progress.pinnedIds.includes(openCard.id)}
            expandWordDefault={progress.settings.expandWord}
            expandZhDefault={progress.settings.expandZh}
            onGotIt={() => {
              update((p) => markGotIt(p, openCard.id, todayKey()))
              closeSheet()
            }}
            onForgot={() => {
              update((p) => markForgot(p, openCard.id))
              closeSheet()
            }}
            onTogglePin={() => {
              update((p) => togglePin(p, openCard.id))
            }}
          />
        </dialog>
      ) : null}
    </main>
  )
}
