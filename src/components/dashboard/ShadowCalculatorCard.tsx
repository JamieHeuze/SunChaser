import { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { formatCardinal } from '@/utils/formatUtils'

const PRESETS = [1, 1.8, 5, 10, 30]

export function ShadowCalculatorCard() {
  const sunPosition = useAppStore((s) => s.sunPosition)
  const [height, setHeight] = useState(1.8)

  const isAbove = sunPosition?.isAboveHorizon ?? false
  const altDeg = sunPosition?.altitudeDeg ?? 0
  const azDeg = sunPosition?.azimuthDeg ?? 0

  // Shadow length: height / tan(altitude) — undefined below horizon
  const altRad = (altDeg * Math.PI) / 180
  const shadowLength = isAbove && altDeg > 1 ? height / Math.tan(altRad) : null

  // Shadow falls opposite to sun
  const shadowBearing = (azDeg + 180) % 360

  return (
    <div className="border-t border-te-border">
      <div className="px-4 pt-3 pb-3">
        <div className="te-label mb-3">SHADOW CALCULATOR</div>

        {/* Height input */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1">
            <div className="te-label text-te-dim mb-1.5">OBJECT HEIGHT (M)</div>
            <input
              type="number"
              min={0.1}
              max={500}
              step={0.1}
              value={height}
              onChange={(e) => setHeight(Math.max(0.1, parseFloat(e.target.value) || 1))}
              className="w-full bg-te-s2 text-te-text border border-te-border px-3 py-2 focus:border-te-orange focus:outline-none"
              style={{ fontSize: '13px', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        {/* Presets */}
        <div className="flex gap-1.5 mb-3">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setHeight(p)}
              className="flex-1 py-1.5 border text-center transition-colors"
              style={{
                borderColor: height === p ? '#ff6600' : '#222222',
                color: height === p ? '#ff6600' : '#686868',
                background: height === p ? 'rgba(255,102,0,0.08)' : '#111111',
                fontSize: '11px',
                letterSpacing: '0.1em',
              }}
            >
              {p}m
            </button>
          ))}
        </div>

        {/* Result */}
        {isAbove && shadowLength !== null ? (
          <div className="grid grid-cols-2 gap-px border border-te-border">
            <div className="bg-te-s1 px-3 py-2.5">
              <div className="te-label text-te-dim mb-1">LENGTH</div>
              <div className="text-lg font-medium text-te-text" style={{ fontFeatureSettings: '"tnum" 1' }}>
                {shadowLength < 100
                  ? shadowLength.toFixed(1)
                  : Math.round(shadowLength).toLocaleString()}
                <span className="te-label text-te-muted ml-1">M</span>
              </div>
            </div>
            <div className="bg-te-s1 px-3 py-2.5">
              <div className="te-label text-te-dim mb-1">DIRECTION</div>
              <div className="text-lg font-medium text-te-text">
                {formatCardinal(shadowBearing)}
                <span className="te-label text-te-muted ml-1">{Math.round(shadowBearing)}°</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-te-border bg-te-s1 px-3 py-2.5">
            <div className="te-label text-te-dim">
              {isAbove && altDeg <= 1 ? 'SUN TOO LOW — INFINITE SHADOW' : 'SUN BELOW HORIZON'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
