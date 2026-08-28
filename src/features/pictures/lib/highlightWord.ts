export type HighlightPart = { text: string; highlight: boolean }

/**
 * 常见不规则动词变形表（词库例句中高频出现）。
 * base -> 过去式 / 过去分词 / 现在分词 等常见形态。
 */
const IRREGULAR_FORMS: Record<string, string[]> = {
  be: ['am', 'is', 'are', 'was', 'were', 'been', 'being'],
  become: ['becomes', 'became', 'becoming', 'become'],
  begin: ['begins', 'began', 'begun', 'beginning'],
  break: ['breaks', 'broke', 'broken', 'breaking'],
  bring: ['brings', 'brought', 'bringing'],
  build: ['builds', 'built', 'building'],
  buy: ['buys', 'bought', 'buying'],
  catch: ['catches', 'caught', 'catching'],
  choose: ['chooses', 'chose', 'chosen', 'choosing'],
  come: ['comes', 'came', 'coming'],
  cut: ['cuts', 'cutting'],
  deal: ['deals', 'dealt', 'dealing'],
  do: ['does', 'did', 'done', 'doing'],
  draw: ['draws', 'drew', 'drawn', 'drawing'],
  drink: ['drinks', 'drank', 'drunk', 'drinking'],
  drive: ['drives', 'drove', 'driven', 'driving'],
  eat: ['eats', 'ate', 'eaten', 'eating'],
  fall: ['falls', 'fell', 'fallen', 'falling'],
  feed: ['feeds', 'fed', 'feeding'],
  feel: ['feels', 'felt', 'feeling'],
  fight: ['fights', 'fought', 'fighting'],
  find: ['finds', 'found', 'finding'],
  fly: ['flies', 'flew', 'flown', 'flying'],
  forget: ['forgets', 'forgot', 'forgotten', 'forgetting'],
  get: ['gets', 'got', 'gotten', 'getting'],
  give: ['gives', 'gave', 'given', 'giving'],
  go: ['goes', 'went', 'gone', 'going'],
  grow: ['grows', 'grew', 'grown', 'growing'],
  hang: ['hangs', 'hung', 'hanging'],
  have: ['has', 'had', 'having'],
  hear: ['hears', 'heard', 'hearing'],
  hide: ['hides', 'hid', 'hidden', 'hiding'],
  hit: ['hits', 'hitting'],
  hold: ['holds', 'held', 'holding'],
  hurt: ['hurts', 'hurting'],
  keep: ['keeps', 'kept', 'keeping'],
  know: ['knows', 'knew', 'known', 'knowing'],
  lay: ['lays', 'laid', 'laying'],
  lead: ['leads', 'led', 'leading'],
  learn: ['learns', 'learned', 'learnt', 'learning'],
  leave: ['leaves', 'left', 'leaving'],
  lend: ['lends', 'lent', 'lending'],
  let: ['lets', 'letting'],
  lie: ['lies', 'lay', 'lain', 'lying'],
  lose: ['loses', 'lost', 'losing'],
  make: ['makes', 'made', 'making'],
  mean: ['means', 'meant', 'meaning'],
  meet: ['meets', 'met', 'meeting'],
  pay: ['pays', 'paid', 'paying'],
  put: ['puts', 'putting'],
  read: ['reads', 'reading'],
  ride: ['rides', 'rode', 'ridden', 'riding'],
  ring: ['rings', 'rang', 'rung', 'ringing'],
  rise: ['rises', 'rose', 'risen', 'rising'],
  run: ['runs', 'ran', 'running'],
  say: ['says', 'said', 'saying'],
  see: ['sees', 'saw', 'seen', 'seeing'],
  sell: ['sells', 'sold', 'selling'],
  send: ['sends', 'sent', 'sending'],
  set: ['sets', 'setting'],
  shake: ['shakes', 'shook', 'shaken', 'shaking'],
  shoot: ['shoots', 'shot', 'shooting'],
  show: ['shows', 'showed', 'shown', 'showing'],
  sing: ['sings', 'sang', 'sung', 'singing'],
  sit: ['sits', 'sat', 'sitting'],
  sleep: ['sleeps', 'slept', 'sleeping'],
  speak: ['speaks', 'spoke', 'spoken', 'speaking'],
  spend: ['spends', 'spent', 'spending'],
  stand: ['stands', 'stood', 'standing'],
  steal: ['steals', 'stole', 'stolen', 'stealing'],
  swim: ['swims', 'swam', 'swum', 'swimming'],
  take: ['takes', 'took', 'taken', 'taking'],
  teach: ['teaches', 'taught', 'teaching'],
  tell: ['tells', 'told', 'telling'],
  think: ['thinks', 'thought', 'thinking'],
  throw: ['throws', 'threw', 'thrown', 'throwing'],
  understand: ['understands', 'understood', 'understanding'],
  wake: ['wakes', 'woke', 'woken', 'waking'],
  wear: ['wears', 'wore', 'worn', 'wearing'],
  win: ['wins', 'won', 'winning'],
  write: ['writes', 'wrote', 'written', 'writing'],
}

/** 生成规则变形候选：-ing / -ed / -d / -es / -s / 双写辅音。 */
function regularForms(word: string): string[] {
  const w = word.toLowerCase()
  const forms = new Set<string>([w])
  const add = (s: string) => {
    if (s) forms.add(s)
  }

  // -s / -es
  add(w + 's')
  add(w + 'es')
  // 辅音+y → ies
  if (/[^aeiou]y$/.test(w)) add(w.slice(0, -1) + 'ies')

  // -ing / -ed：同时生成「双写」与「不双写」两种候选，匹配时按长度降序
  // 自然选中最长的正确形态（borrowed 优先于 borrowwed，两者都在候选里；
  // stop→stopped 只在双写候选里，避免生成 stopped 漏掉）。
  if (w.endsWith('e')) {
    add(w.slice(0, -1) + 'ing')
    add(w + 'd')
  } else {
    add(w + 'ing')
    add(w + 'ed')
    add(w + w.slice(-1) + 'ing')
    add(w + w.slice(-1) + 'ed')
  }

  return [...forms]
}

/** 生成所有候选形态（规则 + 不规则 + 原形）。 */
export function wordForms(word: string): string[] {
  const trimmed = word.trim().toLowerCase()
  if (!trimmed) return []
  const forms = new Set<string>([trimmed, ...regularForms(trimmed)])
  const irregular = IRREGULAR_FORMS[trimmed]
  if (irregular) for (const f of irregular) forms.add(f)
  return [...forms]
}

export function highlightParts(sentence: string, word: string): HighlightPart[] {
  const forms = wordForms(word)
  if (forms.length === 0) return [{ text: sentence, highlight: false }]
  // 按长度降序匹配，优先匹配更长的变形（如 explaining 优于 explain）
  const escaped = forms
    .sort((a, b) => b.length - a.length)
    .map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')
  const match = sentence.match(new RegExp(`\\b(${escaped})\\b`, 'i'))
  if (!match || match.index === undefined) {
    return [{ text: sentence, highlight: false }]
  }
  const start = match.index
  const end = start + match[0].length
  const parts: HighlightPart[] = []
  if (start > 0) parts.push({ text: sentence.slice(0, start), highlight: false })
  parts.push({ text: sentence.slice(start, end), highlight: true })
  if (end < sentence.length) {
    parts.push({ text: sentence.slice(end), highlight: false })
  }
  return parts
}
