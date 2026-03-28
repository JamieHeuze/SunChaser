import { useEffect, useRef, useMemo, useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { getSunTimes } from '@/utils/sunCalcUtils'
import { formatTime } from '@/utils/formatUtils'

// Canvas dimensions (internal resolution)
const CANVAS_W = 365
const CANVAS_H = 270  // represents 24h → 270px (each hour ≈ 11.25px)
const HOUR_PX = CANVAS_H / 24

// Map a time to canvas Y coordinate
function timeToY(date: Date | null): number | null {
  if (!date) return null
  const h = date.getHours() + date.getMinutes() / 60
  return h * HOUR_PX
}

// Color palette
const C_NIGHT      = [9,   9,   9]    as const
const C_CIVIL      = [12,  22,  50]   as const   // very dark blue
const C_BLUE       = [15,  45, 100]   as const   // blue hour
const C_GOLDEN     = [140,  50,   0]  as const   // deep orange
const C_DAY        = [28,  25,  12]   as const   // very dark warm
const C_NOON       = [60,  55,  20]   as const   // warmer peak

function lerp(a: readonly [number,number,number], b: readonly [number,number,number], t: number) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ] as const
}

interface DayData {
  dawn: number | null      // Y positions
  sunrise: number | null
  goldenEnd: number | null
  noon: number | null
  goldenStart: number | null
  sunset: number | null
  dusk: number | null
}

