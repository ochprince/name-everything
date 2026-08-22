import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { ProgressProvider } from './features/pictures/hooks/useProgress'
import { unlockCardAudio } from './features/pictures/lib/playAudio'
import { MePage } from './pages/MePage'
import { PracticePage } from './features/pictures/pages/PracticePage'
import { ReviewPage } from './pages/ReviewPage'
import { PracticeHomePage } from './shell/PracticeHomePage'
import { LearnListPage } from './features/grammar/pages/LearnListPage'
import { LearnPage } from './features/grammar/pages/LearnPage'
import { FallingPlayPage } from './features/grammar/pages/FallingPlayPage'
import { ArcadePage } from './features/grammar/pages/ArcadePage'

export default function App() {
  useEffect(() => {
    const unlock = () => unlockCardAudio()
    window.addEventListener('pointerdown', unlock)
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  return (
    <ProgressProvider>
      <div className="min-h-dvh bg-cyc font-cue text-day">
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
