import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource/big-shoulders-text/latin-400'
import '@fontsource/big-shoulders-text/latin-500'
import '@fontsource/big-shoulders-text/latin-600'
import '@fontsource/big-shoulders-text/latin-700'
import '@fontsource/big-shoulders-text/latin-800'
import '@fontsource/noto-sans-sc/chinese-simplified-500'
import '@fontsource/noto-sans-sc/chinese-simplified-600'
import '@fontsource/noto-sans-sc/chinese-simplified-700'
import './index.css'
import App from './App.tsx'
import { ASSET_VERSION } from './shared/assets'

// 图片缓存 Service Worker：仅在线上注册（本地 dev 不注册，避免干扰开发）。
// 版本号随 URL query 传递：bump ASSET_VERSION → 新 SW 安装 → 自动刷新图片缓存。
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js?v=${ASSET_VERSION}`)
      .catch(() => {})
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter
      basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <App />
    </BrowserRouter>
  </StrictMode>,
)
