import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { useGeolocation } from '@/hooks/useGeolocation'
import { reverseGeocode } from '@/hooks/useGeocodingSearch'
import { LocationSearch } from '@/components/location/LocationSearch'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import type { GeocodingResult } from '@/hooks/useGeocodingSearch'

export function OnboardingPage() {
  const navigate = useNavigate()
  const setLocation = useAppStore((s) => s.setLocation)
  const [reverseLoading, setReverseLoading] = useState(false)
  const { coords, error, isLoading, request } = useGeolocation()

  const handleGps = async () => {
    request()
  }

  // When GPS coords arrive, reverse-geocode and navigate
  const handleCoordsReady = async (lat: number, lng: number) => {
    setReverseLoading(true)
    const label = await reverseGeocode(lat, lng)
    setLocation({ coords: { lat, lng }, label, source: 'gps' })
    setReverseLoading(false)
    navigate('/dashboard')
  }

  // Called when coords update from the hook
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
    <div className="min-h-dvh bg-gradient-to-b from-slate-950 via-slate-900 to-orange-950/30 flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="text-center mb-10">
        <div className="text-6xl mb-4 animate-pulse">☀️</div>
        <h1 className="text-4xl font-bold text-white tracking-tight">SunChaser</h1>
        <p className="text-slate-400 mt-2 text-sm max-w-xs">
          Track the sun in real-time. Plan trips around golden hour, sunrise &amp; sunset.
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {/* GPS button */}
        <button
          onClick={handleGps}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/50 text-white font-semibold py-4 rounded-2xl transition-colors text-base"
        >
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              <path d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" />
            </svg>
          )}
          {loading ? 'Getting location…' : 'Use My Location'}
        </button>

        {error && (
          <p className="text-red-400 text-sm text-center bg-red-900/20 rounded-xl px-4 py-2">{error}</p>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-slate-500 text-xs">or search</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* Search */}
        <LocationSearch onSelect={handleSearchSelect} />
      </div>

      {/* Sun decoration */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-orange-900/20 to-transparent pointer-events-none" />
    </div>
  )
}
