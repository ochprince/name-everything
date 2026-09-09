/**
 * 词语接龙：词库外真词的中文释义——有道在线查词 + localStorage 缓存。
 * 词库（图卡）词的中文来自本地词库，不走这里；本模块只服务词库外的词。
 * 语义：接到一个词库外的新词时自动查一次，结果存本地；之后同词直接读缓存，
 * 离线也能显示。查不到（有道无该词）或断网时返回 null——接龙本身不受影响。
 */

const CACHE_KEY = 'name-everything/wordChain/zh'
/** 缓存条数上限；超出按插入序淘汰最旧（对象数字键无序，这里全是字母键，插入序稳定）。 */
const MAX_ENTRIES = 2000
const LOOKUP_TIMEOUT_MS = 6000

/** 有道词典搜索建议接口（JSONP，无需 key；大陆直连快）。 */
const YZ_SUGGEST_URL = 'https://dict.youdao.com/suggest?num=1&doctype=json'

/**
 * 有道 suggest 返回的 explain 常把同一词的多条义项用「；」拼成一大段
 * （如 hello 会带三句\"喂，你好\"变体）。卡片位只取第一个义项，保持精简。
 */
function trimExplain(explain: string): string {
  const first = explain.split('；')[0]?.trim() ?? ''
  return first
}

/** 从有道 suggest JSONP 载荷里抽中文释义（纯函数，便于单测）。 */
export function extractZhSuggest(payload: unknown): string | null {
  try {
    const root = payload as {
      result?: { code?: number }
      data?: { entries?: { entry?: string; explain?: string }[] }
    }
    if (root?.result?.code !== 200) return null
    const explain = root.data?.entries?.[0]?.explain
    if (!explain) return null
    return trimExplain(explain)
  } catch {
    return null
  }
}

function readRecord(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return {}
    }
    const record: Record<string, string> = {}
    for (const [word, zh] of Object.entries(parsed)) {
      if (typeof word === 'string' && typeof zh === 'string' && zh) {
        record[word] = zh
      }
    }
    return record
  } catch {
    return {}
  }
}

/** 同步读缓存（接龙入链时先用它做即时展示）。 */
export function readCachedZh(word: string): string | null {
  return readRecord()[word] ?? null
}

function writeRecord(record: Record<string, string>): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(record))
  } catch {
    // 存储不可用/超限时静默：释义只是锦上添花
  }
}

/** 写入一条缓存；超上限时按插入序淘汰最旧（字母键对象保持插入序）。 */
export function cacheZh(word: string, zh: string): void {
  const record = readRecord()
  delete record[word] // 已存在则视为新插入（移到末尾）
  record[word] = zh
  const keys = Object.keys(record)
  if (keys.length > MAX_ENTRIES) {
    for (const key of keys.slice(0, keys.length - MAX_ENTRIES)) {
      delete record[key]
    }
  }
  writeRecord(record)
}

/**
 * JSONP 查词。返回 { ok, zh }：
 * - ok=true  网络与接口正常；zh 为释义或 null（有道无该词）
 * - ok=false 网络失败/超时（可稍后重试，不记\"查无此词\"）
 */
function lookupZhSuggest(
  word: string,
): Promise<{ ok: boolean; zh: string | null }> {
  return new Promise((resolve) => {
    const cbName = `__yzZh_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`
    const script = document.createElement('script')
    let settled = false

    const finish = (ok: boolean, zh: string | null) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      delete (window as unknown as Record<string, unknown>)[cbName]
      script.remove()
      resolve({ ok, zh })
    }

    const timer = window.setTimeout(() => finish(false, null), LOOKUP_TIMEOUT_MS)
    ;(window as unknown as Record<string, unknown>)[cbName] = (payload: unknown) => {
      const zh = extractZhSuggest(payload)
      // 载荷结构正常但无该词（zh === null）也算接口正常
      finish(true, zh)
    }
    script.src = `${YZ_SUGGEST_URL}&q=${encodeURIComponent(
      word,
    )}&callback=${cbName}`
    script.onerror = () => finish(false, null)
    document.head.appendChild(script)
  })
}

/** 本会话内确认\"有道无此词\"的词，不再重复发请求（网络失败不记入）。 */
const knownMissing = new Set<string>()
const inFlight = new Map<string, Promise<string | null>>()

/**
 * 确保某词库外词的中文释义可用：缓存命中直接返回；否则在线查一次并写缓存。
 * 返回释义或 null（查无此词/断网）。并发去重：同词只发一个请求。
 */
export async function ensureChainZh(word: string): Promise<string | null> {
  const cached = readCachedZh(word)
  if (cached) return cached
  if (knownMissing.has(word)) return null

  const pending = inFlight.get(word)
  if (pending) return pending

  const task = (async () => {
    const res = await lookupZhSuggest(word)
    if (!res.ok) return null // 网络失败：不缓存、不记缺失，之后可重试
    if (!res.zh) {
      knownMissing.add(word)
      return null
    }
    cacheZh(word, res.zh)
    return res.zh
  })().finally(() => {
    inFlight.delete(word)
  })
  inFlight.set(word, task)
  return task
}
