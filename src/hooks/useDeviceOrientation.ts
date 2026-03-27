import { useEffect } from 'react'
import { useAppStore } from '@/store/appStore'

type IOSDeviceOrientationEvent = DeviceOrientationEvent & {
  webkitCompassHeading?: number
  requestPermission?: () => Promise<'granted' | 'denied'>
}

export function useDeviceOrientation() {
  const setDeviceOrientation = useAppStore((s) => s.setDeviceOrientation)

  useEffect(() => {
    // Check if the API is available at all
    if (!window.DeviceOrientationEvent) {
      setDeviceOrientation({ isSupported: false, permissionState: 'unavailable' })
      return
    }

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const e = event as IOSDeviceOrientationEvent
      let heading: number | null = null

      if (typeof e.webkitCompassHeading === 'number') {
        // iOS: already north-referenced, clockwise
        heading = e.webkitCompassHeading
      } else if (event.absolute && event.alpha !== null) {
        // Standard: alpha is counterclockwise from north, convert to clockwise
        heading = (360 - event.alpha) % 360
      } else if (event.alpha !== null) {
        // Non-absolute fallback (may drift but better than nothing)
        heading = (360 - event.alpha) % 360
      }

      setDeviceOrientation({ heading, isSupported: true })
    }

    // Try absolute orientation first
    window.addEventListener('deviceorientationabsolute', handleOrientation, true)
    window.addEventListener('deviceorientation', handleOrientation, true)
    setDeviceOrientation({ isSupported: true, permissionState: 'granted' })

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true)
      window.removeEventListener('deviceorientation', handleOrientation, true)
    }
  }, [setDeviceOrientation])
}

export async function requestOrientationPermission(
  setDeviceOrientation: (s: { permissionState: 'granted' | 'denied' | 'prompt' | 'unavailable' }) => void
): Promise<void> {
  const Event = DeviceOrientationEvent as unknown as IOSDeviceOrientationEvent
  if (typeof Event.requestPermission === 'function') {
    try {
      const result = await Event.requestPermission()
      setDeviceOrientation({ permissionState: result })
    } catch {
      setDeviceOrientation({ permissionState: 'denied' })
    }
  } else {
    setDeviceOrientation({ permissionState: 'granted' })
  }
}
