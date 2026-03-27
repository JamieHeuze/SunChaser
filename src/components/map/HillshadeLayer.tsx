import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

// AWS Terrain Tiles — Terrarium format, free, CORS-enabled, no API key required.
// Elevation (metres) = R*256 + G + B/256 - 32768
const TERRARIUM_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'

// --- Math helpers ---------------------------------------------------------

/** Latitude of tile row ty at zoom z (degrees) */
function tileLat(ty: number, z: number): number {
  const n = Math.PI - (2 * Math.PI * ty) / Math.pow(2, z)
  return (Math.atan(Math.sinh(n)) * 180) / Math.PI
}

/**
 * Ground resolution in metres per pixel for a tile.
 * At Mercator zoom z, a 256-px tile spans (2π·R·cos(lat)) / 2^z metres.
 */
function cellSize(ty: number, z: number): number {
  const lat = tileLat(ty, z)
  return (2 * Math.PI * 6_378_137 * Math.cos((lat * Math.PI) / 180)) / (Math.pow(2, z) * 256)
}

/**
 * Compute a per-pixel hillshade ImageData from a decoded elevation grid.
 *
 * Coordinate convention (Mercator tile pixels):
 *   column c → east,  row r → south
 *   Physical: x = east (+c), y = north (-r), z = up
 *
 * Surface normal (unnormalised):
 *   nx = -(dz/dc) / cs            (east–west tilt)
 *   ny =  (dz/dr) / cs            (row gradient — positive = south-rising)
 *   nz = 1
 *
 * Sun light vector (in east/north/up space):
 *   lx = sin(az) · cos(alt)
 *   ly = cos(az) · cos(alt)   ← positive when sun is north (az≈0°)
 *   lz = sin(alt)
 *
 * Hillshade = clamp(dot(normalize(n), l), 0, 1)
 * Shadow overlay alpha scales with both the hillshade deficit and the
 * shadow strength factor (stronger/longer shadows at low sun angles).
 */
function computeHillshade(
  elev: Float32Array,
  w: number,
  h: number,
  cs: number,
  zScale: number,
  azDeg: number,
  altDeg: number,
  out: ImageData,
): void {
  const azRad = (azDeg * Math.PI) / 180
  const altRad = (altDeg * Math.PI) / 180

  const lx = Math.sin(azRad) * Math.cos(altRad)
  const ly = Math.cos(azRad) * Math.cos(altRad)
  const lz = Math.sin(altRad)

  // Shadow strength: stronger at low sun angles (more dramatic at golden hour)
  const shadowStrength = Math.max(0.3, 1 - altDeg / 90)

  for (let r = 1; r < h - 1; r++) {
    for (let c = 1; c < w - 1; c++) {
      const dzdcol = (elev[r * w + c + 1] - elev[r * w + c - 1]) / (2 * cs)
      const dzdrow = (elev[(r + 1) * w + c] - elev[(r - 1) * w + c]) / (2 * cs)

      const nx = -dzdcol * zScale
      const ny =  dzdrow * zScale
      const nz = 1

      const len = Math.sqrt(nx * nx + ny * ny + nz * nz)
      const shade = (nx / len) * lx + (ny / len) * ly + (nz / len) * lz

      const i = (r * w + c) * 4

      if (shade < 0.05) {
        // In shadow — cool blue-indigo tint
        const a = Math.round(Math.min(190, (-shade + 0.05) * 280 * shadowStrength))
        out.data[i]     = 20
        out.data[i + 1] = 25
        out.data[i + 2] = 70
        out.data[i + 3] = a
      } else {
        // In sunlight — subtle warm golden tint at low angles, transparent at high angles
        const warmth = Math.max(0, (0.6 - shade) * shadowStrength * 25)
        out.data[i]     = 255
        out.data[i + 1] = 210
        out.data[i + 2] = 100
        out.data[i + 3] = Math.round(warmth)
      }
    }
  }
}

// --- Custom Leaflet GridLayer ---------------------------------------------

interface HillshadeLayerOptions extends L.GridLayerOptions {
  sunAzimuthDeg: number
  sunAltitudeDeg: number
  zScale?: number
}

class HillshadeGridLayer extends L.GridLayer {
  private sunAzimuthDeg: number
  private sunAltitudeDeg: number
  private zScale: number
  private elevCache = new Map<string, Float32Array>()

  constructor(opts: HillshadeLayerOptions) {
    super({ ...opts, opacity: 1, tileSize: 256 })
    this.sunAzimuthDeg = opts.sunAzimuthDeg
    this.sunAltitudeDeg = opts.sunAltitudeDeg
    this.zScale = opts.zScale ?? 2
  }

  setSunPosition(azimuth: number, altitude: number) {
    this.sunAzimuthDeg = azimuth
    this.sunAltitudeDeg = altitude
    this.redraw()
  }

  createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
    const canvas = document.createElement('canvas')
    const size = this.getTileSize()
    canvas.width = size.x
    canvas.height = size.y

    const key = `${coords.z}/${coords.x}/${coords.y}`
    const cs = cellSize(coords.y, coords.z)
    const az = this.sunAzimuthDeg
    const alt = this.sunAltitudeDeg
    const zs = this.zScale

    const render = (elev: Float32Array) => {
      const ctx = canvas.getContext('2d')!
      const imgData = ctx.createImageData(size.x, size.y)
      computeHillshade(elev, size.x, size.y, cs, zs, az, alt, imgData)
      ctx.putImageData(imgData, 0, 0)
      done(undefined, canvas)
    }

    const cached = this.elevCache.get(key)
    if (cached) {
      render(cached)
      return canvas
    }

    const url = TERRARIUM_URL
      .replace('{z}', String(coords.z))
      .replace('{x}', String(coords.x))
      .replace('{y}', String(coords.y))

    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const off = document.createElement('canvas')
      off.width = size.x
      off.height = size.y
      const ctx2 = off.getContext('2d')!
      ctx2.drawImage(img, 0, 0, size.x, size.y)
      const px = ctx2.getImageData(0, 0, size.x, size.y).data

      const elev = new Float32Array(size.x * size.y)
      for (let i = 0; i < elev.length; i++) {
        elev[i] = px[i * 4] * 256 + px[i * 4 + 1] + px[i * 4 + 2] / 256 - 32768
      }

      // LRU-lite: evict if cache is large
      if (this.elevCache.size > 120) {
        const first = this.elevCache.keys().next().value
        if (first !== undefined) this.elevCache.delete(first)
      }
      this.elevCache.set(key, elev)
      render(elev)
    }

    img.onerror = () => done(undefined, canvas) // flat area / ocean — no overlay

    img.src = url
    return canvas
  }
}

// --- React wrapper --------------------------------------------------------

interface Props {
  sunAzimuthDeg: number
  sunAltitudeDeg: number
  opacity?: number
}

export function HillshadeLayer({ sunAzimuthDeg, sunAltitudeDeg, opacity = 0.85 }: Props) {
  const map = useMap()
  const layerRef = useRef<HillshadeGridLayer | null>(null)

  useEffect(() => {
    const layer = new HillshadeGridLayer({
      sunAzimuthDeg,
      sunAltitudeDeg,
      minZoom: 7,
      maxZoom: 15,
      opacity,
    })
    layer.addTo(map)
    layerRef.current = layer

    return () => {
      map.removeLayer(layer)
      layerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  // Update sun position without recreating the layer (avoids full tile reload)
  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.setSunPosition(sunAzimuthDeg, sunAltitudeDeg)
    }
  }, [sunAzimuthDeg, sunAltitudeDeg])

  return null
}
