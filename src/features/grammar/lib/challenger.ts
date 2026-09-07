/**
 * 挑战者模式纪录：单局击败的知识点数（最高连胜）。
 */

const BEST_KEY = 'name-everything/challenger/bestStreak'

export function loadBestChallengerStreak(): number {
  try {
    const raw = localStorage.getItem(BEST_KEY)
    if (!raw) return 0
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
  } catch {
    return 0
  }
}

/** 结算时更新纪录；返回本局是否刷新。 */
export function updateBestChallengerStreak(defeated: number): boolean {
  const isNew = defeated > loadBestChallengerStreak()
  if (isNew && defeated > 0) {
    try {
      localStorage.setItem(BEST_KEY, String(defeated))
    } catch {
      // storage 不可用时静默
    }
  }
  return isNew
}
