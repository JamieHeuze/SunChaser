import { useAppStore } from '@/store/appStore'
import { formatBearing, formatAltitude } from '@/utils/formatUtils'
import { AltitudeArc } from './AltitudeArc'

export function SunInfoCard() {
  const sunPosition = useAppStore((s) => s.sunPosition)

  if (!sunPosition) {
    return (
      <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/50">
        <p className="text-slate-400 text-sm text-center">Calculating sun position…</p>
      </div>
    )
  }

  const { azimuthDeg, altitudeDeg, isAboveHorizon } = sunPosition

  return (
    <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/50">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Sun Direction</p>
          <p className="text-3xl font-bold text-white">{formatBearing(azimuthDeg)}</p>
          <p className={`text-sm mt-1 font-medium ${isAboveHorizon ? 'text-orange-400' : 'text-slate-400'}`}>
            {isAboveHorizon ? `${formatAltitude(altitudeDeg)} above horizon` : 'Below horizon'}
          </p>
        </div>
        <div className="flex flex-col items-center">
          <AltitudeArc altitudeDeg={altitudeDeg} />
        </div>
      </div>
    </div>
  )
}
