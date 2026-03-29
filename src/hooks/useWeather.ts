import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { parseWeatherResponse, type WeatherData } from '@/utils/weatherUtils'

const CACHE_TTL = 10 * 60 * 1000 // 10 minutes
const cache = new Map<string, { data: WeatherData; ts: number }>()

export function useWeather() {
  const coords = useAppStore((s) => s.location.coords)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!coords) return

    const key = `${coords.lat.toFixed(2)},${coords.lng.toFixed(2)}`
    const cached = cache.get(key)
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setWeather(cached.data)
      return
    }

    setLoading(true)
    setError(null)

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${coords.lat}&longitude=${coords.lng}` +
      `&current=temperature_2m,cloud_cover,wind_speed_10m,weather_code` +
      `&wind_speed_unit=ms&timezone=auto`

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error('Weather fetch failed')
        return r.json()
      })
      .then((json) => {
        const data = parseWeatherResponse(json)
        cache.set(key, { data, ts: Date.now() })
        setWeather(data)
      })
      .catch(() => setError('UNAVAILABLE'))
      .finally(() => setLoading(false))
  }, [coords?.lat, coords?.lng])

  return { weather, loading, error }
}
