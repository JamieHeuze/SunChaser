import { useAppStore } from '@/store/appStore'
import { formatCardinal } from '@/utils/formatUtils'
import { AltitudeArc } from './AltitudeArc'

export function SunInfoCard() {
  const sunPosition = useAppStore((s) => s.sunPosition)

  const azimuth = sunPosition?.azimuthDeg ?? 0
  const altitude = sunPosition?.altitudeDeg ?? 0
  const isAbove = sunPosition?.isAboveHorizon ?? false

  return (
    <div className="border-b border-te-border">
      {/* Main readout row */}
      <div className="grid grid-cols-2 divide-x divide-te-border">
        {/* Azimuth */}
        <div className="px-4 py-4">
          <div className="te-label mb-2">AZIMUTH</div>
          <div className="flex items-baseline gap-2">
            <span className="te-value-xl te-value-accent">
              {String(Math.round(azimuth)).padStart(3, '0')}°
            </span>
            <span className="te-label text-te-muted">{formatCardinal(azimuth)}</span>
          </div>
        </div>

        {/* Altitude */}
        <div className="px-4 py-4">
          <div className="te-label mb-2">ALTITUDE</div>
          <div className="flex items-baseline gap-2">
            <span className={`te-value-xl ${isAbove ? 'text-te-text' : 'text-te-dim'}`}>
              {altitude >= 0 ? '' : '−'}{String(Math.abs(Math.round(altitude))).padStart(2, '0')}°
            </span>
            <span className="te-label">{isAbove ? 'ABOVE' : 'BELOW'}</span>
          </div>
        </div>
      </div>

      {/* Altitude bar */}
      <div className="px-4 pb-4 pt-1">
        <AltitudeArc altitudeDeg={altitude} />
      </div>
    </div>
  )
}
