/**
 * 输入模式（produce）键盘弹出时，长句单行横向循环滚动一圈的时长。
 * 轨道 translateX 0 → -50%，单圈位移 = 文本宽 + 间距（约等于文本宽），
 * 按恒定像素速度推进，保证不同长度句子读速一致。
 */
export function marqueeDurationMs(
  textWidthPx: number,
  speedPxPerSec = 40,
  minMs = 6000,
): number {
  const safeWidth =
    Number.isFinite(textWidthPx) && textWidthPx > 0 ? textWidthPx : 0
  if (safeWidth <= 0) return 0
  return Math.max(minMs, Math.round((safeWidth / speedPxPerSec) * 1000))
}
