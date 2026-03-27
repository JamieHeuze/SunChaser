import { useSunPosition } from '@/hooks/useSunPosition'
import { useDeviceOrientation, requestOrientationPermission } from '@/hooks/useDeviceOrientation'
import { useAppStore } from '@/store/appStore'
import { CompassRose } from '@/components/compass/CompassRose'
import { CompassNeedle } from '@/components/compass/CompassNeedle'
import { formatBearing, formatAltitude } from '@/utils/formatUtils'

export function CompassPage() {
  useSunPosition()
  useDeviceOrientation()

  const sunPosition = useAppStore((s) => s.sunPosition)
  const { heading, permissionState } = useAppStore((s) => s.deviceOrientation)
  const setDeviceOrientation = useAppStore((s) => s.setDeviceOrientation)

  const rotation = heading !== null ? -heading : 0
  const azimuth = sunPosition?.azimuthDeg ?? 180
  const altitude = sunPosition?.altitudeDeg ?? 0

  return (
    <div className="flex flex-col items-center justify-between h-full px-4 pt-4 pb-2 max-w-lg mx-auto">
      {/* Info row */}
      <div className="flex gap-4 w-full justify-center">
        <div className="bg-slate-800/80 rounded-xl px-4 py-2 text-center border border-slate-700/50">
          <div className="text-xs text-slate-400">Direction</div>
          <div className="text-sm font-bold text-orange-400">{formatBearing(azimuth)}</div>
        </div>
        <div className="bg-slate-800/80 rounded-xl px-4 py-2 text-center border border-slate-700/50">
          <div className="text-xs text-slate-400">Altitude</div>
          <div className="text-sm font-bold text-orange-400">
            {sunPosition ? formatAltitude(altitude) : '--'}
          </div>
        </div>
        {heading !== null && (
          <div className="bg-slate-800/80 rounded-xl px-4 py-2 text-center border border-slate-700/50">
            <div className="text-xs text-slate-400">Heading</div>
            <div className="text-sm font-bold text-blue-400">{Math.round(heading)}°</div>
          </div>
        )}
      </div>

      {/* Compass */}
      <div className="relative w-full max-w-[320px] aspect-square my-4">
        <CompassRose rotation={rotation} />
        <CompassNeedle azimuthDeg={azimuth} altitudeDeg={altitude} />
      </div>

      {/* Permission prompt */}
      {permissionState === 'prompt' && (
        <button
          onClick={() => requestOrientationPermission(setDeviceOrientation)}
          className="w-full max-w-sm bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-2xl transition-colors text-sm"
        >
          Enable Live Compass
        </button>
      )}
      {permissionState === 'denied' && (
        <p className="text-slate-400 text-xs text-center max-w-xs">
          Live compass unavailable — showing calculated sun direction. Enable device orientation in your browser settings.
        </p>
      )}
      {heading !== null && (
        <p className="text-slate-500 text-xs text-center">
          Compass rose rotates with your device · Sun needle points toward the sun
        </p>
      )}
      {heading === null && permissionState === 'granted' && (
        <p className="text-slate-500 text-xs text-center">
          Calculated sun direction · No live compass signal
        </p>
      )}
    </div>
  )
}
