import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { ProgressProvider } from './features/pictures/hooks/useProgress'
import { GrammarPackProvider } from './features/grammar/content/GrammarPackProvider'
import { unlockCardAudio } from './features/pictures/lib/playAudio'
import { unlockUiSound } from './shared/uiSound'
import { MePage } from './pages/MePage'
import { PracticePage } from './features/pictures/pages/PracticePage'
import { MyChallengePage } from './features/pictures/pages/MyChallengePage'
import { MyChallengeRunPage } from './features/pictures/pages/MyChallengeRunPage'
import { ReviewPage } from './pages/ReviewPage'
import { PracticeHomePage } from './shell/PracticeHomePage'
import { ChallengeHubPage } from './shell/ChallengeHubPage'
import { LearnListPage } from './features/grammar/pages/LearnListPage'
import { LearnPage } from './features/grammar/pages/LearnPage'
import { FallingPlayPage } from './features/grammar/pages/FallingPlayPage'
import { ArcadePage } from './features/grammar/pages/ArcadePage'
import { AppToast } from './components/AppToast'

// The learn list manages its own scroll restoration (sessionStorage), so it
// is exempt from the global scroll-to-top. Every other route change starts
// at the top instead of keeping the previous page's window.scrollY.
const SCROLL_EXEMPT_PATHS = new Set(['/practice/grammar/learn'])

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    if (SCROLL_EXEMPT_PATHS.has(pathname)) return
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  useEffect(() => {
    const unlock = () => {
      unlockCardAudio()
      unlockUiSound()
    }
    window.addEventListener('pointerdown', unlock)
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  return (
    <GrammarPackProvider>
      <ProgressProvider>
        <div className="min-h-dvh bg-cyc font-cue text-day">
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<PracticeHomePage />} />
          <Route path="/practice/pictures" element={<PracticePage />} />
          <Route path="/practice/pictures/play" element={<MyChallengePage />} />
          <Route path="/practice/pictures/play/run" element={<MyChallengeRunPage />} />
          <Route path="/practice/challenge" element={<ChallengeHubPage />} />
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
        <AppToast />
        </div>
      </ProgressProvider>
    </GrammarPackProvider>
  )
}
