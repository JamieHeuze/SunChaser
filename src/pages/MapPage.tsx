import 'leaflet/dist/leaflet.css'
import { useState } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { useAppStore } from '@/store/appStore'
import { useSunPosition } from '@/hooks/useSunPosition'
import { SunPathLayer } from '@/components/map/SunPathLayer'
import { SunMarker } from '@/components/map/SunMarker'
import { HillshadeLayer } from '@/components/map/HillshadeLayer'
import { UserLocationLayer } from '@/components/map/UserLocationLayer'
import { formatCardinal } from '@/utils/formatUtils'

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
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />
        {shadeVisible && !isNight && (
          <HillshadeLayer sunAzimuthDeg={az} sunAltitudeDeg={alt} />
        )}
        <SunPathLayer coords={coords} date={new Date()} />
        {sunPosition && (
          <SunMarker coords={coords} azimuthDeg={az} altitudeDeg={alt} />
        )}
        <UserLocationLayer />
      </MapContainer>

      {/* Top-left: sun data */}
      {sunPosition && (
        <div className="absolute top-3 left-3 z-[1000] bg-te-bg/95 border border-te-border px-3 py-2.5 shadow-lg">
          <div className="te-label mb-1">SUN · LIVE</div>
          <div className="text-base font-medium text-te-orange" style={{ fontFeatureSettings: '"tnum" 1' }}>
            {String(Math.round(az)).padStart(3, '0')}° {formatCardinal(az)}
          </div>
          <div className="te-label mt-0.5">
            {sunPosition.isAboveHorizon ? `${Math.round(alt)}° ABOVE` : 'BELOW HORIZON'}
          </div>
        </div>
      )}

      {/* Top-right: heading */}
      <div className="absolute top-3 right-3 z-[1000] bg-te-bg/95 border border-te-border px-3 py-2.5 shadow-lg text-center">
        <div className="te-label mb-1">FACING</div>
        {heading !== null ? (
          <>
            <div className="text-base font-medium text-te-blue" style={{ fontFeatureSettings: '"tnum" 1' }}>
              {String(Math.round(heading)).padStart(3, '0')}°
            </div>
            <div className="te-label mt-0.5">{formatCardinal(heading)}</div>
          </>
        ) : (
          <div className="te-label text-te-dim mt-1">NO DATA</div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000] flex items-end justify-between gap-2">
        {/* Legend */}
        <div className="bg-te-bg/95 border border-te-border px-3 py-2 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-4 h-[1px] bg-te-orange inline-block" />
            <span className="te-label">SUN PATH</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block flex-shrink-0" />
            <span className="te-label">SUN DIRECTION</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-te-blue inline-block flex-shrink-0" />
            <span className="te-label">YOUR POSITION</span>
          </div>
          {shadeVisible && !isNight && (
            <>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#ffb32266] border border-[#ffaa0044] inline-block flex-shrink-0" />
                <span className="te-label">SUNLIT</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#08080a] border border-[#333344] inline-block flex-shrink-0" />
                <span className="te-label">SHADOW</span>
              </div>
            </>
          )}
        </div>

        {/* Shade toggle */}
        <button
          onClick={() => setShadeVisible((v) => !v)}
          disabled={isNight}
          className={`flex flex-col items-center gap-1 px-3 py-2 border te-label transition-colors ${
            shadeVisible && !isNight
              ? 'border-te-orange text-te-orange bg-te-bg/95'
              : 'border-te-border text-te-dim bg-te-bg/95'
          } ${isNight ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <span className="text-sm">◑</span>
          {isNight ? 'NIGHT' : shadeVisible ? 'SHADE ON' : 'SHADE OFF'}
        </button>
      </div>
    </div>
  )
}
