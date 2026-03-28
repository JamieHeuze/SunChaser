import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation'

export function Layout() {
  useDeviceOrientation()

  return (
    <div className="flex flex-col h-dvh bg-te-bg text-te-text">
      <Header />
      <main
        className="flex-1 overflow-y-auto"
        style={{
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        }}
      >
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
