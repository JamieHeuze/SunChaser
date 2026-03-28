/** Horizontal altitude meter — instrument-style level indicator */
interface Props {
  altitudeDeg: number
}

export function AltitudeArc({ altitudeDeg }: Props) {
  const clamped = Math.max(-10, Math.min(90, altitudeDeg))
  // Map -10..90 → 0..100%
  const pct = ((clamped + 10) / 100) * 100
  const isAbove = altitudeDeg > 0

  const ticks = [-10, 0, 15, 30, 45, 60, 75, 90]

  return (
    <div className="w-full">
      {/* Track */}
      <div className="relative h-[2px] bg-te-border rounded-none mb-2">
        {/* Filled portion */}
        <div
          className="absolute inset-y-0 left-0 transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: isAbove ? '#ff6600' : '#363636',
          }}
        />
        {/* Cursor */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-[2px] h-3 transition-all duration-500"
          style={{
            left: `${pct}%`,
            background: isAbove ? '#ff6600' : '#686868',
          }}
        />
      </div>

      {/* Tick labels */}
      <div className="relative h-3">
        {ticks.map((t) => {
          const pos = ((t + 10) / 100) * 100
          return (
            <span
              key={t}
              className="absolute te-label"
              style={{ left: `${pos}%`, transform: 'translateX(-50%)', color: t === 0 ? '#686868' : '#363636' }}
            >
              {t === 0 ? '0' : t === 90 ? '90' : ''}
            </span>
          )
        })}
      </div>
    </div>
  )
}
