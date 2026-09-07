import {
  AiJobError,
  completeText as defaultCompleteText,
} from '../../../ai/client'
import type { CompleteTextOptions, CompleteTextResult } from '../../../ai/client'

export type ProduceGateMode = 'level' | 'arcade' | 'vocab'

export type ProduceJudgeVerdict = {
  pass: boolean
  zh: string
  reason: string
  /** 合格时 AI 的一句话点评（为什么正确）；不合格时为空。 */
  comment: string
}

const FALLBACK_FAIL_REASON = '再试试，要用对本关语法，并写成正确的英文句子。'
const PASS_MISSING_ZH_REASON = '判定结果不完整，请再提交一次。'
const PARSE_FAIL_REASON = '暂时无法理解判定结果，请再提交一次。'

export function shouldEnterProduceGate(input: {
  mode: ProduceGateMode
  aiAllowed: boolean
  score: number
  threshold: number
}): boolean {
  if (input.mode !== 'level') return false
  if (!input.aiAllowed) return false
  if (!(input.score >= input.threshold && input.threshold > 0)) return false
  return true
}

function extractJsonObject(text: string): unknown | null {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = (fenced?.[1] ?? trimmed).trim()
  try {
    return JSON.parse(candidate) as unknown
  } catch {
    const start = candidate.indexOf('{')
    const end = candidate.lastIndexOf('}')
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1)) as unknown
      } catch {
        return null
      }
    }
    return null
  }
}

export function parseProduceJudgeResponse(text: string): ProduceJudgeVerdict {
  const raw = extractJsonObject(text)
  if (!raw || typeof raw !== 'object') {
    return { pass: false, zh: '', reason: PARSE_FAIL_REASON, comment: '' }
  }
  const obj = raw as Record<string, unknown>
  const pass = obj.pass === true
  const zh = typeof obj.zh === 'string' ? obj.zh.trim() : ''
  const reason =
    typeof obj.reason === 'string' && obj.reason.trim()
      ? obj.reason.trim()
      : FALLBACK_FAIL_REASON
  const comment = typeof obj.comment === 'string' ? obj.comment.trim() : ''

  if (pass && !zh) {
    return { pass: false, zh: '', reason: PASS_MISSING_ZH_REASON, comment: '' }
  }
  if (pass) {
    return { pass: true, zh, reason: '', comment }
  }
  return { pass: false, zh: '', reason, comment: '' }
}

export function buildProduceJudgePrompt(input: {
  titleZh: string
  bodyZh: string
  sampleEns: string[]
  learnerEn: string
}): { instructions: string; input: string } {
  const samples =
    input.sampleEns.length > 0
      ? input.sampleEns.map((s, i) => `${i + 1}. ${s}`).join('\n')
      : '(none)'

  const instructions = [
    '你是英语语法老师。判断学习者造的英文句子是否合格。',
    '合格条件：',
    '1) 正确运用本关语法知识点；',
    '2) 英文语法结构正确、自然；',
    '3) 不得与下列课包例句雷同（允许改写场景，但不可抄袭）。',
    '',
    `知识点标题：${input.titleZh}`,
    `知识点说明：${input.bodyZh}`,
    '课包例句（仅供你对照，不要当作标准答案要求复述）：',
    samples,
    '',
    '只输出一个 JSON 对象，不要其它文字：',
    '{"pass":true|false,"zh":"合格时给中文译文，否则空字符串","reason":"不合格时用一两句中文说明原因，否则空字符串","comment":"合格时用一句话中文点评，说明为什么正确（例如点出用对了哪个语法结构），否则空字符串"}',
  ].join('\n')

  return { instructions, input: input.learnerEn.trim() }
}

export type JudgeProduceSentenceInput = {
  titleZh: string
  bodyZh: string
  sampleEns: string[]
  learnerEn: string
  deviceId: string
  timeoutMs?: number
}

type CompleteTextFn = (options: CompleteTextOptions) => Promise<CompleteTextResult>

export async function judgeProduceSentence(
  input: JudgeProduceSentenceInput,
  completeText: CompleteTextFn = defaultCompleteText,
): Promise<ProduceJudgeVerdict> {
  const built = buildProduceJudgePrompt(input)
  const result = await completeText({
    input: built.input,
    instructions: built.instructions,
    deviceId: input.deviceId,
    timeoutMs: input.timeoutMs,
    temperature: 0.2,
    maxOutputTokens: 320,
  })
  return parseProduceJudgeResponse(result.text)
}

/** User-facing copy when the judge request itself fails. */
export function formatProduceJudgeError(error: unknown): string {
  if (error instanceof AiJobError) {
    if (error.code === 'quota_users') return '当前设备未开通 AI，无法判定。'
    if (error.code === 'timeout') return '判定超时，请再提交一次。'
    if (error.code === 'quota_daily' || error.code === 'rate_limited') {
      return 'AI 暂时繁忙，请稍后再试。'
    }
  }
  if (error instanceof Error && /VITE_SUPABASE|not configured/i.test(error.message)) {
    return 'AI 服务未配置，请稍后再试。'
  }
  return '判定失败，请再提交一次。'
}
