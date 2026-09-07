/**
 * 词语接龙：首尾字母接龙的校验、计分与纪录。
 * 纯函数 + localStorage 纪录读写，页面负责计时与展示。
 */

export const CHAIN_TIMEOUT_MS = 10_000

/** 结尾字母双倍分的稀有字母。 */
export const CHAIN_RARE_ENDINGS = ['x', 'z', 'q', 'j'] as const

export type WordChainBest = { length: number; score: number }

const BEST_KEY = 'name-everything/wordChain/best'

export function normalizeWord(input: string): string {
  return input.trim().toLowerCase()
}

export function rareEndingBonus(letter: string): boolean {
  return (CHAIN_RARE_ENDINGS as readonly string[]).includes(letter)
}

export type ChainCheck =
  | { ok: true; word: string; score: number }
  | { ok: false; reason: 'letter' | 'unknown' | 'repeat' }

/**
 * 校验一个接龙词。
 * @param raw 玩家输入（未清洗）
 * @param lastLetter 上词结尾字母（小写）；开局时来自起始词
 * @param used 本局已用词（小写）
 * @param known 词库全集（小写）
 */
export function checkChainWord(
  raw: string,
  lastLetter: string,
  used: Set<string>,
  known: Set<string>,
): ChainCheck {
  const word = normalizeWord(raw)
  if (!word) return { ok: false, reason: 'letter' }
  const target = lastLetter.toLowerCase()
  if (word[0] !== target) return { ok: false, reason: 'letter' }
  if (!known.has(word)) return { ok: false, reason: 'unknown' }
  if (used.has(word)) return { ok: false, reason: 'repeat' }
  const score = 1 + (rareEndingBonus(word[word.length - 1]) ? 1 : 0)
  return { ok: true, word, score }
}

export function chainReasonCopy(reason: 'letter' | 'unknown' | 'repeat'): string {
  if (reason === 'letter') return '首字母要接上一个词的结尾'
  if (reason === 'unknown') return '这个词不在词库里'
  return '这个词本局已经用过了'
}

/** 从候选里按词频选起始词：取词频最高的前 N 个里随机一个。 */
export function pickStartWord(
  candidates: string[],
  zipfOf: (word: string) => number,
  top = 3,
  rnd: () => number = Math.random,
): string | null {
  if (candidates.length === 0) return null
  const sorted = [...candidates].sort(
    (a, b) => zipfOf(b) - zipfOf(a) || a.localeCompare(b),
  )
  const pool = sorted.slice(0, Math.min(top, sorted.length))
  return pool[Math.floor(rnd() * pool.length)] ?? null
}

export function loadBestChain(): WordChainBest | null {
  try {
    const raw = localStorage.getItem(BEST_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as WordChainBest
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !Number.isFinite(parsed.length) ||
      !Number.isFinite(parsed.score)
    ) {
      return null
    }
    return { length: parsed.length, score: parsed.score }
  } catch {
    return null
  }
}

/** 结算时更新纪录；返回是否刷新（严格高于原纪录，score 优先）。 */
export function updateBestChain(
  result: WordChainBest,
): { best: WordChainBest; isNew: boolean } {
  const prev = loadBestChain()
  const isNew =
    prev === null ||
    result.score > prev.score ||
    (result.score === prev.score && result.length > prev.length)
  if (isNew) {
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify(result))
    } catch {
      // storage 不可用时静默：纪录只是锦上添花
    }
  }
  return { best: result, isNew }
}
