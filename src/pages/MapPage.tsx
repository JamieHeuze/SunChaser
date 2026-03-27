import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer } from 'react-leaflet'
import { useAppStore } from '@/store/appStore'
import { useSunPosition } from '@/hooks/useSunPosition'
import { SunPathLayer } from '@/components/map/SunPathLayer'
import { SunMarker } from '@/components/map/SunMarker'
import { formatBearing } from '@/utils/formatUtils'

export function MapPage() {
  useSunPosition()

  const coords = useAppStore((s) => s.location.coords)
  const sunPosition = useAppStore((s) => s.sunPosition)

  if (!coords) return null

  const today = new Date()

  return (
    <div className="relative h-full">
      <MapContainer
        center={[coords.lat, coords.lng]}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <SunPathLayer coords={coords} date={today} />
        {sunPosition && (
          <SunMarker
            coords={coords}
            azimuthDeg={sunPosition.azimuthDeg}
            altitudeDeg={sunPosition.altitudeDeg}
          />
        )}
      </MapContainer>

      {/* Overlay badge */}
      {sunPosition && (
        <div className="absolute top-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur rounded-xl px-3 py-2 text-sm border border-slate-700/60">
          <div className="text-xs text-slate-400">Sun · Live</div>
          <div className="font-bold text-orange-400">{formatBearing(sunPosition.azimuthDeg)}</div>
          <div className="text-xs text-slate-300">
            {sunPosition.isAboveHorizon
              ? `${Math.round(sunPosition.altitudeDeg)}° above horizon`
              : 'Below horizon'}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-slate-900/90 backdrop-blur rounded-xl px-3 py-2 text-xs border border-slate-700/60 space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-orange-500 rounded inline-block" />
          <span className="text-slate-300">Today's sun path</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
          <span className="text-slate-300">Current sun direction</span>
        </div>
      </div>
    </div>
  )
}
