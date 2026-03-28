import { useSunPosition } from '@/hooks/useSunPosition'
import { useDeviceOrientation, requestOrientationPermission } from '@/hooks/useDeviceOrientation'
import { useAppStore } from '@/store/appStore'
import { CompassRose } from '@/components/compass/CompassRose'
import { CompassNeedle } from '@/components/compass/CompassNeedle'
import { formatCardinal } from '@/utils/formatUtils'

export function CompassPage() {
  useSunPosition()
  useDeviceOrientation()

  const sunPosition = useAppStore((s) => s.sunPosition)
  const { heading, permissionState, isSupported } = useAppStore((s) => s.deviceOrientation)
  const setDeviceOrientation = useAppStore((s) => s.setDeviceOrientation)

  const rotation = heading !== null ? -heading : 0
  const azimuth = sunPosition?.azimuthDeg ?? 180
  const altitude = sunPosition?.altitudeDeg ?? 0

  // Adjust needle for rose rotation so it stays anchored to physical space
  const needleAzimuth = heading !== null ? ((azimuth - heading) % 360 + 360) % 360 : azimuth

  const showEnableButton =
    permissionState === 'prompt' ||
    (isSupported && heading === null && permissionState !== 'unavailable' && permissionState !== 'denied')

  return (
    <div className="flex flex-col h-full bg-te-bg">
      {/* Instrument readouts */}
      <div className="grid grid-cols-3 divide-x divide-te-border border-b border-te-border shrink-0">
        <div className="px-4 py-3">
          <div className="te-label mb-1">SUN</div>
          <div className="text-base font-medium text-te-orange" style={{ fontFeatureSettings: '"tnum" 1' }}>
            {String(Math.round(azimuth)).padStart(3, '0')}°
          </div>
          <div className="te-label mt-0.5">{formatCardinal(azimuth)}</div>
        </div>
        <div className="px-4 py-3">
          <div className="te-label mb-1">ALTITUDE</div>
          <div className="text-base font-medium text-te-text" style={{ fontFeatureSettings: '"tnum" 1' }}>
            {Math.round(altitude)}°
          </div>
          <div className="te-label mt-0.5">{altitude > 0 ? 'ABOVE' : 'BELOW'}</div>
        </div>
        <div className="px-4 py-3">
          <div className="te-label mb-1">HEADING</div>
          <div className="text-base font-medium text-te-blue" style={{ fontFeatureSettings: '"tnum" 1' }}>
            {heading !== null ? `${String(Math.round(heading)).padStart(3, '0')}°` : '---°'}
          </div>
          <div className="te-label mt-0.5">
            {heading !== null ? formatCardinal(heading) : 'NO DATA'}
          </div>
        </div>
      </div>

      {/* Compass */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 min-h-0">
        <div className="relative w-full max-w-[320px] aspect-square">
          <CompassRose rotation={rotation} />
          <CompassNeedle azimuthDeg={needleAzimuth} altitudeDeg={altitude} />
        </div>
      </div>

      {/* Status bar */}
      <div className="shrink-0 border-t border-te-border px-4 py-3">
        {showEnableButton && (
          <button
            onClick={() => requestOrientationPermission(setDeviceOrientation)}
            className="w-full te-label text-te-orange hover:text-te-text transition-colors py-1"
            style={{ letterSpacing: '0.14em' }}
          >
            [ ENABLE LIVE COMPASS ]
          </button>
        )}
        {permissionState === 'denied' && (
          <p className="te-label text-te-red text-center">
            COMPASS DENIED · ENABLE IN BROWSER SETTINGS
          </p>
        )}
        {permissionState === 'unavailable' && (
          <p className="te-label text-te-dim text-center">
            NO COMPASS SENSOR · CALCULATED DIRECTION
          </p>
        )}
        {heading !== null && (
          <p className="te-label text-te-dim text-center">
            ROSE TRACKS DEVICE · NEEDLE TRACKS SUN
          </p>
        )}
      </div>
    </div>
  )
}
