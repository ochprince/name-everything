import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { StageShell } from '../../../shared/StageShell'
import { StageHeader } from '../../../shared/StageHeader'
import { ProduceGatePanel } from '../components/ProduceGatePanel'
import {
  anchorForLevel,
  levelById,
  playablesForLevel,
  pointById,
} from '../content/pack'
import { useGrammarProgress, recordProduceCandidate } from '../lib/storage'
import {
  formatProduceJudgeError,
  judgeProduceSentence,
} from '../lib/produceGate'
import {
  loadBestChallengerStreak,
  updateBestChallengerStreak,
} from '../lib/challenger'
import { isAiAllowedWithDetail } from '../../../ai/allowance'
import { getOrCreateDeviceId } from '../../../ai/deviceId'

const HIT_TOTAL = 3

type Phase = 'loading' | 'error' | 'locked' | 'empty' | 'fight' | 'done'

export function ChallengerPage() {
  const progress = useGrammarProgress()
  const [phase, setPhase] = useState<Phase>('loading')
  const [retryKey, setRetryKey] = useState(0)

  // 本局状态
  const [levelId, setLevelId] = useState<string | null>(null)
  const [hit, setHit] = useState(0)
  const [defeated, setDefeated] = useState(0)
  const [best, setBest] = useState(() => loadBestChallengerStreak())
  const [sentences, setSentences] = useState(0)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [result, setResult] = useState<{
    defeated: number
    sentences: number
    isNew: boolean
  } | null>(null)

  const poolRef = useRef<string[]>([])
  const usedRef = useRef<string[]>([])
  const acceptedRef = useRef<string[]>([])

  function pickNextLevel(): string | null {
    const pool = poolRef.current
    if (pool.length === 0) return null
    let candidates = pool.filter((id) => !usedRef.current.includes(id))
    if (candidates.length === 0) {
      usedRef.current = []
      candidates = [...pool]
    }
    const chosen =
      candidates[Math.floor(Math.random() * candidates.length)] ?? null
    if (chosen) usedRef.current.push(chosen)
    return chosen
  }

  function resetRun() {
    usedRef.current = []
    acceptedRef.current = []
    setDefeated(0)
    setSentences(0)
    setDraft('')
    setFeedback(null)
    setNotice(null)
    setHit(0)
  }

  async function startGame() {
    setPhase('loading')
    try {
      const detail = await isAiAllowedWithDetail(getOrCreateDeviceId())
      if (!detail.ok) {
        // 网络失败/超时：能确认"没放行"，但没说清是没开通还是网络问题
        setPhase('error')
        return
      }
      if (detail.allowed !== true) {
        setPhase('locked')
        return
      }
      const pool = progress.passedLevelIds.filter((id) => {
        const level = levelById(id)
        return level !== undefined && playablesForLevel(id).length > 0
      })
      if (pool.length === 0) {
        setPhase('empty')
        return
      }
      poolRef.current = pool
      resetRun()
      const next = pickNextLevel()
      if (!next) throw new Error('empty pool')
      setLevelId(next)
      setPhase('fight')
    } catch {
      setPhase('error')
    }
  }

  useEffect(() => {
    void startGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 进入页面/重试时初始化
  }, [retryKey])

  const level = levelId ? levelById(levelId) : undefined
  const point = level ? pointById(level.grammar_point_id) : undefined

  async function submitSentence() {
    if (phase !== 'fight' || !levelId || busy) return
    const trimmed = draft.trim()
    if (!trimmed) return

    setBusy(true)
    setFeedback(null)
    setNotice(null)

    const level = levelById(levelId)
    const anchor = level ? anchorForLevel(level.id) : undefined
    const playables = level ? playablesForLevel(level.id) : []
    const point = level ? pointById(level.grammar_point_id) : undefined

    try {
      const verdict = await judgeProduceSentence({
        titleZh: point?.title_zh ?? '本关语法',
        bodyZh: point?.body_zh ?? '',
        sampleEns: [
          ...(anchor?.en ? [anchor.en] : []),
          ...playables.map((sentence) => sentence.en),
        ],
        learnerEn: trimmed,
        deviceId: getOrCreateDeviceId(),
        avoidEns: acceptedRef.current,
      })
      if (verdict.pass) {
        recordProduceCandidate({
          levelId,
          en: trimmed,
          zh: verdict.zh,
          deviceId: getOrCreateDeviceId(),
        })
        acceptedRef.current = [...acceptedRef.current, trimmed]
        setSentences((s) => s + 1)
        setDraft('')
        const nextHit = hit + 1
        if (nextHit >= HIT_TOTAL) {
          const title = point?.title_zh ?? '本关语法'
          const nextDefeated = defeated + 1
          setDefeated(nextDefeated)
          setBest((prev) => Math.max(prev, nextDefeated))
          setHit(0)
          const nextId = pickNextLevel()
          if (nextId) {
            setLevelId(nextId)
            setNotice(`击败了「${title}」！继续挑战下一个知识点`)
          }
          return
        }
        setHit(nextHit)
        setNotice(`✓ 合格：${verdict.zh}`)
        return
      }
      setFeedback(verdict.reason)
    } catch (error) {
      setFeedback(formatProduceJudgeError(error))
    } finally {
      setBusy(false)
    }
  }

  function finishRun() {
    if (phase !== 'fight' && phase !== 'done') return
    const outcome = {
      defeated,
      sentences: sentences,
      isNew: updateBestChallengerStreak(defeated),
    }
    setResult(outcome)
    setBest((prev) => Math.max(prev, outcome.defeated))
    setPhase('done')
  }

  function restart() {
    setResult(null)
    resetRun()
    const next = pickNextLevel()
    if (!next) {
      setPhase('empty')
      return
    }
    setLevelId(next)
    setPhase('fight')
  }

  const header = (
    <StageHeader
      backTo={phase === 'fight' ? undefined : '/practice/challenge'}
      onBack={phase === 'fight' ? finishRun : undefined}
      title="挑战者"
      trailing={
        phase === 'fight' ? (
          <p className="inline-flex h-7 items-center rounded-xl bg-day px-2.5 text-sm font-semibold tracking-[0.12em] text-cyc">
            击败 {defeated}
          </p>
        ) : undefined
      }
    />
  )

  if (phase === 'loading' || phase === 'error') {
    return (
      <StageShell header={header}>
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <p className="text-lg tracking-[0.08em] text-day/70">
            {phase === 'loading' ? '加载中…' : '启动失败，请重试'}
          </p>
          {phase === 'error' ? (
            <button
              type="button"
              onClick={() => setRetryKey((k) => k + 1)}
              className="inline-flex min-h-12 min-w-[10rem] items-center justify-center rounded-2xl bg-day px-6 font-cue text-base font-semibold tracking-[0.08em] text-cyc"
            >
              重试
            </button>
          ) : null}
        </div>
      </StageShell>
    )
  }

  if (phase === 'locked') {
    return (
      <StageShell header={header}>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
          <p className="text-balance text-center text-lg font-medium leading-relaxed tracking-[0.02em] text-day/80">
            挑战者需要 AI 判定句子，请先在设备上开通 AI 再来。
          </p>
          <Link
            to="/practice/challenge"
            className="mt-2 inline-flex min-h-12 min-w-[10rem] items-center justify-center rounded-2xl bg-day px-6 font-cue text-base font-semibold tracking-[0.08em] text-cyc"
          >
            返回
          </Link>
        </div>
      </StageShell>
    )
  }

  if (phase === 'empty') {
    return (
      <StageShell header={header}>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
          <p className="text-balance text-center text-lg font-medium leading-relaxed tracking-[0.02em] text-day/80">
            挑战者从已过关的语法知识点里出题——先去语法学习过一关吧。
          </p>
          <Link
            to="/practice/grammar/learn"
            className="mt-2 inline-flex min-h-12 min-w-[10rem] items-center justify-center rounded-2xl bg-day px-6 font-cue text-base font-semibold tracking-[0.08em] text-cyc"
          >
            去学习
          </Link>
        </div>
      </StageShell>
    )
  }

  if (phase === 'done' && result) {
    return (
      <StageShell header={header}>
        <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4">
          <div className="flex flex-col items-center gap-3">
            {result.isNew ? (
              <p className="text-sm font-medium tracking-[0.24em] text-gold">
                新纪录
              </p>
            ) : null}
            <p className="font-cue text-5xl font-semibold tracking-[0.04em] text-day">
              {result.defeated}
              <span className="ml-1 text-xl text-day/60">只</span>
            </p>
            <p className="text-base tracking-[0.1em] text-day/70">
              合格句 {result.sentences} 句
            </p>
            <p className="text-xs tracking-[0.14em] text-day/45">
              历史最高击败 {best} 只
            </p>
          </div>
          <button
            type="button"
            onClick={restart}
            className="inline-flex min-h-14 min-w-[12rem] items-center justify-center rounded-2xl bg-day px-6 font-cue text-lg font-semibold tracking-[0.08em] text-cyc transition-[filter] duration-200 ease-out hover:brightness-105 active:brightness-95"
          >
            再来一局
          </button>
        </div>
      </StageShell>
    )
  }

  if (!levelId || !level || !point) {
    return null
  }

  return (
    <StageShell
      lockViewport
      header={header}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="flex items-center justify-between px-2">
          <p className="text-xs tracking-[0.16em] text-day/45">
            历史最高击败 {best} 只
          </p>
          <button
            type="button"
            onClick={finishRun}
            className="text-xs tracking-[0.1em] text-day/50 underline-offset-4 hover:underline"
          >
            结束本局
          </button>
        </div>
        <ProduceGatePanel
          titleZh={point.title_zh}
          bodyZh={point.body_zh}
          draft={draft}
          onDraftChange={setDraft}
          onSubmit={() => {
            void submitSentence()
          }}
          busy={busy}
          feedback={feedback}
          eyebrow="挑战者"
          promptText="造一句用上这个语法的英文句子"
          bubbles={{ hit, total: HIT_TOTAL }}
          notice={notice}
        />
      </div>
    </StageShell>
  )
}
