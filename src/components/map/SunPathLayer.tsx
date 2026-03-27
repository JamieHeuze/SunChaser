import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { getSunPathPoints, azimuthToLatLng } from '@/utils/sunCalcUtils'
import type { Coordinates } from '@/store/types'

interface Props {
  coords: Coordinates
  date: Date
}

export function SunPathLayer({ coords, date }: Props) {
  const map = useMap()

  useEffect(() => {
    const points = getSunPathPoints(date, coords.lat, coords.lng, 10)
    const abovePts = points.filter((p) => p.altitudeDeg > 0)

    if (abovePts.length === 0) return

    const zoom = map.getZoom()
    const radiusDeg = Math.max(0.05, Math.min(0.4, 0.3 / (zoom / 10)))

    const latLngs = abovePts.map((p) =>
      azimuthToLatLng(coords.lat, coords.lng, p.azimuthDeg, radiusDeg)
    )

    const pathLine = L.polyline(latLngs, {
      color: '#f97316',
      weight: 3,
      opacity: 0.6,
      dashArray: undefined,
    }).addTo(map)

    // Sunrise marker
    const sunriseLL = azimuthToLatLng(coords.lat, coords.lng, abovePts[0].azimuthDeg, radiusDeg)
    const sunriseMarker = L.circleMarker(sunriseLL, {
      radius: 6,
      color: '#fb923c',
      fillColor: '#fdba74',
      fillOpacity: 1,
      weight: 2,
    }).addTo(map)
    sunriseMarker.bindTooltip('Sunrise', { permanent: false, direction: 'top' })

    // Sunset marker
    const sunsetLL = azimuthToLatLng(
      coords.lat,
      coords.lng,
      abovePts[abovePts.length - 1].azimuthDeg,
      radiusDeg
    )
    const sunsetMarker = L.circleMarker(sunsetLL, {
      radius: 6,
      color: '#c2410c',
      fillColor: '#fb923c',
      fillOpacity: 1,
      weight: 2,
    }).addTo(map)
    sunsetMarker.bindTooltip('Sunset', { permanent: false, direction: 'top' })

    return () => {
      map.removeLayer(pathLine)
      map.removeLayer(sunriseMarker)
      map.removeLayer(sunsetMarker)
    }
  }, [map, coords, date])

  return null
}
