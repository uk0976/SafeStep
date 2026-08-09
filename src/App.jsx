import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Landing from './pages/Landing'
import NewJourney from './pages/NewJourney'
import TrackJourney from './pages/TrackJourney'
import { ensureDemoJourney } from './lib/journeys'

function App() {
  useEffect(() => {
    ensureDemoJourney().catch((err) =>
      console.error('[SafeStep] Failed to seed demo journey', err)
    )
  }, [])

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/new" element={<NewJourney />} />
      <Route path="/track/:id" element={<TrackJourney />} />
    </Routes>
  )
}

export default App
