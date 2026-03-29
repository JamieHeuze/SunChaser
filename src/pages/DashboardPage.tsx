import { useEffect, useState } from 'react'
import { useSunPosition } from '@/hooks/useSunPosition'
import { SunInfoCard } from '@/components/dashboard/SunInfoCard'
import { SunriseSunsetCard } from '@/components/dashboard/SunriseSunsetCard'
import { GoldenHourCard } from '@/components/dashboard/GoldenHourCard'
import { LightQualityCard } from '@/components/dashboard/LightQualityCard'
import { MoonPhaseCard } from '@/components/dashboard/MoonPhaseCard'
import { ShadowCalculatorCard } from '@/components/dashboard/ShadowCalculatorCard'
import { WeatherCard } from '@/components/dashboard/WeatherCard'
import { useAppStore } from '@/store/appStore'
import {
  notificationsSupported,
  requestNotificationPermission,
  scheduleGoldenHourAlerts,
} from '@/utils/notificationUtils'

export function DashboardPage() {
  useSunPosition()
  const sunPosition = useAppStore((s) => s.sunPosition)
  const sunTimes = useAppStore((s) => s.sunTimes)
  const [notifPermission, setNotifPermission] = useState<string>(
    notificationsSupported() ? Notification.permission : 'denied'
  )

  // Schedule alerts whenever sunTimes updates
  useEffect(() => {
    if (sunTimes && notifPermission === 'granted') {
      scheduleGoldenHourAlerts(sunTimes)
    }
  }, [sunTimes, notifPermission])

  const handleEnableNotifications = async () => {
    const perm = await requestNotificationPermission()
    setNotifPermission(perm)
    if (perm === 'granted' && sunTimes) {
      scheduleGoldenHourAlerts(sunTimes)
    }
  }

  return (
    <div className="min-h-full bg-te-bg">
      {/* Live status bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-te-border">
        <div className="flex items-center gap-2">
          <span
            className="w-[7px] h-[7px] rounded-full"
            style={{ background: sunPosition?.isAboveHorizon ? '#ff6600' : '#363636' }}
          />
          <span className="te-label">
            {sunPosition?.isAboveHorizon ? 'SUN ABOVE HORIZON · LIVE' : 'SUN BELOW HORIZON'}
          </span>
        </div>
        {notificationsSupported() && notifPermission === 'prompt' && (
          <button
            onClick={handleEnableNotifications}
            className="te-label text-te-orange hover:text-te-amber transition-colors"
          >
            [ ALERTS ]
          </button>
        )}
        {notifPermission === 'granted' && (
          <span className="te-label text-te-green">● ALERTS ON</span>
        )}
      </div>

      <SunInfoCard />
      <LightQualityCard />
      <WeatherCard />
      <SunriseSunsetCard />
      <GoldenHourCard />
      <MoonPhaseCard />
      <ShadowCalculatorCard />
    </div>
  )
}
