import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { PracticeCard } from '../features/pictures/components/PracticeCard'
import { fetchPictureWordsByWords } from '../features/pictures/content/fetchPictureWords'
import { useProgress } from '../features/pictures/hooks/useProgress'
import { markForgot, markReviewGotIt, clearReviewUnseen, todayKey } from '../features/pictures/lib/storage'
import { highlightParts } from '../features/pictures/lib/highlightWord'
import type { Card } from '../types/card'
import { StageHeader, StickyStageChrome } from '../shared/StageHeader'

import { assetUrl } from '../shared/assets'

const FALLBACK_IMAGE = assetUrl('images/cards/fallback.svg')

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

function SentenceHighlight({
  sentence,
  word,
}: {
  sentence: string
  word: string
}) {
  return (
    <span className="line-clamp-2 text-lg font-medium leading-snug tracking-[0.01em] text-day">
      {highlightParts(sentence, word).map((part, index) =>
        part.highlight ? (
          <mark
            key={`${part.text}-${index}`}
            className="bg-transparent font-semibold text-rose"
          >
            {part.text}
          </mark>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        ),
      )}
    </span>
  )
}

export function ReviewPage() {
  const { progress, update } = useProgress()
  const [openId, setOpenId] = useState<string | null>(null)
  const [listed, setListed] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)

  const sheetRef = useRef<HTMLDialogElement>(null)
  const openCard = openId
    ? listed.find((card) => card.id === openId) ?? null
    : null

  useLayoutEffect(() => {
    update(clearReviewUnseen)
  }, [update])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const cards = await fetchPictureWordsByWords(progress.forgotIds)
        if (cancelled) return
        const byId = new Map(cards.map((c) => [c.id, c]))
        setListed(
          progress.forgotIds.flatMap((id) => {
            const card = byId.get(id)
            return card ? [card] : []
          }),
        )
      } catch {
        if (!cancelled) setListed([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [progress.forgotIds])

  useEffect(() => {
    const sheet = sheetRef.current
    if (!openCard || !sheet || sheet.open) return
    if (typeof sheet.showModal === 'function') {
      sheet.showModal()
    } else {
      sheet.setAttribute('open', '')
    }
    sheet.focus()
  }, [openCard])

  function closeSheet() {
    setOpenId(null)
  }

  return (
    <main data-seed="af3fdd03" className="relative z-0 h-dvh overflow-hidden bg-cyc font-cue">
      {/* THESIS: Review is a cue sheet of the Forgot queue on the cyclorama. OWN-WORLD: cyc/cobalt/rose/day; actor-inset thumbs; sentence on the wash. STORY: Scan Forgot, raise the same practice card, Got it is day. FIRST VIEWPORT: Phone column, cyc wash, 复习, thumb+sentence rows or rose-band empty cue. FORM: Cyclorama dawn, Operate, committed, seed af3fdd03. */}
      <div className="cyc-wash pointer-events-none absolute inset-0" />

      <div className="relative h-full overflow-x-clip overflow-y-auto">
        <div className="mx-auto max-w-md px-4 pb-28">
        <StickyStageChrome>
          <StageHeader title="复习" />
        </StickyStageChrome>
        <p className="mt-3 text-center text-lg font-semibold tracking-[0.12em] text-rose">
          Forgot
          {progress.forgotIds.length > 0 ? (
            <span aria-hidden="true" className="ml-2 text-base tracking-[0.06em] text-day/80">
              {progress.forgotIds.length}
            </span>
          ) : null}
        </p>

        <div id="review-queue" className="pb-40">
          {loading ? (
            <div className="mt-16 rounded-2xl border border-gold/50 bg-cyc/80 px-4 py-5">
              <p className="text-center text-lg font-medium leading-snug tracking-[0.01em] text-day/85">
                加载中…
              </p>
            </div>
          ) : listed.length === 0 ? (
            <div className="mt-16 rounded-2xl border border-gold/50 bg-cyc/80 px-4 py-5">
              <p className="text-center text-lg font-medium leading-snug tracking-[0.01em] text-day/85">
                暂时没有 Forgot，去练习里诚实点一下吧
              </p>
            </div>
          ) : (
            <ul className="mt-10 flex flex-col gap-5">
              {listed.map((card) => (
                <li key={card.id}>
                  <button
                    type="button"
                    aria-label={card.sentence}
                    onClick={() => setOpenId(card.id)}
                    className="flex w-full items-center gap-4 rounded-2xl text-left transition-[filter] duration-200 ease-out hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day"
                  >
                    <CueThumb src={card.image} />
                    <SentenceHighlight sentence={card.sentence} word={card.word} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
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
          <PracticeCard
            key={openCard.id}
            card={openCard}
            chrome="sheet"
            onBack={closeSheet}
            hintLangDefault={progress.settings.hintLang}
            autoSpeak={progress.settings.autoSpeak}
            thinkHoldMs={progress.settings.thinkHoldMs}
            onGotIt={() => {
              update((p) => markReviewGotIt(p, openCard.id, todayKey()))
              // 直接切到下一个待复习词，不返回列表；没有下一个才关闭
              const index = progress.forgotIds.indexOf(openCard.id)
              const nextId =
                index >= 0 ? progress.forgotIds[index + 1] : undefined
              setOpenId(nextId ?? null)
            }}
            onForgot={() => {
              update((p) => markForgot(p, openCard.id, todayKey()))
              closeSheet()
            }}
          />
        </dialog>
      ) : null}
    </main>
  )
}
