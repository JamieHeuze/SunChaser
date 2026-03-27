import { useState, useRef, useCallback } from 'react'

export interface GeocodingResult {
  label: string
  lat: number
  lng: number
}

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'User-Agent': 'SunChaser PWA (github.com/jamieheuze/sunchaser)' } }
    )
    const data = await res.json() as { address?: { city?: string; town?: string; village?: string; country?: string } }
    const place = data.address?.city ?? data.address?.town ?? data.address?.village ?? 'GPS Location'
    const country = data.address?.country ?? ''
    return country ? `${place}, ${country}` : place
  } catch {
    return 'GPS Location'
  }
}

export function useGeocodingSearch() {
  const [results, setResults] = useState<GeocodingResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback((query: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (query.length < 3) {
      setResults([])
      return
    }
    timerRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort()
      abortRef.current = new AbortController()
      setIsLoading(true)
      try {
        const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`
        const res = await fetch(url, {
          signal: abortRef.current.signal,
          headers: {
            'User-Agent': 'SunChaser PWA (github.com/jamieheuze/sunchaser)',
            'Accept-Language': navigator.language,
          },
        })
        const data = await res.json() as Array<{ display_name: string; lat: string; lon: string }>
        setResults(
          data.map((r) => ({
            label: r.display_name,
            lat: parseFloat(r.lat),
            lng: parseFloat(r.lon),
          }))
        )
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 400)
  }, [])

  const clear = useCallback(() => {
    setResults([])
    if (timerRef.current) clearTimeout(timerRef.current)
    if (abortRef.current) abortRef.current.abort()
  }, [])

  return { search, results, isLoading, clear }
}
