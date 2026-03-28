import { format, differenceInSeconds, differenceInMinutes, differenceInHours } from 'date-fns'

export function formatTime(date: Date | null): string {
  if (!date) return '--:--'
  return format(date, 'HH:mm')
}

export function formatBearing(azimuthDeg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const index = Math.round(azimuthDeg / 22.5) % 16
  return `${dirs[index]} · ${Math.round(azimuthDeg)}°`
}

export function formatCardinal(azimuthDeg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return dirs[Math.round(azimuthDeg / 22.5) % 16]
}

export function formatAltitude(altitudeDeg: number): string {
  return `${Math.round(altitudeDeg)}°`
}

export function formatCountdown(target: Date | null): string {
  if (!target) return '--'
  const now = new Date()
  const diffSec = differenceInSeconds(target, now)
  if (diffSec < 0) return 'passed'
  const hours = differenceInHours(target, now)
  const minutes = differenceInMinutes(target, now) % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function formatDayProgress(
  sunrise: Date | null,
  sunset: Date | null,
  now: Date = new Date()
): number {
  if (!sunrise || !sunset) return 0
  const total = differenceInSeconds(sunset, sunrise)
  const elapsed = differenceInSeconds(now, sunrise)
  return Math.min(100, Math.max(0, (elapsed / total) * 100))
}
