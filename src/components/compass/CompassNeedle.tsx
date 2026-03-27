interface Props {
  azimuthDeg: number
  altitudeDeg: number
}

export function CompassNeedle({ azimuthDeg, altitudeDeg }: Props) {
  const cx = 150
  const cy = 150
  const isAbove = altitudeDeg > 0
  const rad = ((azimuthDeg - 90) * Math.PI) / 180
  const needleLen = 90
  const tipX = cx + needleLen * Math.cos(rad)
  const tipY = cy + needleLen * Math.sin(rad)
  const labelR = needleLen + 18
  const labelX = cx + labelR * Math.cos(rad)
  const labelY = cy + labelR * Math.sin(rad)

  return (
    <svg viewBox="0 0 300 300" className="absolute inset-0 w-full h-full pointer-events-none">
      {/* Glow */}
      {isAbove && (
        <circle cx={tipX} cy={tipY} r={14} fill="#f97316" opacity={0.2} />
      )}
      {/* Needle line */}
      <line
        x1={cx}
        y1={cy}
        x2={tipX}
        y2={tipY}
        stroke={isAbove ? '#f97316' : '#475569'}
        strokeWidth={isAbove ? 3 : 2}
        strokeDasharray={isAbove ? undefined : '6 4'}
        strokeLinecap="round"
      />
      {/* Sun circle at tip */}
      <circle
        cx={tipX}
        cy={tipY}
        r={7}
        fill={isAbove ? '#fbbf24' : '#475569'}
        stroke={isAbove ? '#f97316' : '#334155'}
        strokeWidth={2}
      />
      {/* Sun rays (only when above horizon) */}
      {isAbove && [0, 60, 120, 180, 240, 300].map((deg) => {
        const rr = ((deg - 90) * Math.PI) / 180
        return (
          <line
            key={deg}
            x1={tipX + 9 * Math.cos(rr)}
            y1={tipY + 9 * Math.sin(rr)}
            x2={tipX + 13 * Math.cos(rr)}
            y2={tipY + 13 * Math.sin(rr)}
            stroke="#fbbf24"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        )
      })}
      {/* Label */}
      <text
        x={labelX}
        y={labelY}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={10}
        fontWeight="bold"
        fill={isAbove ? '#fbbf24' : '#64748b'}
      >
        {isAbove ? `☀ ${Math.round(azimuthDeg)}°` : `☽ ${Math.round(azimuthDeg)}°`}
      </text>
    </svg>
  )
}
