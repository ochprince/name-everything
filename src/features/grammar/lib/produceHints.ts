/** 输入模式 placeholder 轮播间隔。 */
export const PRODUCE_HINT_ROTATE_MS = 3000

/**
 * 输入模式 placeholder 轮播提示文案。
 * 每条带描述前缀（关卡：/ 小提示：/ 例句：/ 中文：）；中文例句放最后——
 * 弹键盘前顶部已展示过中文，轮播里殿后即可，避免重复打头。
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
    input.levelTitle ? `关卡：${input.levelTitle}` : '',
    firstWord ? `小提示：${firstWord} …` : '',
    input.anchorEn ? `例句：${input.anchorEn}` : '',
    `中文：${input.zh}`,
  ].filter((item): item is string => Boolean(item))
}
