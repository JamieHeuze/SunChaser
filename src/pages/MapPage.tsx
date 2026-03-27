import 'leaflet/dist/leaflet.css'
import { useState } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { useAppStore } from '@/store/appStore'
import { useSunPosition } from '@/hooks/useSunPosition'
import { SunPathLayer } from '@/components/map/SunPathLayer'
import { SunMarker } from '@/components/map/SunMarker'
import { HillshadeLayer } from '@/components/map/HillshadeLayer'
import { UserLocationLayer } from '@/components/map/UserLocationLayer'
import { formatBearing } from '@/utils/formatUtils'

export function MapPage() {
  useSunPosition()

  const coords = useAppStore((s) => s.location.coords)
  const sunPosition = useAppStore((s) => s.sunPosition)
  const heading = useAppStore((s) => s.deviceOrientation.heading)
  const [shadeVisible, setShadeVisible] = useState(true)

  if (!coords) return null

  const az = sunPosition?.azimuthDeg ?? 180
  const alt = sunPosition?.altitudeDeg ?? 0
  const isNight = !sunPosition?.isAboveHorizon

  return (
    <div className="relative h-full">
      <MapContainer
        center={[coords.lat, coords.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        {/* CartoDB Dark Matter — clean minimal dark base */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        {/* Terrain hillshade overlay */}
        {shadeVisible && !isNight && (
          <HillshadeLayer sunAzimuthDeg={az} sunAltitudeDeg={alt} />
        )}

        {/* Today's sun arc */}
        <SunPathLayer coords={coords} date={new Date()} />

        {/* Directional sun marker */}
        {sunPosition && (
          <SunMarker coords={coords} azimuthDeg={az} altitudeDeg={alt} />
        )}

        {/* User location + heading cone */}
        <UserLocationLayer />
      </MapContainer>

      {/* ── Top-left: sun info ── */}
      {sunPosition && (
        <div className="absolute top-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-sm rounded-xl px-3 py-2.5 text-sm border border-slate-700/60 shadow-lg">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Sun · Live</div>
          <div className="font-bold text-orange-400 text-base">{formatBearing(az)}</div>
          <div className="text-xs text-slate-300 mt-0.5">
            {sunPosition.isAboveHorizon
              ? `${Math.round(alt)}° above horizon`
              : 'Below horizon'}
          </div>
        </div>
      )}

      {/* ── Top-right: your heading ── */}
      <div className="absolute top-3 right-3 z-[1000] bg-slate-900/90 backdrop-blur-sm rounded-xl px-3 py-2.5 text-sm border border-slate-700/60 shadow-lg text-center min-w-[72px]">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Facing</div>
        {heading !== null ? (
          <>
            <div className="font-bold text-blue-400 text-base">{Math.round(heading)}°</div>
            <div className="text-xs text-slate-400">{bearingLabel(heading)}</div>
          </>
        ) : (
          <div className="text-xs text-slate-500 mt-1">No compass</div>
        )}
      </div>

      {/* ── Bottom controls ── */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000] flex items-end justify-between gap-2">
        {/* Legend */}
        <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl px-3 py-2 text-xs border border-slate-700/60 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-orange-500 rounded inline-block" />
            <span className="text-slate-300">Sun path</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block flex-shrink-0" />
            <span className="text-slate-300">Sun direction</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block flex-shrink-0" />
            <span className="text-slate-300">Your location</span>
          </div>
          {heading !== null && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded border border-blue-400/60 bg-blue-500/15 inline-block flex-shrink-0" />
              <span className="text-slate-300">Looking toward</span>
            </div>
          )}
          {shadeVisible && !isNight && (
            <>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded inline-block bg-amber-400/50 border border-amber-500/40 flex-shrink-0" />
                <span className="text-slate-300">Sunlit</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded inline-block bg-indigo-900/80 border border-indigo-700/60 flex-shrink-0" />
                <span className="text-slate-300">In shadow</span>
              </div>
            </>
          )}
        </div>

        {/* Shade toggle */}
        <button
          onClick={() => setShadeVisible((v) => !v)}
          disabled={isNight}
          className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-medium border transition-colors shadow-lg ${
            shadeVisible && !isNight
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
              : 'bg-slate-900/90 border-slate-700/60 text-slate-400'
          } ${isNight ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" fill={shadeVisible && !isNight ? 'currentColor' : 'none'} />
          </svg>
          {isNight ? 'Night' : shadeVisible ? 'Shade on' : 'Shade off'}
        </button>
      </div>
    </div>
  )
}

function bearingLabel(deg: number): string {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
  return dirs[Math.round(deg / 22.5) % 16]
}
