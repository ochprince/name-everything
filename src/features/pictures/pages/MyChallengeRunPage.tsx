import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { FallingPlayPage } from '../../grammar/pages/FallingPlayPage'
import { StageShell } from '../../../shared/StageShell'
import { StageHeader } from '../../../shared/StageHeader'
import { fetchPictureWordsByWords } from '../content/fetchPictureWords'
import { loadChallengeWords } from '../lib/challengeCollection'
import { buildVocabPlayables, type VocabPlayable } from '../lib/vocabChallenge'

export function MyChallengeRunPage() {
  const location = useLocation()
  const [playables, setPlayables] = useState<VocabPlayable[] | null>(null)
  const [empty, setEmpty] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setPlayables(null)
    setEmpty(false)
    setError(null)

    const words = loadChallengeWords()
    if (words.length === 0) {
      setEmpty(true)
      return () => {
        cancelled = true
      }
    }

    void fetchPictureWordsByWords(words)
      .then((cards) => {
        if (cancelled) return
        const byWord = new Map(cards.map((card) => [card.word, card]))
        const ordered = words
          .map((word) => byWord.get(word))
          .filter((card): card is NonNullable<typeof card> => Boolean(card))
        const next = buildVocabPlayables(ordered)
        if (next.length === 0) {
          setEmpty(true)
          return
        }
        setPlayables(next)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : '加载失败')
      })

    return () => {
      cancelled = true
    }
  }, [location.key])

  if (empty) {
    return <Navigate to="/practice/pictures/play" replace />
  }

  if (error) {
    return (
      <StageShell header={<StageHeader backTo="/practice/pictures/play" title="我的挑战" />}>
        <p className="flex flex-1 items-center justify-center text-center text-lg text-day/80">
          {error}
        </p>
      </StageShell>
    )
  }

  if (!playables) {
    return (
      <StageShell header={<StageHeader backTo="/practice/pictures/play" title="我的挑战" />}>
        <p className="flex flex-1 items-center justify-center text-lg tracking-[0.08em] text-day/70">
          准备题目…
        </p>
      </StageShell>
    )
  }

  return <FallingPlayPage mode="vocab" vocabPlayables={playables} />
}
