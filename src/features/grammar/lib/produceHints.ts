/** 输入模式 placeholder 轮播间隔。 */
export const PRODUCE_HINT_ROTATE_MS = 5000

/**
 * 输入模式 placeholder 轮播提示文案。
 * 每条带描述前缀（中文：/ 关卡：/ 小提示：/ 例句：）；中文例句放第一——
 * 键盘弹出时顶部中文隐藏，placeholder 先给出任务本身。
 * 缺失项（如无标杆句）自动跳过。
 */
export function buildProduceHints(input: {
  zh: string
  en: string
  levelTitle?: string
  anchorEn?: string
}): string[] {
  const firstWord = input.en.trim().split(/\s+/)[0] ?? ''
  return [
    `中文：${input.zh}`,
    input.levelTitle ? `关卡：${input.levelTitle}` : '',
    firstWord ? `小提示：${firstWord} …` : '',
    input.anchorEn ? `例句：${input.anchorEn}` : '',
  ].filter((item): item is string => Boolean(item))
}
