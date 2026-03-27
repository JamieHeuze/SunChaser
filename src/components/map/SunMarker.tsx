import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Coordinates } from '@/store/types'

interface Props {
  coords: Coordinates
  azimuthDeg: number
  altitudeDeg: number
}

export function SunMarker({ coords, azimuthDeg, altitudeDeg }: Props) {
  const map = useMap()

  useEffect(() => {
    const isAbove = altitudeDeg > 0
    const arrowSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="10" fill="${isAbove ? '#fbbf24' : '#475569'}" opacity="0.9"/>
        <circle cx="24" cy="24" r="10" fill="none" stroke="${isAbove ? '#f97316' : '#334155'}" stroke-width="2"/>
        <line x1="24" y1="14" x2="24" y2="6" stroke="${isAbove ? '#f97316' : '#475569'}" stroke-width="2.5" stroke-linecap="round"/>
        <polygon points="24,2 21,8 27,8" fill="${isAbove ? '#f97316' : '#475569'}"/>
        ${isAbove ? `
        <circle cx="24" cy="24" r="14" fill="${'#f97316'}" opacity="0.15"/>
        ` : ''}
      </svg>
    `
    const icon = L.divIcon({
      html: `<div style="transform: rotate(${azimuthDeg}deg); transform-origin: center center;">${arrowSvg}</div>`,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
      className: '',
    })

    const marker = L.marker([coords.lat, coords.lng], { icon }).addTo(map)
    marker.bindTooltip(
      `${isAbove ? '☀️' : '🌙'} ${Math.round(azimuthDeg)}° · ${Math.round(altitudeDeg)}° alt`,
      { permanent: false, direction: 'top' }
    )

    return () => {
      map.removeLayer(marker)
    }
  }, [map, coords, azimuthDeg, altitudeDeg])

  return null
}
