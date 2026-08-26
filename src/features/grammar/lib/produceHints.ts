/** 输入模式 placeholder 轮播间隔。 */
export const PRODUCE_HINT_ROTATE_MS = 3000

/**
 * 输入模式 placeholder 轮播提示文案（第一条 = 当前句中文例句）。
 * 顺序：中文例句 / 所在 level 名称 / 英文例句首词+… / 所在 level 标杆句（英文）。
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
    input.zh,
    input.levelTitle,
    firstWord ? `${firstWord} …` : '',
    input.anchorEn,
  ].filter((item): item is string => Boolean(item))
}
