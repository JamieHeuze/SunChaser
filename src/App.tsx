import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { Layout } from '@/components/layout/Layout'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { CompassPage } from '@/pages/CompassPage'
import { MapPage } from '@/pages/MapPage'
import { TripPlannerPage } from '@/pages/TripPlannerPage'
import { CalendarPage } from '@/pages/CalendarPage'
import { ARPage } from '@/pages/ARPage'

function RootRedirect() {
  const coords = useAppStore((s) => s.location.coords)
  return <Navigate to={coords ? '/dashboard' : '/onboarding'} replace />
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/compass" element={<CompassPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/planner" element={<TripPlannerPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/ar" element={<ARPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
