/*
 * name-everything 图片缓存 Service Worker
 *
 * 两类缓存，独立管理：
 * 1. ne-images-<VERSION>：站点自带静态图（public/images/*），随 ASSET_VERSION 更新。
 * 2. ne-cdn-images-v1：百词斩 CDN 单词图片（ali.bczcdn.com/r/*），Cache First +
 *    数量上限 LRU。CDN 文件内容基本不变（文件名含 hash + ETag），故固定缓存名、
 *    不随 ASSET_VERSION 清理——换素材不会让已缓存的单词图重新下载。
 *
 * 版本号来自注册 URL 的 ?v= 参数（与 src/shared/assets.ts 的 ASSET_VERSION 同源），
 * bump 版本 → 注册 URL 变 → 浏览器安装新 SW → 新缓存名 → activate 清旧静态图缓存。
 * 只缓存图片，不碰 HTML/JS/CSS（Vite 构建产物正常更新不受影响）。
 */
const VERSION = new URL(self.location.href).searchParams.get('v') || '0'
const CACHE_NAME = `ne-images-${VERSION}`
const CDN_CACHE_NAME = 'ne-cdn-images-v1'
const CDN_HOST = 'ali.bczcdn.com'
const CDN_MAX_ENTRIES = 300
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|svg)(\?|$)/i

/** 预缓存清单（相对 scope 路径）。新增图片记得加进来。 */
const IMAGE_PATHS = [
  'images/doors/open.png',
  'images/doors/closed.png',
  'images/home/banner-cup.jpg',
  'images/home/grammar-horizon.jpg',
  'images/cards/fallback.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.all(
          IMAGE_PATHS.map((p) =>
            cache.add(`${self.registration.scope}${p}?v=${VERSION}`).catch(() => {}),
          ),
        ),
      )
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('ne-images-') && k !== CACHE_NAME)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

/** CDN 缓存写入 + 数量上限（超限删最早放入的，近似 LRU）。 */
async function putCdnImage(request, response) {
  const cache = await caches.open(CDN_CACHE_NAME)
  // 用 cors 模式重新请求：CDN 返回 access-control-allow-origin: *，
  // 可得到可读的 CORS 响应（opaque 响应会双倍计配额，且 Safari 限制更严）。
  const corsRequest = new Request(request, { mode: 'cors' })
  await cache.put(corsRequest, response)
  const keys = await cache.keys()
  if (keys.length > CDN_MAX_ENTRIES) {
    const excess = keys.length - CDN_MAX_ENTRIES
    await Promise.all(keys.slice(0, excess).map((key) => cache.delete(key)))
  }
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET') return

  // 站点自带静态图：Cache First（install 已预缓存）。
  if (url.pathname.includes('/images/')) {
    event.respondWith(
      caches.match(event.request).then((hit) => {
        if (hit) return hit
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
          }
          return response
        })
      }),
    )
    return
  }

  // 百词斩 CDN 单词图片：Cache First + LRU 上限。
  if (url.hostname === CDN_HOST && IMAGE_EXT.test(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((hit) => {
        if (hit) return hit
        return fetch(event.request).then((response) => {
          if (response.ok) {
            void putCdnImage(event.request, response.clone())
          }
          return response
        })
      }),
    )
  }
})
