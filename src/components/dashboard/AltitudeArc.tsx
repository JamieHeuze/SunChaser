interface Props {
  altitudeDeg: number
}

export function AltitudeArc({ altitudeDeg }: Props) {
  const clampedAlt = Math.max(-10, Math.min(90, altitudeDeg))
  // Map -10..90 to 180..0 degrees of arc (left horizon = 180°, zenith = 90°, right horizon = 0°)
  const arcAngle = 180 - ((clampedAlt + 10) / 100) * 180
  const r = 44
  const cx = 56
  const cy = 56

  // Sun position on the arc
  const rad = (arcAngle * Math.PI) / 180
  const sx = cx + r * Math.cos(rad)
  const sy = cy - r * Math.sin(rad) // SVG y-axis is flipped

  const isAbove = altitudeDeg > 0

  return (
    <svg viewBox="0 0 112 64" className="w-full max-w-[200px]">
      {/* Arc path */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="#1e293b"
        strokeWidth={4}
        strokeLinecap="round"
      />
      {/* Progress arc */}
      {isAbove && (
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${sx} ${sy}`}
          fill="none"
          stroke="#f97316"
          strokeWidth={4}
          strokeLinecap="round"
          opacity={0.6}
        />
      )}
      {/* Horizon line */}
      <line x1={cx - r - 4} y1={cy} x2={cx + r + 4} y2={cy} stroke="#334155" strokeWidth={1} />
      {/* Sun dot */}
      <circle
        cx={sx}
        cy={sy}
        r={5}
        fill={isAbove ? '#fbbf24' : '#64748b'}
        className={isAbove ? 'animate-pulse' : ''}
      />
      {/* Altitude label */}
      <text x={cx} y={cy + 14} textAnchor="middle" className="text-xs" fill="#94a3b8" fontSize="8">
        {Math.round(altitudeDeg)}° alt
      </text>
    </svg>
  )
}
