interface Props {
  rotation: number
}

export function CompassRose({ rotation }: Props) {
  const cx = 150, cy = 150, r = 128

  // Tick marks: every 10°, longer every 30°, even longer at cardinals
  const ticks = Array.from({ length: 36 }, (_, i) => {
    const deg = i * 10
    const rad = ((deg - 90) * Math.PI) / 180
    const isCardinal = deg % 90 === 0
    const isMajor = deg % 30 === 0
    const inner = isCardinal ? r - 18 : isMajor ? r - 12 : r - 7
    return { deg, rad, inner, isCardinal, isMajor }
  })

  const cardinals = [
    { label: 'N', angle: 0, color: '#ff6600' },
    { label: 'E', angle: 90, color: '#686868' },
    { label: 'S', angle: 180, color: '#686868' },
    { label: 'W', angle: 270, color: '#686868' },
  ]

  const subCardinals = [
    { label: 'NE', angle: 45 }, { label: 'SE', angle: 135 },
    { label: 'SW', angle: 225 }, { label: 'NW', angle: 315 },
  ]

  return (
    <svg
      viewBox="0 0 300 300"
      className="w-full h-full"
      style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.12s linear' }}
    >
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#222222" strokeWidth={1} />

      {/* Tick marks */}
      {ticks.map(({ deg, rad, inner, isCardinal, isMajor }) => (
        <line
          key={deg}
          x1={cx + inner * Math.cos(rad)}
          y1={cy + inner * Math.sin(rad)}
          x2={cx + r * Math.cos(rad)}
          y2={cy + r * Math.sin(rad)}
          stroke={isCardinal ? '#444444' : isMajor ? '#2e2e2e' : '#222222'}
          strokeWidth={isCardinal ? 1.5 : 1}
        />
      ))}

      {/* Sub-cardinal labels */}
      {subCardinals.map(({ label, angle }) => {
        const rad = ((angle - 90) * Math.PI) / 180
        const lr = r - 26
        return (
          <text
            key={label}
            x={cx + lr * Math.cos(rad)}
            y={cy + lr * Math.sin(rad)}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={8}
            fontFamily="'IBM Plex Mono', monospace"
            fill="#363636"
            letterSpacing="0.1em"
          >
            {label}
          </text>
        )
      })}

      {/* Cardinal labels */}
      {cardinals.map(({ label, angle, color }) => {
        const rad = ((angle - 90) * Math.PI) / 180
        const lr = r - 30
        return (
          <text
            key={label}
            x={cx + lr * Math.cos(rad)}
            y={cy + lr * Math.sin(rad)}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={13}
            fontWeight="600"
            fontFamily="'IBM Plex Mono', monospace"
            fill={color}
            letterSpacing="0.05em"
          >
            {label}
          </text>
        )
      })}

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={3} fill="#363636" />
    </svg>
  )
}
