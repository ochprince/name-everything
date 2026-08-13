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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <App />
    </BrowserRouter>
  </StrictMode>,
)
