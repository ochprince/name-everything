/** 输入模式 placeholder 轮播间隔。 */
export const PRODUCE_HINT_ROTATE_MS = 5000

/**
 * 输入模式 placeholder 轮播提示文案。
 * 共两条：中文放第一（键盘弹出时顶部中文隐藏，placeholder 先给出任务本身）；
 * 第二条「小提示」合并三样信息：当前句（例句）首词、关卡名、标杆句全文——
 * 第一行「小提示：{首词} …（{关卡名}）」，换行后第二行「例句：{标杆句}」
 * （文案用「例句」，不写「标杆句」；无标杆句/关卡名时对应部分自动省略）。
 */
export function buildProduceHints(input: {
  zh: string
  en: string
  levelTitle?: string
  anchorEn?: string
}): string[] {
  const firstWord = input.en.trim().split(/\s+/)[0] ?? ''
  const hintParts: string[] = []
  if (firstWord) {
    hintParts.push(
      `小提示：${firstWord} …${input.levelTitle ? `（${input.levelTitle}）` : ''}`,
    )
  }
  if (input.anchorEn) {
    hintParts.push(`例句：${input.anchorEn}`)
  }
  return [`中文：${input.zh}`, hintParts.join('\n')].filter(
    (item): item is string => Boolean(item),
  )
}
