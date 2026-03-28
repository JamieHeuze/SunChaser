import 'leaflet/dist/leaflet.css'
import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { format } from 'date-fns'
import { useAppStore } from '@/store/appStore'
import { getSunPosition, getSunTimes, getSunPathPoints } from '@/utils/sunCalcUtils'
import { formatTime, formatCardinal } from '@/utils/formatUtils'
import { SunPathLayer } from '@/components/map/SunPathLayer'
import { SunMarker } from '@/components/map/SunMarker'
import { CompassRose } from '@/components/compass/CompassRose'
import { CompassNeedle } from '@/components/compass/CompassNeedle'

// ── Day Cinema ────────────────────────────────────────────────────────────────

function DayCinema({
  onTimeChange,
  onSliderChange,
  currentMinute,
}: {
  onTimeChange: (updater: (prev: number) => number) => void
  onSliderChange: (val: number) => void
  currentMinute: number
}) {
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(10) // minutes per step
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        onTimeChange((prev: number) => (prev + speed) % 1440)
      }, 80)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [playing, speed, onTimeChange])

  const h = Math.floor(currentMinute / 60)
  const m = currentMinute % 60

  return (
    <div className="border border-te-border bg-te-s1">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-te-border">
        <div className="te-label">DAY CINEMA</div>
        <div className="text-base font-medium text-te-orange" style={{ fontFeatureSettings: '"tnum" 1', fontSize: '16px' }}>
          {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}
        </div>
      </div>

      {/* Timeline scrubber */}
      <div className="px-4 py-3">
        <input
          type="range"
          min={0}
          max={1439}
          value={currentMinute}
          onChange={(e) => onSliderChange(parseInt(e.target.value))}
          className="w-full h-px bg-te-border appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-te-orange [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-te-orange [&::-moz-range-thumb]:border-0"
        />
        {/* Time labels */}
        <div className="flex justify-between mt-1.5">
          {['00', '06', '12', '18', '24'].map((t) => (
            <span key={t} className="te-label text-te-dim">{t}</span>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 px-4 pb-3">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="border border-te-border px-4 py-1.5 te-label transition-colors"
          style={{
            color: playing ? '#ff6600' : '#e8e8e8',
            borderColor: playing ? '#ff6600' : '#222222',
            background: playing ? 'rgba(255,102,0,0.1)' : '#111111',
          }}
        >
          {playing ? '■ STOP' : '▶ PLAY'}
        </button>

        <div className="flex items-center gap-1 ml-auto">
          <span className="te-label text-te-dim">SPEED</span>
          {[5, 10, 30, 60].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className="border px-2 py-1 te-label transition-colors"
              style={{
                borderColor: speed === s ? '#ff6600' : '#222222',
                color: speed === s ? '#ff6600' : '#686868',
                background: speed === s ? 'rgba(255,102,0,0.08)' : '#111111',
              }}
            >
              {s}m
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Bearing Finder ────────────────────────────────────────────────────────────

function BearingFinder({ coords, date }: { coords: { lat: number; lng: number }; date: Date }) {
  const [targetBearing, setTargetBearing] = useState(0)
  const tolerance = 8 // degrees

  // Sample sun path at 2-min intervals for precision
  const points = getSunPathPoints(date, coords.lat, coords.lng, 2)

  // Find windows where sun azimuth is within tolerance of target
  type Window = { start: Date; end: Date; azimuth: number }
  const windows: Window[] = []
  let inWindow = false
  let windowStart: Date | null = null

  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    const diff = Math.abs(((p.azimuthDeg - targetBearing + 540) % 360) - 180)
    const match = p.altitudeDeg > 0 && diff <= tolerance

    if (match && !inWindow) {
      inWindow = true
      windowStart = p.time
    } else if (!match && inWindow && windowStart) {
      windows.push({ start: windowStart, end: points[i - 1].time, azimuth: p.azimuthDeg })
      inWindow = false
      windowStart = null
    }
  }
  if (inWindow && windowStart) {
    windows.push({ start: windowStart, end: points[points.length - 1].time, azimuth: targetBearing })
  }

  const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

  return (
    <div className="border border-te-border bg-te-s1">
      <div className="px-4 pt-3 pb-2 border-b border-te-border">
        <div className="te-label">BEARING FINDER</div>
        <div className="te-label text-te-dim mt-0.5">Find when sun faces a direction</div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Target bearing input */}
        <div>
          <div className="te-label text-te-dim mb-2">TARGET BEARING</div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={359}
              value={targetBearing}
              onChange={(e) => setTargetBearing(parseInt(e.target.value))}
              className="flex-1 h-px bg-te-border appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-te-orange [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-te-orange [&::-moz-range-thumb]:border-0"
            />
            <div className="text-base font-medium text-te-orange shrink-0" style={{ fontFeatureSettings: '"tnum" 1', fontSize: '16px', minWidth: '60px', textAlign: 'right' }}>
              {String(targetBearing).padStart(3, '0')}°
            </div>
          </div>
          {/* Cardinal presets */}
          <div className="flex gap-1 mt-2">
            {cardinals.map((c, i) => {
              const deg = i * 45
              return (
                <button
                  key={c}
                  onClick={() => setTargetBearing(deg)}
                  className="flex-1 py-1 border te-label transition-colors"
                  style={{
                    borderColor: Math.abs(targetBearing - deg) < 22 ? '#ff6600' : '#222222',
                    color: Math.abs(targetBearing - deg) < 22 ? '#ff6600' : '#686868',
                    background: '#111111',
                  }}
                >
                  {c}
                </button>
              )
            })}
          </div>
        </div>

        {/* Results */}
        <div>
          <div className="te-label text-te-dim mb-2">
            SUN WITHIN ±{tolerance}° OF {formatCardinal(targetBearing)} · {targetBearing}°
          </div>
          {windows.length === 0 ? (
            <div className="border border-te-border bg-te-bg px-3 py-2">
              <div className="te-label text-te-muted">NO MATCH TODAY</div>
            </div>
          ) : (
            <div className="space-y-px">
              {windows.map((w, i) => (
                <div key={i} className="grid grid-cols-2 border border-te-border bg-te-bg">
                  <div className="px-3 py-2 border-r border-te-border">
                    <div className="te-label text-te-dim">FROM</div>
                    <div className="te-label text-te-orange">{formatTime(w.start)}</div>
                  </div>
                  <div className="px-3 py-2">
                    <div className="te-label text-te-dim">TO</div>
                    <div className="te-label text-te-orange">{formatTime(w.end)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function TripPlannerPage() {
  const coords = useAppStore((s) => s.location.coords)
  const plannerTimestamp = useAppStore((s) => s.plannerDate)
  const setPlannerDate = useAppStore((s) => s.setPlannerDate)

  const plannerDate = new Date(plannerTimestamp)

  const [dateStr, setDateStr] = useState(() => format(plannerDate, 'yyyy-MM-dd'))
  // Store total minutes since midnight for cinema
  const [dayMinute, setDayMinute] = useState(() => plannerDate.getHours() * 60 + plannerDate.getMinutes())

  const updateDate = (newDateStr: string, newMinute: number) => {
    const [y, m, d] = newDateStr.split('-').map(Number)
    const h = Math.floor(newMinute / 60)
    const min = newMinute % 60
    const dt = new Date(y, m - 1, d, h, min, 0, 0)
    setPlannerDate(dt)
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateStr(e.target.value)
    updateDate(e.target.value, dayMinute)
  }

  const handleTimeChange = (updater: (prev: number) => number) => {
    setDayMinute((prev) => {
      const next = updater(prev)
      updateDate(dateStr, next)
      return next
    })
  }

  const handleSliderChange = (val: number) => {
    handleTimeChange(() => val)
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
            className="w-full bg-te-s2 text-te-text border border-te-border px-3 py-2.5 focus:border-te-orange focus:outline-none [color-scheme:dark]"
            style={{ fontSize: '13px', letterSpacing: '0.06em', fontFamily: 'inherit' }}
          />
        </div>

        {/* Day Cinema scrubber */}
        <DayCinema
          onTimeChange={handleTimeChange}
          onSliderChange={handleSliderChange}
          currentMinute={dayMinute}
        />

        {/* Sun readout */}
        <div className="border border-te-border bg-te-s1">
          <div className="grid grid-cols-3 divide-x divide-te-border">
            <div className="px-4 py-3">
              <div className="te-label mb-1">AZIMUTH</div>
              <div className="text-lg font-medium text-te-orange" style={{ fontFeatureSettings: '"tnum" 1' }}>
                {String(Math.round(az)).padStart(3, '0')}°
              </div>
              <div className="te-label mt-0.5">{formatCardinal(az)}</div>
            </div>
            <div className="px-4 py-3">
              <div className="te-label mb-1">ALTITUDE</div>
              <div className={`text-lg font-medium ${isAbove ? 'text-te-text' : 'text-te-dim'}`} style={{ fontFeatureSettings: '"tnum" 1' }}>
                {Math.round(alt)}°
              </div>
              <div className="te-label mt-0.5">{isAbove ? 'ABOVE' : 'BELOW'}</div>
            </div>
            <div className="px-4 py-3">
              <div className="te-label mb-1">STATUS</div>
              <div className={`text-lg font-medium ${isAbove ? 'text-te-orange' : 'text-te-dim'}`}>
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

        {/* Bearing Finder */}
        <BearingFinder coords={coords} date={plannerDate} />

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
              <SunMarker coords={coords} azimuthDeg={az} altitudeDeg={alt} />
            </MapContainer>
          </div>
        </div>

        <div className="h-4" />
      </div>
    </div>
  )
}
