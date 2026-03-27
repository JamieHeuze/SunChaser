interface Props {
  rotation: number // degrees — negative of device heading
}

const CARDINALS = [
  { label: 'N', angle: 0, major: true },
  { label: 'NE', angle: 45, major: false },
  { label: 'E', angle: 90, major: true },
  { label: 'SE', angle: 135, major: false },
  { label: 'S', angle: 180, major: true },
  { label: 'SW', angle: 225, major: false },
  { label: 'W', angle: 270, major: true },
  { label: 'NW', angle: 315, major: false },
]

export function CompassRose({ rotation }: Props) {
  const cx = 150
  const cy = 150
  const r = 130

  return (
    <svg
      viewBox="0 0 300 300"
      className="w-full h-full"
      style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.15s linear' }}
    >
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={r - 10} fill="none" stroke="#0f172a" strokeWidth={1} />

      {/* Degree ticks */}
      {Array.from({ length: 36 }, (_, i) => {
        const deg = i * 10
        const rad = ((deg - 90) * Math.PI) / 180
        const inner = r - 8
        const outer = r - 2
        return (
          <line
            key={deg}
            x1={cx + inner * Math.cos(rad)}
            y1={cy + inner * Math.sin(rad)}
            x2={cx + outer * Math.cos(rad)}
            y2={cy + outer * Math.sin(rad)}
            stroke="#334155"
            strokeWidth={1}
          />
        )
      })}

      {/* Cardinal / intercardinal labels */}
      {CARDINALS.map(({ label, angle, major }) => {
        const rad = ((angle - 90) * Math.PI) / 180
        const labelR = r - 22
        const x = cx + labelR * Math.cos(rad)
        const y = cy + labelR * Math.sin(rad)
        const isNorth = label === 'N'
        return (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={major ? 13 : 9}
            fontWeight={major ? 'bold' : 'normal'}
            fill={isNorth ? '#ef4444' : major ? '#e2e8f0' : '#64748b'}
          >
            {label}
          </text>
        )
      })}

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={4} fill="#334155" />
    </svg>
  )
}
