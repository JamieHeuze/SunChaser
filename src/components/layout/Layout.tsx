import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation'

export function Layout() {
  // Run at layout level so heading is available on every page (map, compass, planner)
  useDeviceOrientation()

  return (
    <div className="flex flex-col h-dvh bg-slate-950 text-white">
      <Header />
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
