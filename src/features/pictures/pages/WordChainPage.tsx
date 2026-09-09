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
  countChainTrophy,
  loadBestChain,
  loadChainHistory,
  loadChainTrophyCount,
  pickStartWord,
  recordChainRun,
  updateBestChain,
  type WordChainBest,
  type WordChainRun,
} from '../lib/wordChain'
import { ensureChainZh, readCachedZh } from '../lib/chainZh'
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

function ChainWordRow({ row }: { row: ChainRow }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-day/15 bg-cyc/40 px-3 py-2">
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
  const [trophyCount, setTrophyCount] = useState<number>(() =>
    loadChainTrophyCount(),
  )
  const [result, setResult] = useState<WordChainBest | null>(null)
  const [isNewBest, setIsNewBest] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const usedRef = useRef<Set<string>>(new Set())
  const catalogRef = useRef<Set<string>>(new Set())
  const settledRef = useRef(false)
  const startingRef = useRef(false)
  const lastStartRef = useRef<string | null>(null)
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
      const learnedSet = new Set(learned)
      // 起点池：已学词优先；已学太少时补词库高频词，避免每次都从同一个词开始。
      // （补进来的词未学过也会带图卡中文展示，可顺着学）
      let startPool: string[]
      if (learned.length >= 4) {
        startPool = learned
      } else if (learned.length > 0) {
        const extra = allPriorityWords.filter(
          (w) => catalogRef.current.has(w) && !learnedSet.has(w),
        )
        startPool = [...learned, ...extra.slice(0, 6 - learned.length)]
      } else {
        startPool = allPriorityWords.filter((w) => catalogRef.current.has(w))
      }
      // 随机池取词频前 10；并避免上一局的起点词连续出现
      const pickTop = Math.min(10, Math.max(3, startPool.length))
      let word: string | null = null
      for (let attempt = 0; attempt < 8 && startPool.length > 1; attempt += 1) {
        const candidate = pickStartWord(startPool, zipfOf, pickTop)
        if (candidate && candidate !== lastStartRef.current) {
          word = candidate
          break
        }
      }
      word = word ?? pickStartWord(startPool, zipfOf, pickTop)
      if (!word) throw new Error('no start word')
      lastStartRef.current = word
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
    // 本局结算结果（中间大字只展示这一局，历史最高走右上角 chip）
    const roundResult: WordChainBest = { length, score: total }
    const outcome = updateBestChain(roundResult)
    recordChainRun({ ...roundResult, at: Date.now() })
    setHistory(loadChainHistory())
    setTrophyCount(countChainTrophy(total))
    setBest(outcome.best)
    setIsNewBest(outcome.isNew)
    setResult(roundResult)
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
    } else {
      // 词库外真词：先读本地缓存（此前查过/离线可用），没有再在线查一次并缓存
      zh = readCachedZh(check.word)
      void ensureChainZh(check.word).then((resolved) => {
        if (!resolved) return
        setChain((prev) =>
          prev.map((row) =>
            row.word === check.word && !row.zh ? { ...row, zh: resolved } : row,
          ),
        )
      })
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
        phase === 'ready' ? (
          <button
            type="button"
            onClick={() => setShowRules(true)}
            aria-label="查看玩法说明"
            className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-day/25 bg-cyc/60 px-2 font-cue text-sm font-semibold tracking-[0.08em] text-day/70 active:brightness-95"
          >
            ?
          </button>
        ) : best ? (
          <p className="inline-flex h-7 items-center rounded-xl bg-day px-2.5 text-sm font-semibold tracking-[0.12em] text-cyc">
            纪录 {best.score} 分
          </p>
        ) : undefined
      }
    />
  )

  if (phase === 'ready') {
    return (
      <StageShell header={header} lockViewport>
        <div className="flex min-h-0 flex-1 flex-col gap-3 px-1 pt-3">
          {/* 第一行：奖杯累计 + 纪录（整体左右居中） */}
          <div className="flex flex-none flex-col items-center gap-2 rounded-2xl border border-day/15 bg-cyc/40 px-4 py-4">
            <img
              src={trophyPassed}
              alt=""
              className={`h-12 w-12 flex-none ${
                trophyCount > 0 ? '' : 'opacity-30'
              }`}
            />
            <p className="flex items-baseline gap-2">
              <span className="font-cue text-4xl font-semibold tracking-[0.04em] text-day">
                {trophyCount}
              </span>
              <span className="text-sm font-medium tracking-[0.16em] text-gold">
                座奖杯
              </span>
            </p>
            {best ? (
              <p className="text-xs tracking-[0.1em] text-day/50">
                历史最高 {best.score} 分 · {best.length} 词
              </p>
            ) : (
              <p className="text-xs tracking-[0.1em] text-day/45">
                单局 {CHAIN_TROPHY_SCORE} 分获得一座，可重复累积
              </p>
            )}
          </div>

          {/* 第二行：历史对局列表（可滚动） */}
          <div className="flex min-h-0 flex-1 flex-col gap-1.5">
            <p className="px-1 text-[10px] font-medium tracking-[0.24em] text-day/50">
              历史对局
            </p>
            {history.length === 0 ? (
              <div className="flex min-h-0 flex-1 place-items-center rounded-2xl border border-dashed border-day/20 px-4 py-8">
                <p className="w-full text-center text-sm text-day/45">
                  完成一局后，这里会留下纪录
                </p>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <div className="flex flex-col divide-y divide-day/10 rounded-2xl border border-day/15 bg-cyc/40">
                  {history.map((run, index) => (
                    <div
                      key={`${run.at}-${index}`}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <p className="font-cue text-xl font-semibold tracking-[0.04em] text-day">
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
              </div>
            )}
          </div>

          {/* 第三行：开始游戏 */}
          <button
            type="button"
            onClick={() => void startGame()}
            className="mt-1 inline-flex min-h-14 w-full flex-none items-center justify-center rounded-2xl bg-day px-6 font-cue text-lg font-semibold tracking-[0.1em] text-cyc transition-[filter] duration-200 ease-out hover:brightness-105 active:brightness-95"
          >
            开始游戏
          </button>
        </div>

        {showRules ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="玩法说明"
            className="fixed inset-0 z-50 flex items-center justify-center bg-cyc/85 px-6"
          >
            <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-day/20 bg-cyc px-5 py-5">
              <p className="text-lg font-semibold tracking-[0.1em] text-day">
                玩法
              </p>
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
                <li className="flex gap-2">
                  <span className="text-gold">●</span>
                  单局 {CHAIN_TROPHY_SCORE} 分获得一座奖杯，可重复累积
                </li>
              </ul>
              <button
                type="button"
                onClick={() => setShowRules(false)}
                className="mt-1 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-day font-cue text-base font-semibold tracking-[0.1em] text-cyc"
              >
                知道了
              </button>
            </div>
          </div>
        ) : null}
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
        {keyboardOpen && chain.length > 0 ? (
          <div className="flex-none">
            <ChainWordRow row={chain[chain.length - 1]} />
          </div>
        ) : null}
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
              <ChainWordRow key={`${row.word}-${index}`} row={row} />
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
            <div className="flex flex-col gap-1.5">
              {/* 最近几个已接词 + 目标字母（可横向滑，贴键盘不被顶走） */}
              <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-0.5 overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {chain.slice(-4).map((row, index) => (
                  <span
                    key={`${row.word}-${index}`}
                    className={`flex-none rounded-lg px-2 py-1 text-sm tracking-[0.02em] ${
                      index === chain.slice(-4).length - 1
                        ? 'bg-day/10 text-day'
                        : 'bg-day/[0.06] text-day/55'
                    }`}
                  >
                    {row.word}
                  </span>
                ))}
                {chain.length > 0 ? (
                  <span aria-hidden="true" className="flex-none text-day/40">
                    →
                  </span>
                ) : null}
                <span className="flex-none rounded-lg bg-day px-2 py-1 font-cue text-base font-bold tracking-[0.06em] text-cyc">
                  {lastLetter.toUpperCase()}
                </span>
              </div>
              <p className="text-right text-[11px] tracking-[0.14em] text-day/45">
                已接 {chain.length} 词 · {score} 分
              </p>
            </div>
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
