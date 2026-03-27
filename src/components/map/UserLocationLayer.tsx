import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { useAppStore } from '@/store/appStore'

// --- Geometry helpers -------------------------------------------------------

/** Compute a view-cone sector as LatLng points centred on the user */
function conePoints(
  lat: number,
  lng: number,
  headingDeg: number,
  halfAngleDeg: number,
  distMetres: number,
): L.LatLngLiteral[] {
  const R = 6_378_137
  const latRad = (lat * Math.PI) / 180
  const pts: L.LatLngLiteral[] = [{ lat, lng }]
  for (let a = -halfAngleDeg; a <= halfAngleDeg; a += 2) {
    const brg = ((headingDeg + a) * Math.PI) / 180
    const dlat = (distMetres * Math.cos(brg) * 180) / (Math.PI * R)
    const dlng =
      (distMetres * Math.sin(brg) * 180) / (Math.PI * R * Math.cos(latRad))
    pts.push({ lat: lat + dlat, lng: lng + dlng })
  }
  pts.push({ lat, lng })
  return pts
}

// --- Location icon ----------------------------------------------------------

function makeLocationIcon(heading: number | null): L.DivIcon {
  const arrow =
    heading !== null
      ? `<polygon points="20,4 16,16 20,13 24,16"
           fill="rgba(96,165,250,0.95)"
           transform="rotate(${heading},20,20)"/>`
      : ''

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
      <circle cx="20" cy="20" r="16" fill="rgba(59,130,246,0.18)" class="sc-pulse"/>
      ${arrow}
      <circle cx="20" cy="20" r="8" fill="#3b82f6" stroke="white" stroke-width="2.5"/>
      <circle cx="20" cy="20" r="3" fill="white" opacity="0.7"/>
    </svg>`

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
}

// --- React component --------------------------------------------------------

export function UserLocationLayer() {
  const map = useMap()
  const coords = useAppStore((s) => s.location.coords)
  const heading = useAppStore((s) => s.deviceOrientation.heading)

  const markerRef = useRef<L.Marker | null>(null)
  const coneRef = useRef<L.Polygon | null>(null)

  // Create marker + cone once on mount
  useEffect(() => {
    if (!coords) return

    const marker = L.marker([coords.lat, coords.lng], {
      icon: makeLocationIcon(null),
      zIndexOffset: 1000,
    }).addTo(map)
    marker.bindTooltip('You are here', { direction: 'top', offset: [0, -12] })
    markerRef.current = marker

    const cone = L.polygon([], {
      color: '#60a5fa',
      fillColor: '#3b82f6',
      fillOpacity: 0.12,
      weight: 1.5,
      opacity: 0.45,
      dashArray: '4 4',
    }).addTo(map)
    coneRef.current = cone

    return () => {
      map.removeLayer(marker)
      map.removeLayer(cone)
      markerRef.current = null
      coneRef.current = null
    }
  }, [map, coords])

  // Update icon and cone cheaply whenever heading changes
  useEffect(() => {
    if (!coords || !markerRef.current) return

    markerRef.current.setIcon(makeLocationIcon(heading))

    if (coneRef.current) {
      coneRef.current.setLatLngs(
        heading !== null
          ? conePoints(coords.lat, coords.lng, heading, 35, 500)
          : [],
      )
    }
  }, [heading, coords])

  return null
}
