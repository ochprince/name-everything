/**
 * 词语接龙：首尾字母接龙的校验、计分与纪录。
 * 纯函数 + localStorage 纪录读写，页面负责计时与展示。
 */

export const CHAIN_TIMEOUT_MS = 10_000

/** 词库词（命中图片卡）每词得分。 */
export const CHAIN_CATALOG_BONUS = 1

export type WordChainBest = { length: number; score: number }

const BEST_KEY = 'name-everything/wordChain/best'

export function normalizeWord(input: string): string {
  return input.trim().toLowerCase()
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
  const word = normalizeWord(raw)
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
