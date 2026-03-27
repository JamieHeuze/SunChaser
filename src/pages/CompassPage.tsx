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
  const { heading, permissionState, isSupported } = useAppStore((s) => s.deviceOrientation)
  const setDeviceOrientation = useAppStore((s) => s.setDeviceOrientation)

  const rotation = heading !== null ? -heading : 0
  const azimuth = sunPosition?.azimuthDeg ?? 180
  const altitude = sunPosition?.altitudeDeg ?? 0

  // The rose is CSS-rotated by `rotation` (-heading) so that physical north stays
  // visually "up". The needle is drawn in screen space, so its SVG angle must be
  // shifted by the same amount to remain anchored to the same physical direction.
  // Without this, the needle drifts by the device heading and reads ~180° wrong
  // when the device faces south.
  const needleAzimuth = heading !== null ? ((azimuth - heading) % 360 + 360) % 360 : azimuth

  const showEnableButton = permissionState === 'prompt' || (isSupported && heading === null && permissionState !== 'unavailable' && permissionState !== 'denied')

  return (
    <div className="flex flex-col items-center justify-between h-full px-4 pt-4 pb-2 max-w-lg mx-auto">
      {/* Info row */}
      <div className="flex gap-4 w-full justify-center flex-wrap">
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
        <CompassNeedle azimuthDeg={needleAzimuth} altitudeDeg={altitude} />
      </div>

      {/* Status / permission */}
      {showEnableButton && (
        <div className="w-full max-w-sm space-y-2">
          <button
            onClick={() => requestOrientationPermission(setDeviceOrientation)}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-2xl transition-colors text-sm"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Enable Live Compass
          </button>
          <p className="text-slate-500 text-xs text-center">
            Tap to allow device orientation access
          </p>
        </div>
      )}

      {permissionState === 'denied' && (
        <div className="w-full max-w-sm text-center space-y-1">
          <p className="text-red-400 text-sm font-medium">Compass access denied</p>
          <p className="text-slate-400 text-xs">
            Go to your browser settings and allow motion &amp; orientation access for this site.
          </p>
        </div>
      )}

      {permissionState === 'unavailable' && (
        <p className="text-slate-400 text-xs text-center max-w-xs">
          No compass sensor detected — showing calculated sun direction only.
        </p>
      )}

      {heading !== null && (
        <p className="text-slate-500 text-xs text-center">
          Compass rose rotates with your device · Sun needle points toward the sun
        </p>
      )}
    </div>
  )
}
