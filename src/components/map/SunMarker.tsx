import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Coordinates } from '@/store/types'
import { azimuthToLatLng } from '@/utils/sunCalcUtils'

interface Props {
  coords: Coordinates
  azimuthDeg: number
  altitudeDeg: number
}

export function SunMarker({ coords, azimuthDeg, altitudeDeg }: Props) {
  const map = useMap()
  const markerRef = useRef<L.Marker | null>(null)
  const lineRef   = useRef<L.Polyline | null>(null)

  // Create marker + line once on mount
  useEffect(() => {
    const isAbove = altitudeDeg > -0.833
    const zoom = map.getZoom()
    const radiusDeg = Math.max(0.05, Math.min(0.4, 0.3 / (zoom / 10)))
    const [sunLat, sunLng] = azimuthToLatLng(coords.lat, coords.lng, azimuthDeg, radiusDeg)

    const icon = buildIcon(isAbove)
    const marker = L.marker([sunLat, sunLng], { icon, interactive: true }).addTo(map)
    marker.bindTooltip(
      `${isAbove ? 'SUN' : 'NIGHT'} · ${Math.round(azimuthDeg)}° · ${Math.round(altitudeDeg)}° alt`,
      { permanent: false, direction: 'top', className: 'te-tooltip' }
    )

    const line = L.polyline(
      [[coords.lat, coords.lng], [sunLat, sunLng]],
      { color: isAbove ? '#ff6600' : '#444444', weight: 1.5, opacity: 0.5, dashArray: '5 5' }
    ).addTo(map)

    markerRef.current = marker
    lineRef.current   = line

    return () => { map.removeLayer(marker); map.removeLayer(line) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, coords.lat, coords.lng])

  // Reposition without recreating when azimuth or altitude changes
  useEffect(() => {
    if (!markerRef.current || !lineRef.current) return
    const isAbove = altitudeDeg > -0.833
    const zoom = map.getZoom()
    const radiusDeg = Math.max(0.05, Math.min(0.4, 0.3 / (zoom / 10)))
    const [sunLat, sunLng] = azimuthToLatLng(coords.lat, coords.lng, azimuthDeg, radiusDeg)

    markerRef.current.setLatLng([sunLat, sunLng])
    markerRef.current.setIcon(buildIcon(isAbove))
    markerRef.current.setTooltipContent(
      `${isAbove ? 'SUN' : 'NIGHT'} · ${Math.round(azimuthDeg)}° · ${Math.round(altitudeDeg)}° alt`
    )
    lineRef.current.setLatLngs([[coords.lat, coords.lng], [sunLat, sunLng]])
    lineRef.current.setStyle({ color: isAbove ? '#ff6600' : '#444444' })
  }, [map, azimuthDeg, altitudeDeg, coords])

  return null
}

function buildIcon(isAbove: boolean): L.DivIcon {
  const color = isAbove ? '#ff6600' : '#444'
  const glow  = isAbove ? `<circle cx="16" cy="16" r="14" fill="${color}" opacity="0.15"/>` : ''
  const html = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      ${glow}
      <circle cx="16" cy="16" r="7" fill="${color}" opacity="${isAbove ? 0.9 : 0.5}"/>
      <circle cx="16" cy="16" r="7" fill="none" stroke="${isAbove ? '#ffaa00' : '#333'}" stroke-width="1.5"/>
    </svg>`
  return L.divIcon({ html, iconSize: [32, 32], iconAnchor: [16, 16], className: '' })
}
