import { useAppStore } from '@/store/appStore'
import { getLightQuality } from '@/utils/lightQualityUtils'

export function LightQualityCard() {
  const sunPosition = useAppStore((s) => s.sunPosition)

  const quality = sunPosition
    ? getLightQuality(sunPosition.altitudeDeg)
    : getLightQuality(-90)

  const segments = Array.from({ length: 10 }, (_, i) => i < quality.segmentsFilled)

  return (
    <div className="border-t border-te-border">
      <div className="px-4 pt-3 pb-3">
        <div className="flex items-baseline justify-between mb-3">
          <div className="te-label">LIGHT QUALITY</div>
          <div className="te-label" style={{ color: quality.color }}>
            {quality.name}
          </div>
        </div>

        {/* Score bar */}
        <div className="flex gap-[3px] mb-2.5">
          {segments.map((filled, i) => (
            <div
              key={i}
              className="flex-1 h-[10px]"
              style={{
                background: filled ? quality.color : '#1e1e1e',
                border: `1px solid ${filled ? quality.color : '#2a2a2a'}`,
                opacity: filled ? (0.4 + (i / 9) * 0.6) : 1,
              }}
            />
          ))}
        </div>

        <div className="flex items-baseline justify-between">
          <div className="te-label text-te-dim">{quality.description}</div>
          <div
            className="text-base font-medium"
            style={{ color: quality.color, fontFeatureSettings: '"tnum" 1', fontSize: '20px' }}
          >
            {quality.score}
            <span className="te-label text-te-muted ml-1">/100</span>
          </div>
        </div>
      </div>
    </div>
  )
}
