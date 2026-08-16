import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'

window.__NE_BOOT?.mark('main.tsx evaluated')

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

window.__NE_BOOT?.mark('createRoot() called')

void import('./index.css').then(
  () => window.__NE_BOOT?.mark('index.css ok'),
  (err: unknown) =>
    window.__NE_BOOT?.mark(
      'index.css FAIL ' + (err instanceof Error ? err.message : String(err)),
    ),
)
