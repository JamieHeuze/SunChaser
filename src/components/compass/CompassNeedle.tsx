interface Props {
  azimuthDeg: number
  altitudeDeg: number
}

export function CompassNeedle({ azimuthDeg, altitudeDeg }: Props) {
  const cx = 150, cy = 150
  const isAbove = altitudeDeg > 0
  const rad = ((azimuthDeg - 90) * Math.PI) / 180
  const tipLen = 92
  const tailLen = 20

  const tipX = cx + tipLen * Math.cos(rad)
  const tipY = cy + tipLen * Math.sin(rad)
  const tailX = cx - tailLen * Math.cos(rad)
  const tailY = cy - tailLen * Math.sin(rad)

  // Arrowhead points — small equilateral triangle at the tip
  const perpRad = rad + Math.PI / 2
  const arrowSize = 5
  const ax1 = tipX + arrowSize * Math.cos(perpRad)
  const ay1 = tipY + arrowSize * Math.sin(perpRad)
  const ax2 = tipX - arrowSize * Math.cos(perpRad)
  const ay2 = tipY - arrowSize * Math.sin(perpRad)
  const ax3 = tipX + arrowSize * 1.6 * Math.cos(rad)
  const ay3 = tipY + arrowSize * 1.6 * Math.sin(rad)

  const color = isAbove ? '#ff6600' : '#363636'
  const labelR = tipLen + 20
  const lx = cx + labelR * Math.cos(rad)
  const ly = cy + labelR * Math.sin(rad)

  return (
    <svg viewBox="0 0 300 300" className="absolute inset-0 w-full h-full pointer-events-none">
      {/* Subtle glow behind needle when sun is up */}
      {isAbove && (
        <line
          x1={tailX} y1={tailY} x2={tipX} y2={tipY}
          stroke="#ff6600" strokeWidth={8} strokeLinecap="round" opacity={0.06}
        />
      )}

      {/* Tail (short, dim) */}
      <line
        x1={cx} y1={cy} x2={tailX} y2={tailY}
        stroke={isAbove ? '#ff660040' : '#2a2a2a'} strokeWidth={1} strokeLinecap="round"
      />

      {/* Main needle line */}
      <line
        x1={cx} y1={cy} x2={tipX} y2={tipY}
        stroke={color} strokeWidth={1.5} strokeLinecap="round"
        strokeDasharray={isAbove ? undefined : '4 3'}
      />

      {/* Arrowhead */}
      <polygon
        points={`${ax1},${ay1} ${ax2},${ay2} ${ax3},${ay3}`}
        fill={color}
      />

      {/* Label */}
      <text
        x={lx} y={ly}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={9}
        fontFamily="'IBM Plex Mono', monospace"
        fontWeight="500"
        letterSpacing="0.1em"
        fill={isAbove ? '#ff6600' : '#363636'}
      >
        {isAbove ? `${Math.round((azimuthDeg + 360) % 360)}°` : 'BELOW'}
      </text>

      {/* Center ring */}
      <circle cx={cx} cy={cy} r={5} fill="#111111" stroke={color} strokeWidth={1.5} />
    </svg>
  )
}
