import SunCalc from 'suncalc'
import type { SunPosition, SunTimes } from '@/store/types'

export function getSunPosition(date: Date, lat: number, lng: number): SunPosition {
  const pos = SunCalc.getPosition(date, lat, lng)
  // suncalc azimuth: 0=south, positive goes west. Add π to shift origin to north.
  const azimuthDeg = (((pos.azimuth + Math.PI) * 180) / Math.PI + 360) % 360
  const altitudeDeg = (pos.altitude * 180) / Math.PI
  return {
    azimuthDeg,
    altitudeDeg,
    isAboveHorizon: altitudeDeg > -0.833, // account for atmospheric refraction
  }
}

export function getSunTimes(date: Date, lat: number, lng: number): SunTimes {
  const t = SunCalc.getTimes(date, lat, lng)
  const nullIfInvalid = (d: Date): Date | null =>
    isNaN(d.getTime()) ? null : d

  return {
    sunrise: nullIfInvalid(t.sunrise),
    sunset: nullIfInvalid(t.sunset),
    goldenHourMorningEnd: nullIfInvalid(t.goldenHourEnd),
    goldenHourEveningStart: nullIfInvalid(t.goldenHour),
    solarNoon: nullIfInvalid(t.solarNoon),
    civilDawn: nullIfInvalid(t.dawn),
    civilDusk: nullIfInvalid(t.dusk),
  }
}

export interface SunPathPoint {
  time: Date
  azimuthDeg: number
  altitudeDeg: number
}

export function getSunPathPoints(
  date: Date,
  lat: number,
  lng: number,
  stepMinutes = 10
): SunPathPoint[] {
  const points: SunPathPoint[] = []
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  for (let m = 0; m < 1440; m += stepMinutes) {
    const t = new Date(start.getTime() + m * 60_000)
    const pos = getSunPosition(t, lat, lng)
    points.push({ time: t, azimuthDeg: pos.azimuthDeg, altitudeDeg: pos.altitudeDeg })
  }
  return points
}

export function azimuthToLatLng(
  centerLat: number,
  centerLng: number,
  azimuthDeg: number,
  radiusDeg = 0.25
): [number, number] {
  const azRad = (azimuthDeg * Math.PI) / 180
  const dlat = radiusDeg * Math.cos(azRad)
  const dlng = (radiusDeg * Math.sin(azRad)) / Math.cos((centerLat * Math.PI) / 180)
  return [centerLat + dlat, centerLng + dlng]
}