export function CalendarPage() {
  const coords = useAppStore((s) => s.location.coords)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const year = new Date().getFullYear()

  // Precompute 365 days of sun times
  const yearData: DayData[] = useMemo(() => {
    if (!coords) return []
    const data: DayData[] = []
    for (let d = 0; d < 365; d++) {
      const date = new Date(year, 0, d + 1, 12, 0, 0)
      const t = getSunTimes(date, coords.lat, coords.lng)
      data.push({
        dawn:        timeToY(t.civilDawn),
        sunrise:     timeToY(t.sunrise),
        goldenEnd:   timeToY(t.goldenHourMorningEnd),
        noon:        timeToY(t.solarNoon),
        goldenStart: timeToY(t.goldenHourEveningStart),
        sunset:      timeToY(t.sunset),
        dusk:        timeToY(t.civilDusk),
      })
    }
    return data
  }, [coords, year])

  // Render solargraph to canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || yearData.length === 0) return
    const ctx = canvas.getContext('2d')!
    const imgData = ctx.createImageData(CANVAS_W, CANVAS_H)
    const px = imgData.data

    for (let x = 0; x < Math.min(CANVAS_W, yearData.length); x++) {
      const d = yearData[x]

      for (let y = 0; y < CANVAS_H; y++) {
        const idx = (y * CANVAS_W + x) * 4

        // Determine color based on which band this pixel falls in
        let color: readonly [number, number, number] = C_NIGHT

        if (d.dawn !== null && d.dusk !== null && y >= d.dawn && y <= d.dusk) {
          // Within civil twilight window
          if (d.sunrise !== null && d.sunset !== null && y >= d.sunrise && y <= d.sunset) {
            // Above horizon (daytime)
            if (d.goldenEnd !== null && y <= d.goldenEnd) {
              // Morning golden hour
              const t = d.sunrise !== null ? (y - d.sunrise) / Math.max(1, d.goldenEnd - d.sunrise) : 0
              color = lerp(C_GOLDEN, C_DAY, t)
            } else if (d.goldenStart !== null && y >= d.goldenStart) {
              // Evening golden hour
              const t = d.sunset !== null ? (y - d.goldenStart) / Math.max(1, d.sunset - d.goldenStart) : 0
              color = lerp(C_DAY, C_GOLDEN, t)
            } else if (d.noon !== null) {
              // Daytime – warm near noon
              const halfDay = Math.max(1, (d.goldenStart ?? d.sunset ?? d.noon) - (d.goldenEnd ?? d.sunrise ?? d.noon))
              const dist = Math.abs(y - d.noon) / halfDay
              color = lerp(C_NOON, C_DAY, Math.min(dist * 1.5, 1))
            } else {
              color = C_DAY
            }
          } else {
            // Civil twilight (blue hour)
            if (d.sunrise !== null && y < d.sunrise) {
              const t = (y - d.dawn!) / Math.max(1, d.sunrise - d.dawn!)
              color = lerp(C_CIVIL, C_BLUE, t)
            } else if (d.sunset !== null && y > d.sunset) {
              const t = (y - d.sunset) / Math.max(1, d.dusk! - d.sunset)
              color = lerp(C_BLUE, C_CIVIL, t)
            } else {
              color = C_CIVIL
            }
          }
        }

        px[idx]     = color[0]
        px[idx + 1] = color[1]
        px[idx + 2] = color[2]
        px[idx + 3] = 255
      }
    }

    ctx.putImageData(imgData, 0, 0)

    // Draw month separators
    ctx.strokeStyle = 'rgba(255,102,0,0.25)'
    ctx.lineWidth = 1
    const monthStarts = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
    monthStarts.forEach((d) => {
      ctx.beginPath()
      ctx.moveTo(d, 0)
      ctx.lineTo(d, CANVAS_H)
      ctx.stroke()
    })

    // Draw today marker
    const today = new Date()
    const dayOfYear = Math.floor((today.getTime() - new Date(year, 0, 1).getTime()) / 86400000)
    if (dayOfYear >= 0 && dayOfYear < 365) {
      ctx.strokeStyle = '#ff6600'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(dayOfYear, 0)
      ctx.lineTo(dayOfYear, CANVAS_H)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }, [yearData, year])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const scaleX = CANVAS_W / rect.width
    const dayIdx = Math.floor((e.clientX - rect.left) * scaleX)
    const clamped = Math.max(0, Math.min(364, dayIdx))

    if (coords) {
      const date = new Date(year, 0, clamped + 1, 12, 0, 0)
      const t = getSunTimes(date, coords.lat, coords.lng)
      setSelectedDayDetail({
        date,
        sunrise: t.sunrise,
        sunset: t.sunset,
        goldenMorning: t.goldenHourMorningEnd,
        goldenEvening: t.goldenHourEveningStart,
        civilDawn: t.civilDawn,
        civilDusk: t.civilDusk,
        solarNoon: t.solarNoon,
      })
    }
  }

  const [selectedDayDetail, setSelectedDayDetail] = useState<{
    date: Date
    sunrise: Date | null
    sunset: Date | null
    goldenMorning: Date | null
    goldenEvening: Date | null
    civilDawn: Date | null
    civilDusk: Date | null
    solarNoon: Date | null
  } | null>(null)

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

  // Compute daylight hours for stats
  const daylightStats = useMemo(() => {
    if (!coords) return null
    const today = new Date()
    const todayIdx = Math.floor((today.getTime() - new Date(year, 0, 1).getTime()) / 86400000)
    const todaySunTimes = getSunTimes(today, coords.lat, coords.lng)

    let maxMinutes = 0
    let maxDay = 0
    let minMinutes = 24 * 60
    let minDay = 0

    for (let d = 0; d < 365; d++) {
      const date = new Date(year, 0, d + 1, 12, 0, 0)
      const t = getSunTimes(date, coords.lat, coords.lng)
      if (t.sunrise && t.sunset) {
        const mins = (t.sunset.getTime() - t.sunrise.getTime()) / 60000
        if (mins > maxMinutes) { maxMinutes = mins; maxDay = d }
        if (mins < minMinutes) { minMinutes = mins; minDay = d }
      }
    }

    const todayMins = todaySunTimes.sunrise && todaySunTimes.sunset
      ? (todaySunTimes.sunset.getTime() - todaySunTimes.sunrise.getTime()) / 60000
      : null

    return { maxDay, minDay, maxMinutes, minMinutes, todayMins, todayIdx }
  }, [coords, year])

  if (!coords) {
    return (
      <div className="flex items-center justify-center h-full bg-te-bg">
        <div className="te-label text-te-muted">NO LOCATION SET</div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-te-bg">
      <div className="px-4 py-4 space-y-px">

        {/* Header stats */}
        {daylightStats && (
          <div className="border border-te-border bg-te-s1">
            <div className="grid grid-cols-3 divide-x divide-te-border">
              <div className="px-3 py-2.5">
                <div className="te-label text-te-dim mb-1">TODAY</div>
                <div className="te-label text-te-orange">
                  {daylightStats.todayMins !== null
                    ? `${Math.floor(daylightStats.todayMins / 60)}h ${Math.round(daylightStats.todayMins % 60)}m`
                    : '--'}
                </div>
              </div>
              <div className="px-3 py-2.5">
                <div className="te-label text-te-dim mb-1">LONGEST</div>
                <div className="te-label text-te-text">
                  {new Date(year, 0, daylightStats.maxDay + 1).toLocaleDateString('en', { month: 'short', day: 'numeric' }).toUpperCase()}
                </div>
              </div>
              <div className="px-3 py-2.5">
                <div className="te-label text-te-dim mb-1">SHORTEST</div>
                <div className="te-label text-te-text">
                  {new Date(year, 0, daylightStats.minDay + 1).toLocaleDateString('en', { month: 'short', day: 'numeric' }).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Solargraph canvas */}
        <div className="border border-te-border bg-te-s1">
          <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
            <div className="te-label">{year} SOLARGRAPH</div>
            <div className="te-label text-te-dim">TAP DAY FOR DETAILS</div>
          </div>

          {/* Month labels */}
          <div className="flex px-0" style={{ paddingLeft: '12px', paddingRight: '12px' }}>
            {months.map((m) => (
              <div key={m} className="flex-1 te-label text-te-dim" style={{ fontSize: '9px' }}>{m}</div>
            ))}
          </div>

          {/* Canvas */}
          <div className="px-3 pb-2">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              onClick={handleCanvasClick}
              className="w-full cursor-crosshair"
              style={{ imageRendering: 'pixelated', display: 'block' }}
            />
          </div>

          {/* Y-axis time labels */}
          <div className="flex justify-between px-3 pb-2">
            {['00:00', '06:00', '12:00', '18:00', '24:00'].map((t) => (
              <span key={t} className="te-label text-te-dim" style={{ fontSize: '9px' }}>{t}</span>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-3 pb-2.5">
            {[
              { color: '#0a1632', label: 'BLUE HOUR' },
              { color: '#8c3200', label: 'GOLDEN' },
              { color: '#1c1a0c', label: 'DAYLIGHT' },
              { color: '#ff6600', label: 'TODAY', dashed: true },
            ].map(({ color, label, dashed }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-2"
                  style={{
                    background: color,
                    border: dashed ? '1px dashed #ff6600' : `1px solid ${color}`,
                  }}
                />
                <span className="te-label text-te-dim" style={{ fontSize: '9px' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected day detail */}
        {selectedDayDetail && (
          <div className="border border-te-orange bg-te-s1">
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-te-border">
              <div className="te-label text-te-orange">
                {selectedDayDetail.date.toLocaleDateString('en', {
                  weekday: 'short', month: 'long', day: 'numeric'
                }).toUpperCase()}
              </div>
              <button
                onClick={() => setSelectedDayDetail(null)}
                className="te-label text-te-dim hover:text-te-text"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-px p-px bg-te-border">
              {[
                { label: 'CIVIL DAWN',    time: selectedDayDetail.civilDawn,    color: '#0099ff' },
                { label: 'SUNRISE',       time: selectedDayDetail.sunrise,       color: '#ff6600' },
                { label: 'GOLDEN END',    time: selectedDayDetail.goldenMorning, color: '#ffaa00' },
                { label: 'SOLAR NOON',    time: selectedDayDetail.solarNoon,     color: '#e8e8e8' },
                { label: 'GOLDEN START',  time: selectedDayDetail.goldenEvening, color: '#ffaa00' },
                { label: 'SUNSET',        time: selectedDayDetail.sunset,        color: '#ff6600' },
                { label: 'CIVIL DUSK',    time: selectedDayDetail.civilDusk,     color: '#0099ff' },
                {
                  label: 'DAYLIGHT',
                  time: null,
                  custom: selectedDayDetail.sunrise && selectedDayDetail.sunset
                    ? (() => {
                        const m = (selectedDayDetail.sunset.getTime() - selectedDayDetail.sunrise.getTime()) / 60000
                        return `${Math.floor(m / 60)}h ${Math.round(m % 60)}m`
                      })()
                    : '--',
                  color: '#e8e8e8',
                },
              ].map(({ label, time, custom, color }) => (
                <div key={label} className="bg-te-s1 px-3 py-2">
                  <div className="te-label text-te-dim mb-0.5">{label}</div>
                  <div className="te-label" style={{ color }}>
                    {custom ?? formatTime(time)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  )
}
