import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useAppStore } from '@/store/appStore'
import { getSunPosition, getSunPathPoints } from '@/utils/sunCalcUtils'
import { getLightQuality } from '@/utils/lightQualityUtils'
import { requestOrientationPermission } from '@/hooks/useDeviceOrientation'

const FOV_H = 63
const FOV_V = 48
const PATH_STEP = 10        // minutes between projected path dots
const SCRUB_SEGMENTS = 96   // 15-min resolution for the colour bar

type IOSDeviceOrientationEvent = DeviceOrientationEvent & {
  webkitCompassHeading?: number
}

function normaliseAngle(a: number) {
  return ((a % 360) + 360) % 360
}
function deltaAz(sun: number, device: number) {
  let d = normaliseAngle(sun - device)
  if (d > 180) d -= 360
  return d
}
function minuteToTime(min: number): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setMinutes(min)
  return d
}
function padTwo(n: number) {
  return String(n).padStart(2, '0')
}
function fmtMinute(min: number) {
  return `${padTwo(Math.floor(min / 60))}:${padTwo(min % 60)}`
}

// ── Scrubber ──────────────────────────────────────────────────────────────────
interface ScrubberProps {
  minute: number | null         // null = live
  liveMinute: number
  segmentColors: string[]
  onChange: (min: number) => void
  onLive: () => void
}

