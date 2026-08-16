import { useEffect, useRef, useState } from 'react'
import { PracticeCard } from '../components/PracticeCard'
import { loadCards } from '../content/loadCards'
import { useProgress } from '../hooks/useProgress'
import { markForgot, markGotIt, todayKey } from '../lib/storage'
import type { Card } from '../types/card'

const FALLBACK_IMAGE = '/images/cards/fallback.svg'

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
      loading="lazy"
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
  const [openId, setOpenId] = useState<string | null>(null)

  const sheetRef = useRef<HTMLDialogElement>(null)
  const listed = cardsForIds(progress.forgotIds)
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
    // Keep initial focus on the dialog shell so 「返回」 does not look selected.
    sheet.focus()
  }, [openCard])

  function closeSheet() {
    setOpenId(null)
  }

  return (
    <main data-seed="af3fdd03" className="relative z-0 min-h-dvh overflow-x-clip bg-cyc font-cue">
      {/* THESIS: Review is a cue sheet of the Forgot queue on the cyclorama. OWN-WORLD: cyc/cobalt/rose/day; actor-inset thumbs; sentence on the wash. STORY: Scan Forgot, raise the same practice card, Got it is day. FIRST VIEWPORT: Phone column, cyc wash, 复习, thumb+sentence rows or rose-band empty cue. FORM: Cyclorama dawn, Operate, committed, seed af3fdd03. */}
      <div className="cyc-wash pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-md px-4 pb-28">
        <h1 className="pt-[max(1.5rem,env(safe-area-inset-top))] text-center text-sm font-semibold tracking-[0.22em] text-day">
          复习
        </h1>
        <p className="mt-3 text-center text-lg font-semibold tracking-[0.12em] text-rose">
          Forgot
          {progress.forgotIds.length > 0 ? (
            <span aria-hidden="true" className="ml-2 text-base tracking-[0.06em] text-day/80">
              {progress.forgotIds.length}
            </span>
          ) : null}
        </p>

        <div id="review-queue">
          {listed.length === 0 ? (
            <div className="mt-16 rounded-2xl bg-rose px-4 py-5">
              <p className="text-center text-lg font-medium leading-snug tracking-[0.01em] text-cyc">
                暂时没有 Forgot，去练习里诚实点一下吧
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
          tabIndex={-1}
          aria-label="练习卡片"
          className="cue-sheet outline-none"
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
            onMouseDown={(event) => {
              // Avoid sticky :focus ring after tap on iOS / mouse.
              event.preventDefault()
            }}
            className="absolute left-4 top-[max(1.25rem,env(safe-area-inset-top))] z-40 min-h-11 rounded-2xl border border-day/40 px-3 font-cue text-lg font-semibold tracking-[0.08em] text-day outline-none transition-[filter,border-color] duration-200 ease-out hover:border-day/70 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day [-webkit-tap-highlight-color:transparent]"
          >
            返回
          </button>
          <PracticeCard
            key={openCard.id}
            card={openCard}
            chrome="sheet"
            hintLangDefault={progress.settings.hintLang}
            autoSpeak={progress.settings.autoSpeak}
            forgetHoldMs={progress.settings.forgetHoldMs}
            onGotIt={() => {
              update((p) => markGotIt(p, openCard.id, todayKey()))
              closeSheet()
            }}
            onForgot={() => {
              update((p) => markForgot(p, openCard.id))
              closeSheet()
            }}
          />
        </dialog>
      ) : null}
    </main>
  )
}
