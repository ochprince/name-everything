// 夸克浏览器识别（iOS / 安卓均带 Quark 标识）。
//
// 已知局限（用户实测确认）：夸克 iOS 切换「PC UA」模式后 UA 被完全伪装成
// Windows 老版 Chrome（Chrome/53.0.2785.116），无任何夸克特征——该模式下
// 识别不到，黑屏 bug 依然存在但无法通过 UA 拦截（黑屏测试两模式均复现）。
// 当前策略：识别 iPhone UA 模式（默认），PC UA 模式属主动切换的小众场景，
// 维持现状不更糟。
export function isQuark(): boolean {
  return typeof navigator !== 'undefined' && /Quark/i.test(navigator.userAgent)
}