function Scrubber({ minute, liveMinute, segmentColors, onChange, onLive }: ScrubberProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const displayMin = minute ?? liveMinute
  const isLive = minute === null

  const clampedMinute = (clientX: number) => {
    const rect = barRef.current?.getBoundingClientRect()
    if (!rect) return displayMin
    const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return Math.round(frac * 1439)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    onChange(clampedMinute(e.clientX))
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging.current) onChange(clampedMinute(e.clientX))
  }
  const onPointerUp = () => { dragging.current = false }

  const thumbPct = (displayMin / 1439) * 100
  const livePct  = (liveMinute / 1439) * 100

  return (
    <div
      className="absolute left-0 right-0 bottom-0 select-none"
      style={{ background: 'rgba(9,9,9,0.82)', padding: '10px 14px 14px' }}
    >
      {/* Top row: time label + LIVE button */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="te-value"
          style={{ fontSize: '20px', color: isLive ? '#ff6600' : '#e8e8e8' }}
        >
          {isLive ? '◉ LIVE' : fmtMinute(displayMin)}
        </span>
        {!isLive && (
          <button
            onClick={onLive}
            className="te-label border border-te-orange text-te-orange px-3 py-1"
            style={{ background: 'transparent', fontSize: '11px' }}
          >
            LIVE
          </button>
        )}
        {isLive && (
          <span className="te-label text-te-dim">DRAG TO PROJECT</span>
        )}
      </div>

      {/* Colour bar + thumb */}
      <div
        ref={barRef}
        className="relative h-[28px] rounded cursor-pointer overflow-hidden"
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Segments */}
        <div className="absolute inset-0 flex">
          {segmentColors.map((c, i) => (
            <div key={i} style={{ flex: 1, background: c, opacity: 0.55 }} />
          ))}
        </div>

        {/* Dim past */}
        <div
          className="absolute top-0 bottom-0 left-0"
          style={{ width: `${thumbPct}%`, background: 'rgba(0,0,0,0.35)' }}
        />

        {/* Live time marker */}
        {!isLive && (
          <div
            className="absolute top-0 bottom-0 w-px bg-te-orange opacity-60"
            style={{ left: `${livePct}%` }}
          />
        )}

        {/* Thumb */}
        <div
          className="absolute top-0 bottom-0 flex items-center justify-center"
          style={{ left: `calc(${thumbPct}% - 1px)`, width: 3, background: '#e8e8e8', borderRadius: 2 }}
        />

        {/* Hour ticks */}
        {Array.from({ length: 24 }, (_, h) => (
          <div
            key={h}
            className="absolute top-0 bottom-0 w-px opacity-20"
            style={{ left: `${(h / 24) * 100}%`, background: '#e8e8e8' }}
          />
        ))}

        {/* Hour labels at 6, 12, 18 */}
        {[6, 12, 18].map((h) => (
          <span
            key={h}
            className="absolute te-label pointer-events-none"
            style={{
              left: `${(h / 24) * 100}%`,
              top: '50%',
              transform: 'translate(-50%,-50%)',
              fontSize: '9px',
              color: '#e8e8e8',
              opacity: 0.6,
            }}
          >
            {padTwo(h)}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Main AR page ──────────────────────────────────────────────────────────────
export function ARPage() {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef    = useRef<number>(0)
  const orientRef = useRef({ heading: 0, pitch: 0 })
  const scrubRef  = useRef<number | null>(null)

  const coords           = useAppStore((s) => s.location.coords)
  const setDeviceOrientation = useAppStore((s) => s.setDeviceOrientation)
  const orientPermState  = useAppStore((s) => s.deviceOrientation.permissionState)

  const [camState,    setCamState]    = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle')
  const [orientState, setOrientState] = useState<'idle' | 'granted'>('idle')
  const [scrubMinute, setScrubMinute] = useState<number | null>(null)  // null = live
  const [liveMinute,  setLiveMinute]  = useState(() => {
    const n = new Date(); return n.getHours() * 60 + n.getMinutes()
  })

  // Sync scrub state to ref for canvas loop
  useEffect(() => { scrubRef.current = scrubMinute }, [scrubMinute])

  // Tick live minute every 30s
  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date(); setLiveMinute(n.getHours() * 60 + n.getMinutes())
    }, 30_000)
    return () => clearInterval(id)
  }, [])

  // Pre-compute 24h path points (10-min step)
  const sunPath = useMemo(() => {
    if (!coords) return []
    return getSunPathPoints(new Date(), coords.lat, coords.lng, PATH_STEP)
  }, [coords?.lat, coords?.lng])  // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-compute scrubber colour segments
  const segmentColors = useMemo(() => {
    if (!coords) return Array(SCRUB_SEGMENTS).fill('#222222')
    const base = new Date(); base.setHours(0, 0, 0, 0)
    return Array.from({ length: SCRUB_SEGMENTS }, (_, i) => {
      const t = new Date(base.getTime() + i * (1440 / SCRUB_SEGMENTS) * 60_000)
      return getLightQuality(getSunPosition(t, coords.lat, coords.lng).altitudeDeg).color
    })
  }, [coords?.lat, coords?.lng])  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Camera ──────────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCamState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      setCamState('granted')
    } catch {
      setCamState('denied')
    }
  }, [])

  useEffect(() => {
    startCamera()
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      cancelAnimationFrame(rafRef.current)
    }
  }, [startCamera])

  useEffect(() => {
    if (camState === 'granted' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {})
    }
  }, [camState])

  // ── Orientation ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      const ios = e as IOSDeviceOrientationEvent
      const heading =
        typeof ios.webkitCompassHeading === 'number' && ios.webkitCompassHeading >= 0
          ? ios.webkitCompassHeading
          : e.alpha !== null ? (360 - (e.alpha ?? 0)) % 360 : orientRef.current.heading
      const pitch = e.beta !== null ? 90 - (e.beta ?? 90) : orientRef.current.pitch
      orientRef.current = { heading, pitch }
      setOrientState('granted')
    }
    window.addEventListener('deviceorientation', handler, true)
    window.addEventListener('deviceorientationabsolute', handler, true)
    return () => {
      window.removeEventListener('deviceorientation', handler, true)
      window.removeEventListener('deviceorientationabsolute', handler, true)
    }
  }, [])

  const handleOrientPermission = async () => {
    await requestOrientationPermission(setDeviceOrientation)
    setOrientState('granted')
  }

  // ── Canvas loop ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (camState !== 'granted') return

    const draw = () => {
      const canvas = canvasRef.current
      if (!canvas) { rafRef.current = requestAnimationFrame(draw); return }

      const W = canvas.offsetWidth
      const H = canvas.offsetHeight
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W; canvas.height = H
      }
      const ctx = canvas.getContext('2d')
      if (!ctx) { rafRef.current = requestAnimationFrame(draw); return }

      ctx.clearRect(0, 0, W, H)

      const { heading, pitch } = orientRef.current
      const scrub = scrubRef.current

      const toScreen = (az: number, alt: number): [number, number] => [
        W / 2 + (deltaAz(az, heading) / FOV_H) * W,
        H / 2 - ((alt - pitch) / FOV_V) * H,
      ]

      // ── Sun path arc ────────────────────────────────────────────────────────
      if (coords && sunPath.length > 0) {
        let prevX: number | null = null
        let prevY: number | null = null
        const MARGIN = 120

        for (const pt of sunPath) {
          if (pt.altitudeDeg < -8) { prevX = null; prevY = null; continue }
          const [sx, sy] = toScreen(pt.azimuthDeg, pt.altitudeDeg)
          const onScreen = sx > -MARGIN && sx < W + MARGIN && sy > -MARGIN && sy < H + MARGIN
          const q = getLightQuality(pt.altitudeDeg)

          // Connect with thin line
          if (onScreen && prevX !== null && prevY !== null) {
            ctx.strokeStyle = q.color + '66'
            ctx.lineWidth = 1.5
            ctx.setLineDash([3, 5])
            ctx.beginPath(); ctx.moveTo(prevX, prevY); ctx.lineTo(sx, sy); ctx.stroke()
            ctx.setLineDash([])
          }

          // Dot at each path point
          if (onScreen) {
            ctx.fillStyle = q.color + 'bb'
            ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2); ctx.fill()
          }

          prevX = onScreen ? sx : null
          prevY = onScreen ? sy : null
        }
      }

      // ── Sun position (scrubbed or live) ──────────────────────────────────────
      if (coords) {
        const now   = scrub !== null ? minuteToTime(scrub) : new Date()
        const sun   = getSunPosition(now, coords.lat, coords.lng)
        const q     = getLightQuality(sun.altitudeDeg)
        const color = sun.isAboveHorizon ? q.color : '#363636'
        const [sx, sy] = toScreen(sun.azimuthDeg, sun.altitudeDeg)
        const onScreen  = sx > -80 && sx < W + 80 && sy > -80 && sy < H + 80

        if (onScreen) {
          // Glow
          const grd = ctx.createRadialGradient(sx, sy, 4, sx, sy, scrub !== null ? 30 : 40)
          grd.addColorStop(0, color + 'cc')
          grd.addColorStop(1, color + '00')
          ctx.fillStyle = grd
          ctx.beginPath(); ctx.arc(sx, sy, scrub !== null ? 30 : 40, 0, Math.PI * 2); ctx.fill()
          // Body
          ctx.fillStyle = color
          ctx.beginPath(); ctx.arc(sx, sy, scrub !== null ? 10 : 13, 0, Math.PI * 2); ctx.fill()
          ctx.fillStyle = '#090909'
          ctx.beginPath(); ctx.arc(sx, sy, 3.5, 0, Math.PI * 2); ctx.fill()
          // Time label when scrubbing
          if (scrub !== null) {
            ctx.font = '500 11px "IBM Plex Mono", monospace'
            ctx.fillStyle = color
            ctx.fillText(fmtMinute(scrub), sx + 16, sy - 8)
          }
        } else {
          // Off-screen arrow
          const angle = Math.atan2(sy - H / 2, sx - W / 2)
          const margin = 52
          const ax = Math.max(margin, Math.min(W - margin, W / 2 + Math.cos(angle) * (Math.min(W, H) / 2 - margin)))
          const ay = Math.max(margin, Math.min(H - margin, H / 2 + Math.sin(angle) * (Math.min(W, H) / 2 - margin)))
          ctx.save()
          ctx.translate(ax, ay); ctx.rotate(angle + Math.PI / 2)
          ctx.fillStyle = color
          ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(8, 6); ctx.lineTo(-8, 6); ctx.closePath(); ctx.fill()
          ctx.restore()
        }

        // Also show live dot when scrubbing so you can see "now" on path
        if (scrub !== null) {
          const liveSun = getSunPosition(new Date(), coords.lat, coords.lng)
          const [lx, ly] = toScreen(liveSun.azimuthDeg, liveSun.altitudeDeg)
          if (lx > 0 && lx < W && ly > 0 && ly < H) {
            ctx.strokeStyle = '#ff6600'
            ctx.lineWidth = 1.5
            ctx.beginPath(); ctx.arc(lx, ly, 6, 0, Math.PI * 2); ctx.stroke()
            ctx.font = '500 9px "IBM Plex Mono", monospace'
            ctx.fillStyle = '#ff660099'
            ctx.fillText('NOW', lx + 9, ly + 4)
          }
        }
      }

      // ── Crosshair ────────────────────────────────────────────────────────────
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 8])
      ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke()
      ctx.setLineDash([])

      // ── Horizon ──────────────────────────────────────────────────────────────
      const horizonY = H / 2 + (pitch / FOV_V) * H
      ctx.strokeStyle = 'rgba(255,102,0,0.35)'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(0, horizonY); ctx.lineTo(W, horizonY); ctx.stroke()
      ctx.font = '500 9px "IBM Plex Mono", monospace'
      ctx.fillStyle = 'rgba(255,102,0,0.6)'
      ctx.fillText('HORIZON', 10, horizonY - 5)

      // ── HUD ──────────────────────────────────────────────────────────────────
      if (coords) {
        const now = scrub !== null ? minuteToTime(scrub) : new Date()
        const sun = getSunPosition(now, coords.lat, coords.lng)
        const q   = getLightQuality(sun.altitudeDeg)

        ctx.fillStyle = 'rgba(9,9,9,0.72)'
        ctx.beginPath()
        if (ctx.roundRect) ctx.roundRect(12, 12, 190, 78, 4); else ctx.rect(12, 12, 190, 78)
        ctx.fill()

        ctx.font = '500 10px "IBM Plex Mono", monospace'
        ctx.fillStyle = '#686868'
        ctx.fillText('AZ',    22, 33)
        ctx.fillText('ALT',   22, 53)
        ctx.fillText('LIGHT', 22, 73)

        ctx.font = '500 13px "IBM Plex Mono", monospace'
        ctx.fillStyle = '#e8e8e8'
        ctx.fillText(`${sun.azimuthDeg.toFixed(1)}°`,  62, 33)
        ctx.fillText(`${sun.altitudeDeg.toFixed(1)}°`, 62, 53)
        ctx.fillStyle = q.color
        ctx.fillText(q.name, 62, 73)
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [camState, coords, sunPath])  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline muted autoPlay
      />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: 'none' }}
      />

      {/* Loading / denied states */}
      {(camState === 'idle' || camState === 'requesting') && (
        <div className="absolute inset-0 flex items-center justify-center bg-te-bg">
          <span className="te-label text-te-dim">STARTING CAMERA…</span>
        </div>
      )}
      {camState === 'denied' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-te-bg px-8 text-center">
          <div className="te-value" style={{ fontSize: '18px' }}>CAMERA ACCESS REQUIRED</div>
          <div className="te-label text-te-muted">Allow camera access in Settings to use AR Sun Finder</div>
        </div>
      )}

      {/* Timeline scrubber */}
      {camState === 'granted' && coords && (
        <Scrubber
          minute={scrubMinute}
          liveMinute={liveMinute}
          segmentColors={segmentColors}
          onChange={setScrubMinute}
          onLive={() => setScrubMinute(null)}
        />
      )}

      {/* iOS orientation permission */}
      {camState === 'granted' && orientPermState === 'prompt' && orientState !== 'granted' && (
        <div className="absolute bottom-32 left-4 right-4 flex justify-center">
          <button
            onClick={handleOrientPermission}
            className="te-label px-5 py-3 border border-te-orange text-te-orange"
            style={{ background: 'rgba(9,9,9,0.85)' }}
          >
            [ ENABLE COMPASS ]
          </button>
        </div>
      )}

      {/* No location */}
      {camState === 'granted' && !coords && (
        <div className="absolute top-4 left-0 right-0 flex justify-center">
          <div className="te-label px-4 py-2" style={{ background: 'rgba(9,9,9,0.8)' }}>
            SET LOCATION TO TRACK SUN
          </div>
        </div>
      )}
    </div>
  )
}
