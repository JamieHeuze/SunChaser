import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { useGeolocation } from '@/hooks/useGeolocation'
import { reverseGeocode } from '@/hooks/useGeocodingSearch'
import { LocationSearch } from '@/components/location/LocationSearch'
import type { GeocodingResult } from '@/hooks/useGeocodingSearch'

export function OnboardingPage() {
  const navigate = useNavigate()
  const setLocation = useAppStore((s) => s.setLocation)
  const [reverseLoading, setReverseLoading] = useState(false)
  const { coords, error, isLoading, request } = useGeolocation()

  const handleGps = () => { request() }

  const handleCoordsReady = async (lat: number, lng: number) => {
    setReverseLoading(true)
    const label = await reverseGeocode(lat, lng)
    setLocation({ coords: { lat, lng }, label, source: 'gps' })
    setReverseLoading(false)
    navigate('/dashboard')
  }

  if (coords && !reverseLoading && !isLoading) {
    handleCoordsReady(coords.lat, coords.lng)
  }

  const handleSearchSelect = (result: GeocodingResult) => {
    setLocation({
      coords: { lat: result.lat, lng: result.lng },
      label: result.label.split(',').slice(0, 2).join(',').trim(),
      source: 'search',
    })
    navigate('/dashboard')
  }

  const loading = isLoading || reverseLoading

  return (
    <div className="min-h-dvh bg-te-bg flex flex-col items-center justify-center px-6 py-12">

      {/* Wordmark */}
      <div className="text-center mb-12">
        <div className="te-label tracking-[0.4em] text-te-muted mb-3">● ─────────────</div>
        <h1
          className="text-4xl font-medium text-te-text mb-2"
          style={{ letterSpacing: '0.25em', fontFamily: "'IBM Plex Mono', monospace" }}
        >
          SUNCHASER
        </h1>
        <p className="te-label tracking-[0.15em]">SOLAR POSITION INSTRUMENT</p>
        <div className="te-label tracking-[0.4em] text-te-muted mt-3">─────────────── ●</div>
      </div>

      <div className="w-full max-w-sm space-y-3">
        {/* GPS button */}
        <button
          onClick={handleGps}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 border border-te-orange text-te-orange hover:bg-te-orange hover:text-te-bg disabled:opacity-40 py-4 transition-colors te-label tracking-[0.18em]"
        >
          {loading ? (
            <span className="animate-pulse">ACQUIRING SIGNAL···</span>
          ) : (
            <>
              <span>◎</span>
              <span>USE MY LOCATION</span>
            </>
          )}
        </button>

        {error && (
          <p className="te-label text-te-red text-center">{error.toUpperCase()}</p>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 border-t border-te-border" />
          <span className="te-label">OR</span>
          <div className="flex-1 border-t border-te-border" />
        </div>

        {/* Search */}
        <LocationSearch onSelect={handleSearchSelect} />
      </div>
    </div>
  )
}
