import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { StageShell } from '../../../shared/StageShell'
import { StageHeader } from '../../../shared/StageHeader'
import { WORD_PRIORITY } from '../content/wordPriority'
import {
  ensurePictureWordsReady,
  getPictureWordsByWords,
  hasPictureWord,
} from '../lib/pictureWordsCatalog'
import { useProgress } from '../hooks/useProgress'
import {
  CHAIN_TIMEOUT_MS,
  CHAIN_TROPHY_SCORE,
  chainReasonCopy,
  checkChainWord,
  loadBestChain,
  loadChainHistory,
  pickStartWord,
  recordChainRun,
  updateBestChain,
  type WordChainBest,
  type WordChainRun,
} from '../lib/wordChain'
import trophyPassed from '../../grammar/assets/trophy-passed.svg'
import { isEnglishWord, loadEnglishWords } from '../lib/englishWord'
import { useKeyboardOverlapPx, usePinLayoutOnKeyboardDismiss, usePinViewportWhileEditable } from '../../../shared/useAppViewportHeight'
import { KEYBOARD_OVERLAP_LOCK_PX } from '../../../shared/appViewport'

const LETTERS_ONLY = /^[a-z]{2,}$/

/** 链上一节：词库词带图卡与中文，词库外真词只有单词本身。 */
type ChainRow = {
  word: string
  image: string | null
  zh: string | null
  /** 词库词（稀有）：×2 分。 */
  bonus: boolean
}

function zipfOf(word: string): number {
  return WORD_PRIORITY[word]?.[1] ?? 0
}

function lastLetterOf(word: string): string {
  return word[word.length - 1]
}

