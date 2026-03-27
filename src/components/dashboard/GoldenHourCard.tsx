import { useAppStore } from '@/store/appStore'
import { formatTime, formatCountdown } from '@/utils/formatUtils'

export function GoldenHourCard() {
  const sunTimes = useAppStore((s) => s.sunTimes)

  if (!sunTimes) return null

  const { sunrise, goldenHourMorningEnd, goldenHourEveningStart, sunset } = sunTimes
  const now = new Date()

  const isMorningGolden =
    sunrise && goldenHourMorningEnd && now >= sunrise && now <= goldenHourMorningEnd
  const isEveningGolden =
    goldenHourEveningStart && sunset && now >= goldenHourEveningStart && now <= sunset

  const isGoldenNow = isMorningGolden || isEveningGolden

  return (
    <div
      className={`rounded-2xl p-5 border transition-all ${
        isGoldenNow
          ? 'bg-yellow-900/40 border-yellow-500/60 shadow-lg shadow-yellow-900/20'
          : 'bg-slate-800/80 border-slate-700/50'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">✨</span>
        <p className="text-slate-400 text-xs uppercase tracking-wider">Golden Hour</p>
        {isGoldenNow && (
          <span className="ml-auto text-xs font-bold text-yellow-400 bg-yellow-900/60 px-2 py-0.5 rounded-full">
            NOW
          </span>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">🌅 Morning</span>
          <span className="text-sm font-medium text-orange-300">
            {formatTime(sunrise)} – {formatTime(goldenHourMorningEnd)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">🌇 Evening</span>
          <span className="text-sm font-medium text-orange-300">
            {formatTime(goldenHourEveningStart)} – {formatTime(sunset)}
          </span>
        </div>
      </div>

      {!isGoldenNow && goldenHourEveningStart && now < goldenHourEveningStart && (
        <p className="text-xs text-slate-400 mt-3 text-center">
          Evening golden hour in <strong className="text-yellow-400">{formatCountdown(goldenHourEveningStart)}</strong>
        </p>
      )}
    </div>
  )
}
