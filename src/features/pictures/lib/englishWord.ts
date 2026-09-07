/**
 * 词库外的"是不是真英文单词"核验。
 * 主判据：离线英文词表（懒加载，public/words/wordlist.txt）。
 * 词表尚未就绪或加载失败（离线）时，退回启发式规则兜底。
 */

let wordSet: Set<string> | null = null
let fetchStarted = false
let fetchDone = false

const LIST_URL = `${import.meta.env.BASE_URL}words/wordlist.txt`
const GZ_URL = `${LIST_URL}.gz`

export function loadEnglishWords(): Promise<void> {
  if (fetchStarted) return Promise.resolve()
  fetchStarted = true
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 12_000)
  const tryPlain = (): Promise<string> =>
    fetch(LIST_URL, { signal: controller.signal }).then((res) => {
      if (!res.ok) throw new Error(`wordlist http ${res.status}`)
      return res.text()
    })
  const load = (): Promise<string> => {
    if (typeof (window as { DecompressionStream?: unknown }).DecompressionStream !== 'function') {
      return tryPlain()
    }
    return fetch(GZ_URL, { signal: controller.signal }).then((res) => {
      if (!res.ok) throw new Error('gz miss')
      const stream = res.body?.pipeThrough(
        new DecompressionStream('gzip'),
      )
      if (!stream) throw new Error('no stream')
      return new Response(stream).text()
    })
  }
  return load()
    .catch(() => tryPlain())
    .then((text) => {
      const set = new Set<string>()
      for (const line of text.split('\n')) {
        const w = line.trim().toLowerCase()
        if (w.length >= 2) set.add(w)
      }
      wordSet = set
    })
    .catch(() => {
      // 离线/失败：保留 null，走启发式兜底
    })
    .finally(() => {
      window.clearTimeout(timer)
      fetchDone = true
    })
}

export function isEnglishWordLoaded(): boolean {
  return wordSet !== null || fetchDone
}

/** 词表就绪用词表；否则启发式。永不抛错。 */
export function isEnglishWord(word: string): boolean {
  if (wordSet !== null) return wordSet.has(word)
  return looksLikeEnglish(word)
}

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y'])
const ASCII = /^[a-z]{2,16}$/

/**
 * 无词表时的规则兜底：只放过"明显像英语拼写"的串。
 * 拒无元音、超长辅音串、单字母重复等乱拼特征（词表在线时不用它）。
 */
export function looksLikeEnglish(word: string): boolean {
  if (!ASCII.test(word)) return false
  if (new Set(word).size < 2) return false
  let maxRun = 0
  let run = 0
  let hasVowel = false
  for (const ch of word) {
    if (VOWELS.has(ch)) {
      hasVowel = true
      run = 0
    } else {
      run += 1
      if (run > maxRun) maxRun = run
    }
  }
  if (!hasVowel) return false
  // strengths/sixths 等真词尾辅音串可达 5，再长基本是乱拼
  if (maxRun > 5) return false
  return true
}