function fmtRunTime(at: number): string {
  const d = new Date(at)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`
}

function ChainSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-day/15 bg-cyc/40 px-3 py-2 text-center">
      <p className="text-[10px] font-medium tracking-[0.2em] text-day/50">
        {label}
      </p>
      <p className="font-cue text-lg font-semibold tracking-[0.06em] text-day">
        {value}
      </p>
    </div>
  )
}

export function WordChainPage() {
  const { progress } = useProgress()
  const [phase, setPhase] = useState<'ready' | 'loading' | 'error' | 'play' | 'done'>(
    'ready',
  )
  const [chain, setChain] = useState<ChainRow[]>([])
  const [lastLetter, setLastLetter] = useState('')
  const [score, setScore] = useState(0)
  const [draft, setDraft] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [remainingMs, setRemainingMs] = useState(CHAIN_TIMEOUT_MS)
  const [best, setBest] = useState<WordChainBest | null>(() => loadBestChain())
  const [history, setHistory] = useState<WordChainRun[]>(() =>
    loadChainHistory(),
  )
  const [result, setResult] = useState<WordChainBest | null>(null)
  const [isNewBest, setIsNewBest] = useState(false)
  const usedRef = useRef<Set<string>>(new Set())
  const catalogRef = useRef<Set<string>>(new Set())
  const settledRef = useRef(false)
  const startingRef = useRef(false)
  const listEndRef = useRef<HTMLDivElement>(null)
  const keyboardOverlapPx = useKeyboardOverlapPx()
  const keyboardOpen = keyboardOverlapPx > KEYBOARD_OVERLAP_LOCK_PX
  usePinLayoutOnKeyboardDismiss()
  usePinViewportWhileEditable(phase === 'play')

  const allPriorityWords = useMemo(
    () => Object.keys(WORD_PRIORITY).filter((w) => LETTERS_ONLY.test(w)),
    [],
  )

  const startGame = useCallback(async () => {
    if (startingRef.current) return
    startingRef.current = true
    setPhase('loading')
    setResult(null)
    setIsNewBest(false)
    setMessage(null)
    usedRef.current = new Set()
    try {
      await ensurePictureWordsReady()
      // 词库全集 = 词频表 ∩ 实际词库（词频表可能比 DB 略大）
      catalogRef.current = new Set(
        allPriorityWords.filter((w) => hasPictureWord(w)),
      )
      if (catalogRef.current.size === 0) throw new Error('empty catalog')
      const learned = [
        ...new Set([...progress.strongIds, ...progress.warmIds]),
      ].filter((w) => catalogRef.current.has(w))
      const candidates =
        learned.length > 0
          ? learned
          : allPriorityWords.filter((w) => catalogRef.current.has(w))
      const word = pickStartWord(candidates, zipfOf, 3)
      if (!word) throw new Error('no start word')
      const card = getPictureWordsByWords([word])[0]
      if (!card) throw new Error('start card missing')
      usedRef.current.add(word)
      setChain([
        {
          word: card.word,
          image: card.image ?? null,
          zh: card.zh ?? null,
          bonus: false,
        },
      ])
      setLastLetter(lastLetterOf(word))
      setScore(0)
      setRemainingMs(CHAIN_TIMEOUT_MS)
      settledRef.current = false
      setPhase('play')
    } catch {
      setPhase('error')
    } finally {
      startingRef.current = false
    }
  }, [allPriorityWords, progress.strongIds, progress.warmIds])

  useEffect(() => {
    if (phase !== 'ready') return
    // 进场页预取英文词表（词库外真词判定用；离线则退回启发式）
    void loadEnglishWords()
  }, [phase])

  // 每个新词重置倒计时（chain 变化即新词入链）
  useEffect(() => {
    if (phase !== 'play') return
    setRemainingMs(CHAIN_TIMEOUT_MS)
  }, [phase, chain.length])

  // 倒计时递减；归零结算本局
  useEffect(() => {
    if (phase !== 'play') return
    const timer = window.setInterval(() => {
      setRemainingMs((ms) => {
        const next = ms - 100
        if (next <= 0) {
          window.clearInterval(timer)
          finishRound()
          return 0
        }
        return next
      })
    }, 100)
    return () => window.clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- finishRound 经 ref 语义稳定
  }, [phase, chain.length])

  function finishRound() {
    if (settledRef.current || phase !== 'play') return
    settledRef.current = true
    const length = chain.length
    const total = score
    const outcome = updateBestChain({ length, score: total })
    recordChainRun({ length, score: total, at: Date.now() })
    setHistory(loadChainHistory())
    setBest(outcome.best)
    setIsNewBest(outcome.isNew)
    setResult(outcome.best)
    setPhase('done')
  }

  function submit() {
    if (phase !== 'play') return
    const trimmed = draft.trim()
    if (!trimmed) return
    const check = checkChainWord(
      trimmed,
      lastLetter,
      usedRef.current,
      { catalog: catalogRef.current, isEnglish: isEnglishWord },
    )
    if (!check.ok) {
      setMessage(chainReasonCopy(check.reason))
      return
    }
    let image: string | null = null
    let zh: string | null = null
    if (check.inCatalog) {
      const card = getPictureWordsByWords([check.word])[0]
      image = card?.image ?? null
      zh = card?.zh ?? null
    }
    setDraft('')
    setMessage(null)
    usedRef.current.add(check.word)
    setChain((prev) => [
      ...prev,
      { word: check.word, image, zh, bonus: check.inCatalog },
    ])
    setScore((s) => s + check.score)
    setLastLetter(lastLetterOf(check.word))
  }

  // 新词入链后滚到链尾
  useEffect(() => {
    if (phase !== 'play') return
    listEndRef.current?.scrollIntoView({ block: 'nearest' })
  }, [chain.length, phase])

  const timePct = Math.max(0, Math.min(1, remainingMs / CHAIN_TIMEOUT_MS))
  const urgent = remainingMs <= 3000

  const header = (
    <StageHeader
      backTo="/practice/challenge"
      title="词语接龙"
      trailing={
        best ? (
          <p className="inline-flex h-7 items-center rounded-xl bg-day px-2.5 text-sm font-semibold tracking-[0.12em] text-cyc">
            纪录 {best.score} 分
          </p>
        ) : undefined
      }
    />
  )

  if (phase === 'ready') {
    return (
      <StageShell header={header}>
        <div className="flex flex-col gap-4 px-1 pt-4">
          <div className="flex flex-col gap-2 rounded-2xl border border-day/15 bg-cyc/40 px-4 py-4">
            <p className="text-[10px] font-medium tracking-[0.24em] text-day/50">
              历史最高
            </p>
            {best ? (
              <>
                <p className="font-cue text-4xl font-semibold tracking-[0.04em] text-day">
                  {best.score}
                  <span className="ml-1.5 text-base font-medium text-day/60">
                    分
                  </span>
                  <span className="ml-3 text-lg font-medium text-day/60">
                    {best.length} 词
                  </span>
                </p>
                {best.score >= CHAIN_TROPHY_SCORE ? (
                  <p className="flex items-center gap-1.5 text-sm font-medium tracking-[0.18em] text-gold">
                    <img src={trophyPassed} alt="" className="h-5 w-5" />
                    奖杯线 {CHAIN_TROPHY_SCORE} 分已达成
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-base text-day/70">还没有纪录，来一局吧</p>
            )}
          </div>

          <div className="rounded-2xl border border-day/15 bg-cyc/40 px-4 py-3">
            <ul className="flex flex-col gap-2.5 text-sm leading-relaxed tracking-[0.02em] text-day/80">
              <li className="flex gap-2">
                <span className="text-gold">●</span>
                下一个词以上一词结尾字母开头
              </li>
              <li className="flex gap-2">
                <span className="text-gold">●</span>
                词库里的词 ×2，词库外的真单词也能接
              </li>
              <li className="flex gap-2">
                <span className="text-gold">●</span>
                每词 10 秒倒计时，超时即结算
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <p className="px-1 text-[10px] font-medium tracking-[0.24em] text-day/50">
              历史对局
            </p>
            {history.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-day/20 px-4 py-5 text-center text-sm text-day/45">
                完成一局后，这里会留下纪录
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-day/10 rounded-2xl border border-day/15 bg-cyc/40">
                {history.slice(0, 6).map((run, index) => (
                  <div
                    key={`${run.at}-${index}`}
                    className="flex items-center gap-3 px-4 py-2.5"
                  >
                    <p className="font-cue text-lg font-semibold tracking-[0.04em] text-day">
                      {run.score}
                      <span className="ml-1 text-sm text-day/55">分</span>
                    </p>
                    <p className="text-sm text-day/60">{run.length} 词</p>
                    {run.score >= CHAIN_TROPHY_SCORE ? (
                      <img
                        src={trophyPassed}
                        alt="奖杯"
                        className="h-4 w-4 flex-none"
                      />
                    ) : null}
                    <p className="ml-auto flex-none text-xs tracking-[0.08em] text-day/40">
                      {fmtRunTime(run.at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => void startGame()}
            className="mt-1 inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-day px-6 font-cue text-lg font-semibold tracking-[0.1em] text-cyc transition-[filter] duration-200 ease-out hover:brightness-105 active:brightness-95"
          >
            开始游戏
          </button>
        </div>
      </StageShell>
    )
  }

  if (phase === 'loading' || phase === 'error') {
    return (
      <StageShell header={header}>
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <p className="text-lg tracking-[0.08em] text-day/70">
            {phase === 'loading' ? '加载词库中…' : '词库加载失败'}
          </p>
          {phase === 'error' ? (
            <button
              type="button"
              onClick={() => void startGame()}
              className="inline-flex min-h-12 min-w-[10rem] items-center justify-center rounded-2xl bg-day px-6 font-cue text-base font-semibold tracking-[0.08em] text-cyc"
            >
              重试
            </button>
          ) : null}
        </div>
      </StageShell>
    )
  }

  if (phase === 'done' && result) {
    return (
      <StageShell header={header}>
        <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4">
          <div className="flex flex-col items-center gap-3">
            {isNewBest ? (
              <p className="text-sm font-medium tracking-[0.24em] text-gold">
                新纪录
              </p>
            ) : null}
            {result.score >= CHAIN_TROPHY_SCORE ? (
              <p className="flex items-center gap-1.5 text-sm font-medium tracking-[0.18em] text-gold">
                <img src={trophyPassed} alt="" className="h-5 w-5" />
                奖杯线 {CHAIN_TROPHY_SCORE} 分达成
              </p>
            ) : null}
            <p className="font-cue text-5xl font-semibold tracking-[0.04em] text-day">
              {result.length}
              <span className="ml-1 text-xl text-day/60">词</span>
            </p>
            <p className="text-base tracking-[0.1em] text-day/70">
              得分 {result.score}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void startGame()}
            className="inline-flex min-h-14 min-w-[12rem] items-center justify-center rounded-2xl bg-day px-6 font-cue text-lg font-semibold tracking-[0.08em] text-cyc transition-[filter] duration-200 ease-out hover:brightness-105 active:brightness-95"
          >
            再来一局
          </button>
        </div>
      </StageShell>
    )
  }

  return (
    <StageShell header={header} lockViewport>
      <div
        className="flex min-h-0 flex-1 flex-col gap-3 px-1 pt-3"
        style={keyboardOpen ? { paddingBottom: keyboardOverlapPx } : undefined}
      >
        {keyboardOpen ? null : (
          <div className="flex items-center gap-3">
            <ChainSummary label="当前链" value={`${chain.length} 词`} />
            <ChainSummary label="得分" value={`${score}`} />
          </div>
        )}
        {keyboardOpen ? null : (
          <div className="flex min-h-14 flex-none items-center justify-center gap-1.5 rounded-2xl bg-day px-3">
            <p className="max-w-24 truncate text-sm font-medium tracking-[0.02em] text-cyc/70">
              {chain[chain.length - 1]?.word}
            </p>
            <p aria-hidden="true" className="flex-none text-sm text-cyc/45">
              →
            </p>
            <p className="font-cue text-2xl font-bold tracking-[0.08em] text-cyc">
              {lastLetter.toUpperCase()}
            </p>
            <p className="whitespace-nowrap text-sm tracking-[0.12em] text-cyc/60">
              开头的词
            </p>
          </div>
        )}

        {keyboardOpen ? null : (
          <p className="px-1 text-[11px] tracking-[0.18em] text-day/45">
            词库词 ×2 · 词库外的真单词也能接
          </p>
        )}

        {keyboardOpen ? null : (
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain">
            {chain.map((row, index) => (
              <div
                key={`${row.word}-${index}`}
                className="flex items-center gap-2 rounded-2xl border border-day/15 bg-cyc/40 px-3 py-2"
              >
                {row.image ? (
                  <img
                    src={row.image}
                    alt=""
                    loading="lazy"
                    className="h-11 w-11 flex-none rounded-xl object-cover"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-day/10 font-cue text-lg font-bold tracking-[0.08em] text-day/60"
                  >
                    {row.word[0].toUpperCase()}
                  </div>
                )}
                <p className="min-w-0 flex-1 truncate text-lg font-semibold tracking-[0.02em] text-day">
                  {row.word}
                </p>
                {row.bonus ? (
                  <span className="flex-none rounded-full border border-gold/40 bg-gold/15 px-2 py-0.5 text-[11px] font-semibold tracking-[0.14em] text-gold">
                    ×2
                  </span>
                ) : null}
                {row.zh ? (
                  <p className="max-w-[45%] flex-none truncate text-right text-sm text-day/55">
                    {row.zh}
                  </p>
                ) : null}
              </div>
            ))}
            <div ref={listEndRef} />
          </div>
        )}

        <form
          className={`flex flex-col gap-2 rounded-2xl border border-day/20 bg-cyc/40 px-3 pb-3 pt-3 ${
            keyboardOpen ? 'mt-auto' : ''
          }`}
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          {keyboardOpen ? (
            <p className="flex items-center justify-between gap-2 text-sm tracking-[0.06em] text-day/75">
              <span className="min-w-0 truncate">
                上一词{' '}
                <b className="text-day">{chain[chain.length - 1]?.word}</b> →{' '}
                <b className="text-day">{lastLetter.toUpperCase()}</b>
              </span>
              <span className="flex-none text-day/45">
                {chain.length} 词 · {score} 分
              </span>
            </p>
          ) : null}
          <div className="h-1.5 overflow-hidden rounded-full bg-day/10">
            <div
              className={`h-full rounded-full transition-none ${
                urgent ? 'bg-rose' : 'bg-day/80'
              }`}
              style={{ width: `${timePct * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-label="输入下一个词"
              placeholder="输入以该字母开头的单词"
              className="min-h-12 min-w-0 flex-1 rounded-2xl border border-day/75 bg-cyc px-3 text-lg font-semibold tracking-[0.02em] text-day placeholder:text-day/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-day"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              onMouseDown={(event) => event.preventDefault()}
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-2xl bg-day px-5 font-cue text-base font-semibold tracking-[0.08em] text-cyc transition-[filter] duration-200 ease-out hover:brightness-105 active:brightness-95 disabled:pointer-events-none disabled:opacity-40"
            >
              接上
            </button>
          </div>
          <div className="flex items-center justify-between">
            {message ? (
              <p role="status" className="text-sm tracking-[0.02em] text-rose">
                {message}
              </p>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={finishRound}
              className="text-sm tracking-[0.1em] text-day/50 underline-offset-4 hover:underline"
            >
              结束本局
            </button>
          </div>
        </form>
      </div>
    </StageShell>
  )
}
