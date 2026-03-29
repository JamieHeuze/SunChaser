import { useEffect, useRef, useState, useCallback } from 'react'
import { useAppStore } from '@/store/appStore'
import { getSunPosition } from '@/utils/sunCalcUtils'
import { getLightQuality } from '@/utils/lightQualityUtils'
import { requestOrientationPermission } from '@/hooks/useDeviceOrientation'

// Typical wide-angle rear camera FOV (degrees)
const FOV_H = 63
const FOV_V = 48

type IOSDeviceOrientationEvent = DeviceOrientationEvent & {
  webkitCompassHeading?: number
}

function normaliseAngle(a: number): number {
  return ((a % 360) + 360) % 360
}

function deltaAz(sun: number, device: number): number {
  let d = normaliseAngle(sun - device)
  if (d > 180) d -= 360
  return d
}

export function ARPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const orientRef = useRef({ heading: 0, pitch: 0 })

  const coords = useAppStore((s) => s.location.coords)
  const setDeviceOrientation = useAppStore((s) => s.setDeviceOrientation)
  const orientPermState = useAppStore((s) => s.deviceOrientation.permissionState)

  const [camState, setCamState] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle')
  const [orientState, setOrientState] = useState<'idle' | 'granted' | 'denied'>('idle')

  // ── Camera setup ─────────────────────────────────────────────────────────────
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

  // Attach stream to video element once both are ready
  useEffect(() => {
    if (camState === 'granted' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {/* autoplay policy — muted inline should always work */})
    }
  }, [camState])

  // ── Device orientation ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      const ios = e as IOSDeviceOrientationEvent
      const heading =
        typeof ios.webkitCompassHeading === 'number' && ios.webkitCompassHeading >= 0
          ? ios.webkitCompassHeading
          : e.alpha !== null
          ? (360 - (e.alpha ?? 0)) % 360
          : orientRef.current.heading
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

  // ── Canvas render loop ────────────────────────────────────────────────────────
  useEffect(() => {
    if (camState !== 'granted') return

    const draw = () => {
      const canvas = canvasRef.current
      if (!canvas) { rafRef.current = requestAnimationFrame(draw); return }

      const W = canvas.offsetWidth
      const H = canvas.offsetHeight
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W
        canvas.height = H
      }

      const ctx = canvas.getContext('2d')
      if (!ctx) { rafRef.current = requestAnimationFrame(draw); return }

      ctx.clearRect(0, 0, W, H)

      if (!coords) { rafRef.current = requestAnimationFrame(draw); return }

      const now = new Date()
      const sun = getSunPosition(now, coords.lat, coords.lng)
      const quality = getLightQuality(sun.altitudeDeg)
      const { heading, pitch } = orientRef.current

      const dAz = deltaAz(sun.azimuthDeg, heading)
      const dAlt = sun.altitudeDeg - pitch
      const sx = W / 2 + (dAz / FOV_H) * W
      const sy = H / 2 - (dAlt / FOV_V) * H
      const onScreen = sx > -60 && sx < W + 60 && sy > -60 && sy < H + 60
      const sunColor = sun.isAboveHorizon ? quality.color : '#363636'

      // Crosshair
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 8])
      ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke()
      ctx.setLineDash([])

      // Horizon line
      const horizonY = H / 2 + (pitch / FOV_V) * H
      ctx.strokeStyle = 'rgba(255,102,0,0.4)'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(0, horizonY); ctx.lineTo(W, horizonY); ctx.stroke()
      ctx.font = '500 10px "IBM Plex Mono", monospace'
      ctx.fillStyle = 'rgba(255,102,0,0.7)'
      ctx.fillText('HORIZON', 10, horizonY - 6)

      // Sun indicator
      if (onScreen) {
        const grd = ctx.createRadialGradient(sx, sy, 4, sx, sy, 40)
        grd.addColorStop(0, sunColor + 'bb')
        grd.addColorStop(1, sunColor + '00')
        ctx.fillStyle = grd
        ctx.beginPath(); ctx.arc(sx, sy, 40, 0, Math.PI * 2); ctx.fill()

        ctx.fillStyle = sunColor
        ctx.beginPath(); ctx.arc(sx, sy, 13, 0, Math.PI * 2); ctx.fill()

        ctx.fillStyle = '#090909'
        ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2); ctx.fill()
      } else {
        // Off-screen directional arrow
        const angle = Math.atan2(sy - H / 2, sx - W / 2)
        const margin = 52
        const ax = Math.max(margin, Math.min(W - margin, W / 2 + Math.cos(angle) * (Math.min(W, H) / 2 - margin)))
        const ay = Math.max(margin, Math.min(H - margin, H / 2 + Math.sin(angle) * (Math.min(W, H) / 2 - margin)))
        ctx.save()
        ctx.translate(ax, ay)
        ctx.rotate(angle + Math.PI / 2)
        ctx.fillStyle = sunColor
        ctx.beginPath()
        ctx.moveTo(0, -14); ctx.lineTo(8, 6); ctx.lineTo(-8, 6); ctx.closePath()
        ctx.fill()
        ctx.restore()
      }

      // HUD panel
      ctx.fillStyle = 'rgba(9,9,9,0.7)'
      const hudW = 200, hudH = 78
      ctx.beginPath()
      if (ctx.roundRect) ctx.roundRect(12, 12, hudW, hudH, 4)
      else ctx.rect(12, 12, hudW, hudH)
      ctx.fill()

      ctx.font = '500 10px "IBM Plex Mono", monospace'
      ctx.fillStyle = '#686868'
      ctx.fillText('AZ', 22, 33)
      ctx.fillText('ALT', 22, 53)
      ctx.fillText('LIGHT', 22, 73)

      ctx.font = '500 13px "IBM Plex Mono", monospace'
      ctx.fillStyle = '#e8e8e8'
      ctx.fillText(`${sun.azimuthDeg.toFixed(1)}°`, 65, 33)
      ctx.fillText(`${sun.altitudeDeg.toFixed(1)}°`, 65, 53)
      ctx.fillStyle = quality.color
      ctx.fillText(quality.name, 65, 73)

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [camState, coords])

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Camera feed — always in DOM so ref is available when stream arrives */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* AR overlay canvas — only draws when camState === 'granted' */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: 'none' }}
      />

      {/* Permission / loading states as overlays */}
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

      {/* iOS orientation permission */}
      {camState === 'granted' && orientPermState === 'prompt' && orientState !== 'granted' && (
        <div className="absolute bottom-6 left-4 right-4 flex justify-center">
          <button
            onClick={handleOrientPermission}
            className="te-label px-5 py-3 border border-te-orange text-te-orange"
            style={{ background: 'rgba(9,9,9,0.85)' }}
          >
            [ ENABLE COMPASS ]
          </button>
        </div>
      )}

      {/* No location warning */}
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
