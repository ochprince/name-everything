import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { ProgressProvider } from './hooks/useProgress'
import { unlockCardAudio } from './lib/playAudio'
import { MePage } from './pages/MePage'
import { PracticePage } from './pages/PracticePage'
import { ReviewPage } from './pages/ReviewPage'

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
          <Route path="/" element={<PracticePage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/me" element={<MePage />} />
        </Routes>
        <BottomNav />
      </div>
    </ProgressProvider>
  )
}
