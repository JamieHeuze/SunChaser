import 'leaflet/dist/leaflet.css'
import { useState } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { format } from 'date-fns'
import { useAppStore } from '@/store/appStore'
import { getSunPosition, getSunTimes } from '@/utils/sunCalcUtils'
import { formatTime, formatCardinal } from '@/utils/formatUtils'
import { SunPathLayer } from '@/components/map/SunPathLayer'
import { SunMarker } from '@/components/map/SunMarker'
import { CompassRose } from '@/components/compass/CompassRose'
import { CompassNeedle } from '@/components/compass/CompassNeedle'

export function TripPlannerPage() {
  const coords = useAppStore((s) => s.location.coords)
  const plannerTimestamp = useAppStore((s) => s.plannerDate)
  const setPlannerDate = useAppStore((s) => s.setPlannerDate)

  const plannerDate = new Date(plannerTimestamp)

  const [dateStr, setDateStr] = useState(() => format(plannerDate, 'yyyy-MM-dd'))
  const [hour, setHour] = useState(() => plannerDate.getHours())
  const [minute, setMinute] = useState(() => plannerDate.getMinutes())

  const updateDate = (newDateStr: string, newHour: number, newMin: number) => {
    const [y, m, d] = newDateStr.split('-').map(Number)
    const dt = new Date(y, m - 1, d, newHour, newMin, 0, 0)
    setPlannerDate(dt)
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateStr(e.target.value)
    updateDate(e.target.value, hour, minute)
  }

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const h = parseInt(e.target.value)
    setHour(h)
    updateDate(dateStr, h, minute)
  }

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const m = parseInt(e.target.value)
    setMinute(m)
    updateDate(dateStr, hour, m)
  }

  if (!coords) return null

  const sunPos = getSunPosition(plannerDate, coords.lat, coords.lng)
  const sunTimes = getSunTimes(plannerDate, coords.lat, coords.lng)

  const az = sunPos.azimuthDeg
  const alt = sunPos.altitudeDeg
  const isAbove = sunPos.isAboveHorizon

  return (
    <div className="h-full overflow-y-auto bg-te-bg">
      <div className="max-w-lg mx-auto px-4 py-4 space-y-px">

        {/* Date selector */}
        <div className="border border-te-border bg-te-s1 px-4 py-3">
          <div className="te-label mb-2">DATE</div>
          <input
            type="date"
            value={dateStr}
            onChange={handleDateChange}
            className="w-full bg-te-s2 text-te-text border border-te-border px-3 py-2.5 te-label focus:border-te-orange focus:outline-none [color-scheme:dark]"
            style={{ fontSize: '11px', letterSpacing: '0.08em' }}
          />
        </div>

        {/* Time selector */}
        <div className="border border-te-border bg-te-s1 px-4 py-3">
          <div className="flex items-baseline justify-between mb-3">
            <div className="te-label">TIME</div>
            <div className="text-base font-medium text-te-text" style={{ fontFeatureSettings: '"tnum" 1' }}>
              {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="te-label text-te-dim mb-1.5">HOUR · {String(hour).padStart(2, '0')}</div>
              <input
                type="range"
                min={0}
                max={23}
                value={hour}
                onChange={handleHourChange}
                className="w-full h-px bg-te-border appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-te-orange [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-te-orange [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
              />
            </div>
            <div>
              <div className="te-label text-te-dim mb-1.5">MIN · {String(minute).padStart(2, '0')}</div>
              <input
                type="range"
                min={0}
                max={59}
                step={5}
                value={minute}
                onChange={handleMinuteChange}
                className="w-full h-px bg-te-border appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-te-orange [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-te-orange [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Sun readout */}
        <div className="border border-te-border bg-te-s1">
          <div className="grid grid-cols-3 divide-x divide-te-border">
            <div className="px-4 py-3">
              <div className="te-label mb-1">AZIMUTH</div>
              <div className="text-base font-medium text-te-orange" style={{ fontFeatureSettings: '"tnum" 1' }}>
                {String(Math.round(az)).padStart(3, '0')}°
              </div>
              <div className="te-label mt-0.5">{formatCardinal(az)}</div>
            </div>
            <div className="px-4 py-3">
              <div className="te-label mb-1">ALTITUDE</div>
              <div className={`text-base font-medium ${isAbove ? 'text-te-text' : 'text-te-dim'}`} style={{ fontFeatureSettings: '"tnum" 1' }}>
                {Math.round(alt)}°
              </div>
              <div className="te-label mt-0.5">{isAbove ? 'ABOVE' : 'BELOW'}</div>
            </div>
            <div className="px-4 py-3">
              <div className="te-label mb-1">STATUS</div>
              <div className={`text-base font-medium ${isAbove ? 'text-te-orange' : 'text-te-dim'}`}>
                {isAbove ? '◉' : '○'}
              </div>
              <div className="te-label mt-0.5">{isAbove ? 'DAYLIGHT' : 'NIGHT'}</div>
            </div>
          </div>

          {/* Times row */}
          <div className="border-t border-te-border grid grid-cols-3 divide-x divide-te-border">
            <div className="px-4 py-2.5">
              <div className="te-label text-te-dim mb-0.5">RISE</div>
              <div className="te-label text-te-text">{formatTime(sunTimes.sunrise)}</div>
            </div>
            <div className="px-4 py-2.5">
              <div className="te-label text-te-dim mb-0.5">NOON</div>
              <div className="te-label text-te-amber">{formatTime(sunTimes.solarNoon)}</div>
            </div>
            <div className="px-4 py-2.5">
              <div className="te-label text-te-dim mb-0.5">SET</div>
              <div className="te-label text-te-text">{formatTime(sunTimes.sunset)}</div>
            </div>
          </div>
        </div>

        {/* Mini compass */}
        <div className="border border-te-border bg-te-s1 px-4 py-3">
          <div className="te-label mb-3">COMPASS PREVIEW</div>
          <div className="relative w-full max-w-[200px] mx-auto aspect-square">
            <CompassRose rotation={0} />
            <CompassNeedle azimuthDeg={az} altitudeDeg={alt} />
          </div>
        </div>

        {/* Mini map */}
        <div className="border border-te-border bg-te-s1 overflow-hidden">
          <div className="te-label px-4 pt-3 pb-2">MAP PREVIEW</div>
          <div style={{ height: '220px' }}>
            <MapContainer
              center={[coords.lat, coords.lng]}
              zoom={10}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                subdomains="abcd"
                maxZoom={19}
              />
              <SunPathLayer coords={coords} date={plannerDate} />
              <SunMarker
                coords={coords}
                azimuthDeg={az}
                altitudeDeg={alt}
              />
            </MapContainer>
          </div>
        </div>

        {/* Bottom padding */}
        <div className="h-4" />
      </div>
    </div>
  )
}
