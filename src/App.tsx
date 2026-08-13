import { Route, Routes } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { MePage } from './pages/MePage'
import { PracticePage } from './pages/PracticePage'
import { ReviewPage } from './pages/ReviewPage'

export default function App() {
  return (
    <div className="min-h-dvh bg-cyc font-cue text-day">
      <Routes>
        <Route path="/" element={<PracticePage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/me" element={<MePage />} />
      </Routes>
      <BottomNav />
    </div>
  )
}
