/**
 * 词语接龙：首尾字母接龙的校验、计分与纪录。
 * 纯函数 + localStorage 纪录读写，页面负责计时与展示。
 */

export const CHAIN_TIMEOUT_MS = 10_000

/** 词库词（命中图片卡）每词得分。 */
export const CHAIN_CATALOG_BONUS = 1

/** 历史最高分达到该值即得奖杯（挑战门展示）。 */
export const CHAIN_TROPHY_SCORE = 30

export type WordChainBest = { length: number; score: number }

/** 历史对局（完整结算一次记一条，新局在前）。 */
export type WordChainRun = WordChainBest & { at: number }

const BEST_KEY = 'name-everything/wordChain/best'
const HISTORY_KEY = 'name-everything/wordChain/history'
const HISTORY_MAX = 20

export function normalizeWord(input: string): string {
  return input.trim().toLowerCase()
}

/** 与例句判定一致的口径：去标点/特殊符号/空格、统一小写（语音输入常带句号）。 */
const WORD_CLEAN = /[^a-z]/g
function cleanChainInput(raw: string): string {
  return normalizeWord(raw).replace(WORD_CLEAN, '')
}

export type ChainCheck =
  | { ok: true; word: string; score: number; inCatalog: boolean }
  | { ok: false; reason: 'letter' | 'notword' | 'repeat' }

export type ChainChecker = {
  /** 词库全集（小写）——命中即"稀有"（×2）。 */
  catalog: ReadonlySet<string>
  /** 词库外的真单词核验（离线词表 + 启发式）。 */
  isEnglish: (word: string) => boolean
}

/**
 * 校验一个接龙词。
 * 规则：① 首字母接上词尾；② 词库词或"真英文单词"；③ 本局未用过。
 * 词库词计 2 分（稀有），词库外真词计 1 分。
 * @param raw 玩家输入（未清洗）
 * @param lastLetter 上词结尾字母（小写）；开局时来自起始词
 * @param used 本局已用词（小写）
 * @param checker catalog + isEnglish
 */
export function checkChainWord(
  raw: string,
  lastLetter: string,
  used: Set<string>,
  checker: ChainChecker,
): ChainCheck {
  const word = cleanChainInput(raw)
  const target = lastLetter.toLowerCase()
  if (!/^[a-z]{2,16}$/.test(word)) return { ok: false, reason: 'notword' }
  if (word[0] !== target) return { ok: false, reason: 'letter' }
  if (used.has(word)) return { ok: false, reason: 'repeat' }
  const inCatalog = checker.catalog.has(word)
  if (!inCatalog && !checker.isEnglish(word)) {
    return { ok: false, reason: 'notword' }
  }
  const score = 1 + (inCatalog ? CHAIN_CATALOG_BONUS : 0)
  return { ok: true, word, score, inCatalog }
}

export function chainReasonCopy(reason: 'letter' | 'notword' | 'repeat'): string {
  if (reason === 'letter') return '首字母要接上一个词的结尾'
  if (reason === 'notword') return '这不像一个英文单词'
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

/** 结算时更新纪录；返回 { 实际最高纪录, 是否刷新 }（score 优先，并列比链长）。 */
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
  // 未刷新时返回仍存的最高纪录，而不是本次结果——否则页面会把当前分当纪录展示
  const best = isNew ? result : (prev ?? result)
  return { best, isNew }
}

/** 历史对局列表（新局在前，最多 HISTORY_MAX 条）。 */
export function loadChainHistory(): WordChainRun[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as WordChainRun[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (run) =>
        run !== null &&
        typeof run === 'object' &&
        Number.isFinite(run.length) &&
        Number.isFinite(run.score) &&
        Number.isFinite(run.at),
    )
  } catch {
    return []
  }
}

/** 记一条完整对局到历史（新局在前）。 */
export function recordChainRun(run: WordChainRun): void {
  try {
    const next = [run, ...loadChainHistory()].slice(0, HISTORY_MAX)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  } catch {
    // storage 不可用时静默
  }
}
