import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource/big-shoulders-text/latin-400'
import '@fontsource/big-shoulders-text/latin-500'
import '@fontsource/big-shoulders-text/latin-600'
import '@fontsource/big-shoulders-text/latin-700'
import '@fontsource/big-shoulders-text/latin-800'
// 中文字体 = 子集化 Noto Sans SC（scripts/subset-fonts.py 生成，~460KB/字重
// vs @fontsource 全量 1.16MB/字重；字符覆盖 UI 文案 + 词库 + 语法内容，
// 未覆盖字符由字体栈回退到 PingFang SC / Microsoft YaHei 系统字体）。
// @font-face 注册见 index.css。
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
