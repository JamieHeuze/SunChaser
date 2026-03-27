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
    <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/50 space-y-4">
      <p className="text-slate-400 text-xs uppercase tracking-wider">Day Timeline</p>

      {/* Sunrise / Sunset */}
      <div className="flex justify-between items-center">
        <div className="text-center">
          <div className="text-xs text-slate-400 mb-0.5">Sunrise</div>
          <div className="text-lg font-semibold text-orange-300">{formatTime(sunrise)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400 mb-0.5">Solar Noon</div>
          <div className="text-lg font-semibold text-yellow-300">{formatTime(solarNoon)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400 mb-0.5">Sunset</div>
          <div className="text-lg font-semibold text-orange-300">{formatTime(sunset)}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Countdown */}
      <div className="text-center text-sm">
        {isBeforeSunrise && (
          <span className="text-orange-300">Sunrise in <strong>{formatCountdown(sunrise)}</strong></span>
        )}
        {!isBeforeSunrise && !isPastSunset && (
          <span className="text-slate-300">Sunset in <strong className="text-orange-300">{formatCountdown(sunset)}</strong></span>
        )}
        {isPastSunset && (
          <span className="text-slate-400">Sun has set today</span>
        )}
      </div>
    </div>
  )
}
