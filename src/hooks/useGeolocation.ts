import { useState, useEffect, useCallback } from 'react'
import type { Coordinates } from '@/store/types'

interface GeolocationResult {
  coords: Coordinates | null
  error: string | null
  isLoading: boolean
  request: () => void
}

export function useGeolocation(): GeolocationResult {
  const [coords, setCoords] = useState<Coordinates | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }
    setIsLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setIsLoading(false)
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location permission denied')
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('Location unavailable')
        } else {
          setError('Could not get your location')
        }
        setIsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    )
  }, [])

  useEffect(() => {
    return () => {}
  }, [])

  return { coords, error, isLoading, request }
}
