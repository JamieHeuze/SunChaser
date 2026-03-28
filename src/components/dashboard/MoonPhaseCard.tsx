import { useAppStore } from '@/store/appStore'
import { getMoonInfo } from '@/utils/moonCalcUtils'
import { formatTime } from '@/utils/formatUtils'

function MoonSVG({ phase }: { phase: number }) {
  const r = 18
  const cx = 22, cy = 22
  const size = 44

  if (phase < 0.02 || phase > 0.98) {
    // New moon — just outline
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="#111111" stroke="#363636" strokeWidth="1" />
      </svg>
    )
  }

  if (phase > 0.48 && phase < 0.52) {
    // Full moon
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="#e8e8e8" />
      </svg>
    )
  }

  // General case: draw dark background, then lit region on top
  const rx = r * Math.abs(Math.cos(2 * Math.PI * phase))
  let d: string

  if (phase < 0.5) {
    // Waxing: right side lit
    const sweep2 = phase > 0.25 ? 0 : 1
    d = `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${rx} ${r} 0 1 ${sweep2} ${cx} ${cy - r} Z`
  } else {
    // Waning: left side lit
    const sweep2 = phase < 0.75 ? 1 : 0
    d = `M ${cx} ${cy - r} A ${r} ${r} 0 1 0 ${cx} ${cy + r} A ${rx} ${r} 0 1 ${sweep2} ${cx} ${cy - r} Z`
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="#111111" stroke="#363636" strokeWidth="1" />
      <path d={d} fill="#d0d0d0" />
    </svg>
  )
}

export function MoonPhaseCard() {
  const coords = useAppStore((s) => s.location.coords)

  if (!coords) return null

  const now = new Date()
  const moon = getMoonInfo(now, coords.lat, coords.lng)

  return (
    <div className="border-t border-te-border">
      <div className="px-4 pt-3 pb-3">
        <div className="te-label mb-3">MOON</div>
        <div className="flex items-center gap-4">
          <MoonSVG phase={moon.phase} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-te-text mb-1" style={{ fontSize: '13px' }}>
              {moon.phaseName}
            </div>
            <div className="te-label">
              <span className="text-te-muted">{moon.illumination}% ILLUMINATED</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="mb-1">
              <div className="te-label text-te-dim">RISE</div>
              <div className="te-label text-te-text">{formatTime(moon.moonrise)}</div>
            </div>
            <div>
              <div className="te-label text-te-dim">SET</div>
              <div className="te-label text-te-text">{formatTime(moon.moonset)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
