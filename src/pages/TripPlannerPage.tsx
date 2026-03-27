import 'leaflet/dist/leaflet.css'
import { useState } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { format } from 'date-fns'
import { useAppStore } from '@/store/appStore'
import { getSunPosition, getSunTimes } from '@/utils/sunCalcUtils'
import { formatTime, formatBearing } from '@/utils/formatUtils'
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

  return (
    <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">
      <h2 className="text-lg font-semibold text-white">Trip Planner</h2>
      <p className="text-slate-400 text-sm -mt-2">Pick a date &amp; time to preview the sun's position</p>

      {/* Date & time picker */}
      <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/50 space-y-4">
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Date</label>
          <input
            type="date"
            value={dateStr}
            onChange={handleDateChange}
            className="w-full bg-slate-700 text-white rounded-xl py-2.5 px-3 text-sm border border-slate-600 focus:border-orange-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">
            Time — {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min={0}
              max={23}
              value={hour}
              onChange={handleHourChange}
              className="w-full accent-orange-500"
            />
            <input
              type="range"
              min={0}
              max={59}
              step={5}
              value={minute}
              onChange={handleMinuteChange}
              className="w-full accent-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Sun info for selected time */}
      <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/50 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Sun at this time</p>
            <p className="text-2xl font-bold text-white mt-0.5">{formatBearing(sunPos.azimuthDeg)}</p>
            <p className={`text-sm font-medium ${sunPos.isAboveHorizon ? 'text-orange-400' : 'text-slate-400'}`}>
              {sunPos.isAboveHorizon
                ? `${Math.round(sunPos.altitudeDeg)}° above horizon`
                : 'Below horizon'}
            </p>
          </div>
          <div className="text-right text-sm space-y-1">
            <div className="text-slate-300">
              🌅 {formatTime(sunTimes.sunrise)}
            </div>
            <div className="text-yellow-300">
              ☀ {formatTime(sunTimes.solarNoon)}
            </div>
            <div className="text-slate-300">
              🌇 {formatTime(sunTimes.sunset)}
            </div>
          </div>
        </div>
      </div>

      {/* Mini compass */}
      <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/50">
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Compass Preview</p>
        <div className="relative w-full max-w-[200px] mx-auto aspect-square">
          <CompassRose rotation={0} />
          <CompassNeedle azimuthDeg={sunPos.azimuthDeg} altitudeDeg={sunPos.altitudeDeg} />
        </div>
      </div>

      {/* Mini map */}
      <div className="bg-slate-800/80 rounded-2xl overflow-hidden border border-slate-700/50">
        <p className="text-xs text-slate-400 uppercase tracking-wider px-4 pt-3 pb-2">Map Preview</p>
        <div style={{ height: '220px' }}>
          <MapContainer
            center={[coords.lat, coords.lng]}
            zoom={10}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
            />
            <SunPathLayer coords={coords} date={plannerDate} />
            <SunMarker
              coords={coords}
              azimuthDeg={sunPos.azimuthDeg}
              altitudeDeg={sunPos.altitudeDeg}
            />
          </MapContainer>
        </div>
      </div>
    </div>
  )
}
