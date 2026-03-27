import 'leaflet/dist/leaflet.css'
import { useState } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { useAppStore } from '@/store/appStore'
import { useSunPosition } from '@/hooks/useSunPosition'
import { SunPathLayer } from '@/components/map/SunPathLayer'
import { SunMarker } from '@/components/map/SunMarker'
import { HillshadeLayer } from '@/components/map/HillshadeLayer'
import { formatBearing } from '@/utils/formatUtils'

export function MapPage() {
  useSunPosition()

  const coords = useAppStore((s) => s.location.coords)
  const sunPosition = useAppStore((s) => s.sunPosition)
  const [shadeVisible, setShadeVisible] = useState(true)

  if (!coords) return null

  const today = new Date()
  const az = sunPosition?.azimuthDeg ?? 180
  const alt = sunPosition?.altitudeDeg ?? 0
  const isNight = !sunPosition?.isAboveHorizon

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
        {shadeVisible && !isNight && (
          <HillshadeLayer sunAzimuthDeg={az} sunAltitudeDeg={alt} />
        )}
        <SunPathLayer coords={coords} date={today} />
        {sunPosition && (
          <SunMarker
            coords={coords}
            azimuthDeg={az}
            altitudeDeg={alt}
          />
        )}
      </MapContainer>

      {/* Sun info badge */}
      {sunPosition && (
        <div className="absolute top-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur rounded-xl px-3 py-2 text-sm border border-slate-700/60">
          <div className="text-xs text-slate-400">Sun · Live</div>
          <div className="font-bold text-orange-400">{formatBearing(az)}</div>
          <div className="text-xs text-slate-300">
            {sunPosition.isAboveHorizon
              ? `${Math.round(alt)}° above horizon`
              : 'Below horizon'}
          </div>
        </div>
      )}

      {/* Shade toggle */}
      <button
        onClick={() => setShadeVisible((v) => !v)}
        disabled={isNight}
        className={`absolute top-3 right-3 z-[1000] flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
          shadeVisible && !isNight
            ? 'bg-indigo-600/90 border-indigo-500/60 text-white'
            : 'bg-slate-900/90 border-slate-700/60 text-slate-400'
        } ${isNight ? 'opacity-40 cursor-not-allowed' : ''}`}
        title={isNight ? 'Sun is below the horizon' : 'Toggle terrain shading'}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />
        </svg>
        {isNight ? 'Night' : shadeVisible ? 'Shade on' : 'Shade off'}
      </button>

      {/* Legend */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-slate-900/90 backdrop-blur rounded-xl px-3 py-2 text-xs border border-slate-700/60 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-orange-500 rounded inline-block" />
          <span className="text-slate-300">Today's sun path</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
          <span className="text-slate-300">Sun direction</span>
        </div>
        {shadeVisible && !isNight && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded inline-block bg-indigo-900 border border-indigo-700" />
              <span className="text-slate-300">In shadow</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded inline-block bg-amber-300/40 border border-amber-500/40" />
              <span className="text-slate-300">In sunlight</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
