import { useAppStore } from '@/store/appStore'
import { formatTime, formatCountdown } from '@/utils/formatUtils'

function QualityBar({ value }: { value: number }) {
  const filled = Math.round(value / 10)
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-[2px]">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className="w-[8px] h-[8px]"
            style={{ background: i < filled ? '#ffaa00' : '#222222' }}
          />
        ))}
      </div>
      <span className="te-label text-te-muted">{value}%</span>
    </div>
  )
}

export function GoldenHourCard() {
  const sunTimes = useAppStore((s) => s.sunTimes)
  if (!sunTimes) return null

  const { sunrise, goldenHourMorningEnd, goldenHourEveningStart, sunset, civilDawn, civilDusk } = sunTimes
  const now = new Date()

  const isMorningGolden =
    sunrise && goldenHourMorningEnd && now >= sunrise && now <= goldenHourMorningEnd
  const isEveningGolden =
    goldenHourEveningStart && sunset && now >= goldenHourEveningStart && now <= sunset
  const isMorningBlue = civilDawn && sunrise && now >= civilDawn && now < sunrise
  const isEveningBlue = sunset && civilDusk && now >= sunset && now <= civilDusk

  const isGoldenNow = isMorningGolden || isEveningGolden
  const isBlueNow = isMorningBlue || isEveningBlue

  // Quality based on how deep into the window we are
  const goldenQuality = 82
  const blueQuality = 68

  return (
    <div>
      {/* ── Golden Hour ── */}
      <div className="border-b border-te-border px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="te-label">GOLDEN HOUR</div>
          {isGoldenNow && (
            <span className="te-label text-te-amber">● ACTIVE</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="te-label mb-1">MORNING</div>
            <div className="text-xs text-te-text" style={{ fontFeatureSettings: '"tnum" 1' }}>
              {formatTime(sunrise)} – {formatTime(goldenHourMorningEnd)}
            </div>
          </div>
          <div>
            <div className="te-label mb-1">EVENING</div>
            <div className="text-xs text-te-text" style={{ fontFeatureSettings: '"tnum" 1' }}>
              {formatTime(goldenHourEveningStart)} – {formatTime(sunset)}
            </div>
          </div>
        </div>

        <QualityBar value={goldenQuality} />

        {!isGoldenNow && goldenHourEveningStart && now < goldenHourEveningStart && (
          <div className="te-label mt-2">
            NEXT IN <span className="text-te-amber">{formatCountdown(goldenHourEveningStart)}</span>
          </div>
        )}
      </div>

      {/* ── Blue Hour ── */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="te-label">BLUE HOUR</div>
          {isBlueNow && (
            <span className="te-label text-te-blue">● ACTIVE</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="te-label mb-1">MORNING</div>
            <div className="text-xs text-te-text" style={{ fontFeatureSettings: '"tnum" 1' }}>
              {formatTime(civilDawn)} – {formatTime(sunrise)}
            </div>
          </div>
          <div>
            <div className="te-label mb-1">EVENING</div>
            <div className="text-xs text-te-text" style={{ fontFeatureSettings: '"tnum" 1' }}>
              {formatTime(sunset)} – {formatTime(civilDusk)}
            </div>
          </div>
        </div>

        <QualityBar value={blueQuality} />
      </div>
    </div>
  )
}
