import { useSunPosition } from '@/hooks/useSunPosition'
import { SunInfoCard } from '@/components/dashboard/SunInfoCard'
import { SunriseSunsetCard } from '@/components/dashboard/SunriseSunsetCard'
import { GoldenHourCard } from '@/components/dashboard/GoldenHourCard'
import { useAppStore } from '@/store/appStore'

export function DashboardPage() {
  useSunPosition()
  const sunPosition = useAppStore((s) => s.sunPosition)

  return (
    <div className="min-h-full bg-te-bg">
      {/* Live indicator */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-te-border">
        <span
          className="w-[6px] h-[6px] rounded-full"
          style={{ background: sunPosition?.isAboveHorizon ? '#ff6600' : '#363636' }}
        />
        <span className="te-label">
          {sunPosition?.isAboveHorizon ? 'SUN ABOVE HORIZON · LIVE' : 'SUN BELOW HORIZON'}
        </span>
      </div>

      <SunInfoCard />
      <SunriseSunsetCard />
      <GoldenHourCard />
    </div>
  )
}
