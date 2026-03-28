import { useAppStore } from '@/store/appStore'
import { formatTime, formatCountdown, formatDayProgress } from '@/utils/formatUtils'

export function SunriseSunsetCard() {
  const sunTimes = useAppStore((s) => s.sunTimes)
  if (!sunTimes) return null

  const { sunrise, sunset, solarNoon } = sunTimes
  const now = new Date()
  const progress = formatDayProgress(sunrise, sunset, now)
  const isPastSunset = sunset && now > sunset
  const isBeforeSunrise = sunrise && now < sunrise

  return (
    <div className="border-b border-te-border">
      <div className="px-4 pt-4 pb-2">
        <div className="te-label mb-3">DAY ARC</div>

        {/* Time row */}
        <div className="grid grid-cols-3 mb-3">
          <div>
            <div className="te-label mb-1">SUNRISE</div>
            <div className="text-sm font-medium text-te-text" style={{ fontFeatureSettings: '"tnum" 1' }}>
              {formatTime(sunrise)}
            </div>
          </div>
          <div className="text-center">
            <div className="te-label mb-1">SOLAR NOON</div>
            <div className="text-sm font-medium text-te-text" style={{ fontFeatureSettings: '"tnum" 1' }}>
              {formatTime(solarNoon)}
            </div>
          </div>
          <div className="text-right">
            <div className="te-label mb-1">SUNSET</div>
            <div className="text-sm font-medium text-te-text" style={{ fontFeatureSettings: '"tnum" 1' }}>
              {formatTime(sunset)}
            </div>
          </div>
        </div>

        {/* Progress track */}
        <div className="relative h-[2px] bg-te-border mb-3">
          <div
            className="absolute inset-y-0 left-0 bg-te-orange transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
          {/* Noon marker */}
          <div className="absolute top-1/2 -translate-y-1/2 w-[1px] h-2 bg-te-border-2" style={{ left: '50%' }} />
          {/* Now cursor */}
          {progress > 0 && progress < 100 && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-[2px] h-4 bg-te-orange transition-all duration-1000"
              style={{ left: `${progress}%` }}
            />
          )}
        </div>

        {/* Countdown */}
        <div className="te-label">
          {isBeforeSunrise && (
            <span>SUNRISE IN <span className="text-te-orange">{formatCountdown(sunrise)}</span></span>
          )}
          {!isBeforeSunrise && !isPastSunset && (
            <span>SETS IN <span className="text-te-orange">{formatCountdown(sunset)}</span></span>
          )}
          {isPastSunset && (
            <span className="text-te-dim">SUN HAS SET</span>
          )}
        </div>
      </div>
    </div>
  )
}
