/** 输入模式 placeholder 轮播间隔。 */
export const PRODUCE_HINT_ROTATE_MS = 5000

/**
 * 输入模式 placeholder 轮播提示文案。
 * 共两条：中文放第一（键盘弹出时顶部中文隐藏，placeholder 先给出任务本身）；
 * 第二条「小提示」把例句（标杆句首词）、关卡名、原首词提示三合一——
 * 首词优先取例句（anchor），缺失时回退当前句；关卡名以括号附在末尾。
 */
export function buildProduceHints(input: {
  zh: string
  en: string
  levelTitle?: string
  anchorEn?: string
}): string[] {
  const source = (input.anchorEn ?? input.en).trim()
  const firstWord = source.split(/\s+/)[0] ?? ''
  const hint = firstWord
    ? `小提示：${firstWord} …${input.levelTitle ? `（${input.levelTitle}）` : ''}`
    : ''
  return [`中文：${input.zh}`, hint].filter((item): item is string => Boolean(item))
}
