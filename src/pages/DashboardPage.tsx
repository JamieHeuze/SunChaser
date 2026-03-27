import { useSunPosition } from '@/hooks/useSunPosition'
import { SunInfoCard } from '@/components/dashboard/SunInfoCard'
import { SunriseSunsetCard } from '@/components/dashboard/SunriseSunsetCard'
import { GoldenHourCard } from '@/components/dashboard/GoldenHourCard'
import { useAppStore } from '@/store/appStore'
import { formatBearing } from '@/utils/formatUtils'

function LiveBadge() {
  const sunPosition = useAppStore((s) => s.sunPosition)
  if (!sunPosition?.isAboveHorizon) return null
  return (
    <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      Live · {formatBearing(sunPosition.azimuthDeg)}
    </div>
  )
}

export function DashboardPage() {
  useSunPosition()

  return (
    <div className="px-4 py-4 space-y-3 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Today's Sun</h2>
        <LiveBadge />
      </div>
      <SunInfoCard />
      <SunriseSunsetCard />
      <GoldenHourCard />
    </div>
  )
}
