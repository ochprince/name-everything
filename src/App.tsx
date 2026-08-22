import { useEffect, useLayoutEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { ProgressProvider } from './features/pictures/hooks/useProgress'
import { unlockCardAudio } from './features/pictures/lib/playAudio'
import { unlockUiSound } from './shared/uiSound'
import { MePage } from './pages/MePage'
import { PracticePage } from './features/pictures/pages/PracticePage'
import { ReviewPage } from './pages/ReviewPage'
import { PracticeHomePage } from './shell/PracticeHomePage'
import { LearnListPage } from './features/grammar/pages/LearnListPage'
import { LearnPage } from './features/grammar/pages/LearnPage'
import { FallingPlayPage } from './features/grammar/pages/FallingPlayPage'
import { ArcadePage } from './features/grammar/pages/ArcadePage'

// The learn list manages its own scroll restoration (sessionStorage), so it
// is exempt from the global scroll-to-top. Every other route change starts
// at the top instead of keeping the previous page's window.scrollY.
const SCROLL_EXEMPT_PATHS = new Set(['/practice/grammar/learn'])

function ScrollToTop() {
  const { pathname } = useLocation()
  // useLayoutEffect so the reset happens before paint. A single scrollTo is
  // not enough on mobile: the URL bar collapse/expand and font-driven reflow
  // can nudge scrollY after the first reset, so we also reset on the next
  // frame and write every scroll container explicitly.
  useLayoutEffect(() => {
    if (SCROLL_EXEMPT_PATHS.has(pathname)) return
    const reset = () => {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
    reset()
    const raf = requestAnimationFrame(reset)
    return () => cancelAnimationFrame(raf)
  }, [pathname])
  return null
}

export default function App() {
  useEffect(() => {
    // Take scroll restoration into our own hands: without this, the browser
    // (bfcache / back navigation) can restore a previous page's scrollY and
    // fight the ScrollToTop + learn-list restoration logic.
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
    const unlock = () => {
      unlockCardAudio()
      unlockUiSound()
    }
    window.addEventListener('pointerdown', unlock)
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  return (
    <ProgressProvider>
      <div className="min-h-dvh bg-cyc font-cue text-day">
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<PracticeHomePage />} />
          <Route path="/practice/pictures" element={<PracticePage />} />
          <Route path="/practice/grammar/learn" element={<LearnListPage />} />
          <Route path="/practice/grammar/learn/:levelId" element={<LearnPage />} />
          <Route
            path="/practice/grammar/learn/:levelId/play"
            element={<FallingPlayPage mode="level" />}
          />
          <Route path="/practice/grammar/play" element={<ArcadePage />} />
          <Route
            path="/practice/grammar/play/run"
            element={<FallingPlayPage mode="arcade" />}
          />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/me" element={<MePage />} />
        </Routes>
        <BottomNav />
      </div>
    </ProgressProvider>
  )
}
