import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

const TERRARIUM_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
const MAX_ELEV_ZOOM = 15

function tileLat(ty: number, z: number): number {
  const n = Math.PI - (2 * Math.PI * ty) / Math.pow(2, z)
  return (Math.atan(Math.sinh(n)) * 180) / Math.PI
}

function cellSize(ty: number, z: number): number {
  const lat = tileLat(ty, z)
  return (2 * Math.PI * 6_378_137 * Math.cos((lat * Math.PI) / 180)) / (Math.pow(2, z) * 256)
}

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
  const shadowStrength = Math.max(0.35, 1 - altDeg / 85)

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
      if (shade <= 0) {
        const t = Math.min(1, -shade * 1.4) * shadowStrength
        out.data[i] = 8; out.data[i+1] = 12; out.data[i+2] = 55
        out.data[i+3] = Math.round(t * 170)
      } else {
        const t = Math.min(1, shade * 1.2)
        out.data[i] = 255; out.data[i+1] = 175; out.data[i+2] = 45
        out.data[i+3] = Math.round(t * 115 * shadowStrength)
      }
    }
  }
}

interface TileRecord {
  canvas: HTMLCanvasElement
  elev: Float32Array | null
  w: number; h: number; cs: number
  cancelled: boolean
}

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
  private activeTiles = new Map<string, TileRecord>()

  constructor(opts: HillshadeLayerOptions) {
    // No maxZoom — we handle zoom clamping ourselves so the layer is always visible
    super({ ...opts, opacity: 1, tileSize: 256, minZoom: 7 })
    this.sunAzimuthDeg = opts.sunAzimuthDeg
    this.sunAltitudeDeg = opts.sunAltitudeDeg
    this.zScale = opts.zScale ?? 3
  }

  onAdd(map: L.Map): this {
    super.onAdd(map)
    // Cancel + remove records when Leaflet retires a tile
    this.on('tileunload', (e: L.TileEvent) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const coords = (e as any).coords as L.Coords | undefined
      if (!coords) return
      const key = `${coords.z}/${coords.x}/${coords.y}`
      const rec = this.activeTiles.get(key)
      if (rec) { rec.cancelled = true; this.activeTiles.delete(key) }
    })
    return this
  }

  /** Repaint all visible tiles in-place — no tile reload, no flicker */
  setSunPosition(az: number, alt: number) {
    this.sunAzimuthDeg = az
    this.sunAltitudeDeg = alt
    for (const rec of this.activeTiles.values()) {
      if (!rec.elev) continue
      const ctx = rec.canvas.getContext('2d')!
      const imgData = ctx.createImageData(rec.w, rec.h)
      computeHillshade(rec.elev, rec.w, rec.h, rec.cs, this.zScale, az, alt, imgData)
      ctx.putImageData(imgData, 0, 0)
    }
  }

  createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
    const canvas = document.createElement('canvas')
    const size = this.getTileSize()
    const w = size.x, h = size.y
    canvas.width = w; canvas.height = h

    const tileKey = `${coords.z}/${coords.x}/${coords.y}`

    // Clamp to Terrarium's max zoom so tiles exist; upscale region for higher zooms
    const zClamp = Math.min(coords.z, MAX_ELEV_ZOOM)
    const scale = Math.pow(2, coords.z - zClamp)       // 1 when zoom≤15, 2,4,8… above
    const tileX = Math.floor(coords.x / scale)
    const tileY = Math.floor(coords.y / scale)
    const elevKey = `${zClamp}/${tileX}/${tileY}`
    const cs = cellSize(tileY, zClamp) / scale          // adjusted metres/pixel

    const rec: TileRecord = { canvas, elev: null, w, h, cs, cancelled: false }
    this.activeTiles.set(tileKey, rec)

    const renderElevation = (fullElev: Float32Array) => {
      if (rec.cancelled) return

      let elev: Float32Array
      if (scale === 1) {
        elev = fullElev
      } else {
        // Extract + upscale the relevant sub-quadrant of the parent tile
        const subW = Math.floor(256 / scale)
        const subH = Math.floor(256 / scale)
        const offX = (coords.x - tileX * scale) * subW
        const offY = (coords.y - tileY * scale) * subH
        elev = new Float32Array(w * h)
        for (let row = 0; row < h; row++) {
          for (let col = 0; col < w; col++) {
            const sr = Math.min(255, offY + Math.floor(row / scale))
            const sc = Math.min(255, offX + Math.floor(col / scale))
            elev[row * w + col] = fullElev[sr * 256 + sc]
          }
        }
      }

      rec.elev = elev
      const ctx = canvas.getContext('2d')!
      const imgData = ctx.createImageData(w, h)
      computeHillshade(elev, w, h, cs, this.zScale, this.sunAzimuthDeg, this.sunAltitudeDeg, imgData)
      ctx.putImageData(imgData, 0, 0)
      done(undefined, canvas)
    }

    const cached = this.elevCache.get(elevKey)
    if (cached) { renderElevation(cached); return canvas }

    const url = TERRARIUM_URL
      .replace('{z}', String(zClamp))
      .replace('{x}', String(tileX))
      .replace('{y}', String(tileY))

    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      if (rec.cancelled) return
      const off = document.createElement('canvas')
      off.width = 256; off.height = 256
      const ctx2 = off.getContext('2d')!
      ctx2.drawImage(img, 0, 0, 256, 256)
      const px = ctx2.getImageData(0, 0, 256, 256).data
      const fullElev = new Float32Array(256 * 256)
      for (let i = 0; i < fullElev.length; i++) {
        fullElev[i] = px[i*4] * 256 + px[i*4+1] + px[i*4+2] / 256 - 32768
      }
      if (this.elevCache.size > 120) {
        const first = this.elevCache.keys().next().value
        if (first !== undefined) this.elevCache.delete(first)
      }
      this.elevCache.set(elevKey, fullElev)
      renderElevation(fullElev)
    }

    img.onerror = () => { if (!rec.cancelled) done(undefined, canvas) }
    img.src = url
    return canvas
  }
}

interface Props { sunAzimuthDeg: number; sunAltitudeDeg: number; opacity?: number }

export function HillshadeLayer({ sunAzimuthDeg, sunAltitudeDeg, opacity = 0.85 }: Props) {
  const map = useMap()
  const layerRef = useRef<HillshadeGridLayer | null>(null)

  useEffect(() => {
    const layer = new HillshadeGridLayer({ sunAzimuthDeg, sunAltitudeDeg, opacity })
    layer.addTo(map)
    layerRef.current = layer
    return () => { map.removeLayer(layer); layerRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  // Update sun without recreating tiles
  useEffect(() => {
    layerRef.current?.setSunPosition(sunAzimuthDeg, sunAltitudeDeg)
  }, [sunAzimuthDeg, sunAltitudeDeg])

  return null
}
