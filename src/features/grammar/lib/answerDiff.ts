import { CONTRACTIONS } from './englishAnswerCompare'

export type AnswerMarkKind = 'plain' | 'emph' | 'strike'

export type AnswerMark = {
  kind: AnswerMarkKind
  /** 单词原文（保留大小写/标点，展示用）。 */
  text: string
}

/**
 * 输入模式失败页的「差异标注」：
 * 以正确句为模板逐词对齐用户输入（归一化口径与 englishAnswersMatch 一致——
 * 小写、缩写展开、去标点），输出渲染标记序列：
 * - plain  = 用户写对了的单词（原样）
 * - emph   = 正确句里用户没写对的词（漏写 / 写错 / 拼错 → 只标正确词，不展示用户错词）
 * - strike = 用户多写的词（正确句没有对应位置，只能展示用户原文划线删除）
 * 一个间隙里同时有正确词和用户词（替换）时只标蓝正确词、隐藏用户词——不区分
 * 「写错」还是「漏写」，差异点统一靠正确词标注，删除线只出现在「纯多写」间隙。
 */
export function annotateAnswer(userText: string, correctText: string): AnswerMark[] {
  const cTokens = tokenize(correctText)
  const uTokens = tokenize(userText)

  const { exps: ec, byDisp: cExpByDisp } = expandTokens(cTokens)
  const { exps: eu, byDisp: uExpByDisp } = expandTokens(uTokens)

  // LCS（按归一化子 token 逐项相等），回溯标记匹配对
  const n = ec.length
  const m = eu.length
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        ec[i].text === eu[j].text
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const ecMatched = new Array<boolean>(n).fill(false)
  const euMatched = new Array<boolean>(m).fill(false)
  const uIdxOfMatch: number[] = new Array<number>(n).fill(-1)
  {
    let i = 0
    let j = 0
    while (i < n && j < m) {
      if (ec[i].text === eu[j].text && dp[i][j] === dp[i + 1][j + 1] + 1) {
        ecMatched[i] = true
        euMatched[j] = true
        uIdxOfMatch[i] = j
        i++
        j++
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        i++
      } else {
        j++
      }
    }
  }

  // 显示级 token：全部子 token 匹配才算匹配（无子 token 视为无内容，算匹配）
  const cMatched = cTokens.map(
    (_, ci) => (cExpByDisp[ci] ?? []).every((ei) => ecMatched[ei]),
  )

  // 锚点 = 匹配的正确词，记录其配对到的用户词区间 [uMin, uMax]
  const anchors: Array<{ c: number; uMin: number; uMax: number }> = []
  cMatched.forEach((matched, ci) => {
    if (!matched) return
    let uMin = Infinity
    let uMax = -1
    for (const ei of cExpByDisp[ci] ?? []) {
      const uj = uIdxOfMatch[ei]
      if (uj < 0) continue
      uMin = Math.min(uMin, eu[uj].disp)
      uMax = Math.max(uMax, eu[uj].disp)
    }
    anchors.push({ c: ci, uMin: uMin === Infinity ? -1 : uMin, uMax })
  })

  const marks: AnswerMark[] = []
  const pushPlain = (ci: number) => marks.push({ kind: 'plain', text: cTokens[ci] })
  // 间隙 [cFrom, cTo) × [uFrom, uTo)：有正确词 → 全部标蓝（用户词隐藏）；只有用户词 → 划线
  const emitGap = (cFrom: number, cTo: number, uFrom: number, uTo: number) => {
    const hasCorrect = cFrom < cTo
    if (hasCorrect) {
      for (let ci = cFrom; ci < cTo; ci++) {
        if (cMatched[ci]) continue
        marks.push({ kind: 'emph', text: cTokens[ci] })
      }
      return
    }
    for (let uj = uFrom; uj < uTo; uj++) {
      const fullyMatched = (uExpByDisp[uj] ?? []).every((ej) => euMatched[ej])
      if (fullyMatched) continue
      marks.push({ kind: 'strike', text: uTokens[uj] })
    }
  }

  let prevU = -1
  let prevC = 0
  for (const anchor of anchors) {
    emitGap(prevC, anchor.c, prevU + 1, anchor.uMin)
    pushPlain(anchor.c)
    prevC = anchor.c + 1
    prevU = Math.max(prevU, anchor.uMax)
  }
  emitGap(prevC, cTokens.length, prevU + 1, uTokens.length)

  return marks
}

function tokenize(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean)
}

type ExpToken = { disp: number; text: string }

type Expansion = {
  exps: ExpToken[]
  /** 显示 token 下标 → 它在 exps 里的子 token 下标集合。 */
  byDisp: number[][]
}

/** 显示 token → 归一化子 token 平铺；子 token 带所属显示 token 下标。 */
function expandTokens(tokens: string[]): Expansion {
  const exps: ExpToken[] = []
  const byDisp: number[][] = tokens.map(() => [])
  tokens.forEach((token, disp) => {
    for (const sub of normToken(token)) {
      byDisp[disp].push(exps.length)
      exps.push({ disp, text: sub })
    }
  })
  return { exps, byDisp }
}

/** 单 token 归一化：小写、弯引号转直、缩写展开、去标点（与 englishAnswersMatch 同源）。 */
function normToken(token: string): string[] {
  let text = token.toLowerCase().replace(/[\u2019\u2018]/g, "'")
  for (const [pattern, replacement] of CONTRACTIONS) {
    text = text.replace(pattern, replacement)
  }
  text = text.replace(/[^a-z0-9\s]/g, ' ')
  return text.split(/\s+/).filter(Boolean)
}
