/*
 * name-everything 图片缓存 Service Worker
 *
 * 机制：
 * - 版本号来自注册 URL 的 ?v= 参数（与 src/shared/assets.ts 的 ASSET_VERSION 同源），
 *   bump 版本 → 注册 URL 变 → 浏览器安装新 SW → 新缓存名 → activate 清旧缓存 → 重预缓存新图。
 * - 缓存策略：图片 Cache First（命中即返回，miss 走网络并写入缓存）。
 * - 只缓存 /images/ 下的静态图，不碰 HTML/JS/CSS（让 Vite 构建产物的正常更新不受影响）。
 */
const VERSION = new URL(self.location.href).searchParams.get('v') || '0'
const CACHE_NAME = `ne-images-${VERSION}`

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
        Promise.all(keys.filter((k) => k.startsWith('ne-images-') && k !== CACHE_NAME).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || !url.pathname.includes('/images/')) return
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
})
