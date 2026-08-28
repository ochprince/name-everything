/**
 * 静态资源版本号：换图素材后 bump 此值（如 20260828 → 20260901）。
 *
 * 所有图片 URL 自动带 `?v=` 参数（见 assetUrl）：
 * - Service Worker 以完整 URL 为缓存 key → 版本变 → 缓存 miss → 拉新图
 * - GitHub Pages 的 max-age=600 也对 query 变化生效 → 浏览器侧同样失效
 * 换图流程 = 替换 public/images 文件 + bump 此常量，其余全自动。
 */
export const ASSET_VERSION = '20260828'

/** 生成带版本号的资源 URL（兼容 GitHub Pages 子路径 base）。 */
export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path}?v=${ASSET_VERSION}`
}
