import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/big-shoulders-text/latin-400.css'
import '@fontsource/big-shoulders-text/latin-500.css'
import '@fontsource/big-shoulders-text/latin-600.css'
import '@fontsource/big-shoulders-text/latin-700.css'
import '@fontsource/big-shoulders-text/latin-800.css'
import '@fontsource/noto-sans-sc/chinese-simplified-500.css'
import '@fontsource/noto-sans-sc/chinese-simplified-600.css'
import '@fontsource/noto-sans-sc/chinese-simplified-700.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
