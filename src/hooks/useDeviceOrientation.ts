import { useEffect, useRef } from 'react'
import { useAppStore } from '@/store/appStore'

type IOSDeviceOrientationEvent = DeviceOrientationEvent & {
  webkitCompassHeading?: number
}

type IOSDeviceOrientationEventStatic = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

function needsIOSPermission(): boolean {
  return typeof (DeviceOrientationEvent as IOSDeviceOrientationEventStatic).requestPermission === 'function'
}

function extractHeading(event: DeviceOrientationEvent): number | null {
  const e = event as IOSDeviceOrientationEvent
  if (typeof e.webkitCompassHeading === 'number' && e.webkitCompassHeading >= 0) {
    return e.webkitCompassHeading
  }
  if (event.absolute && event.alpha !== null) {
    return (360 - event.alpha) % 360
  }
  if (event.alpha !== null) {
    return (360 - event.alpha) % 360
  }
  return null
}

export function useDeviceOrientation() {
  const setDeviceOrientation = useAppStore((s) => s.setDeviceOrientation)
  const listenersAdded = useRef(false)

  useEffect(() => {
    if (!window.DeviceOrientationEvent) {
      setDeviceOrientation({ isSupported: false, permissionState: 'unavailable' })
      return
    }

    // On iOS (Safari + Chrome iOS), we must request permission before events fire.
    // Keep state as 'prompt' so the button renders — do NOT add listeners yet.
    if (needsIOSPermission()) {
      setDeviceOrientation({ isSupported: true, permissionState: 'prompt' })
      return
    }

    // Non-iOS: add listeners and wait for a real event before setting 'granted'
    addOrientationListeners(setDeviceOrientation, listenersAdded)
  }, [setDeviceOrientation])
}

function addOrientationListeners(
  setDeviceOrientation: (s: Partial<{ heading: number | null; isSupported: boolean; permissionState: 'granted' | 'denied' | 'prompt' | 'unavailable' }>) => void,
  listenersAdded: React.MutableRefObject<boolean>
) {
  if (listenersAdded.current) return
  listenersAdded.current = true

  let gotEvent = false

  const handleOrientation = (event: DeviceOrientationEvent) => {
    const heading = extractHeading(event)
    if (!gotEvent) {
      gotEvent = true
      setDeviceOrientation({ isSupported: true, permissionState: 'granted', heading })
    } else {
      setDeviceOrientation({ heading })
    }
  }

  window.addEventListener('deviceorientationabsolute', handleOrientation, true)
  window.addEventListener('deviceorientation', handleOrientation, true)

  // If no event fires within 3 seconds, the sensor is unavailable on this device
  const timeout = setTimeout(() => {
    if (!gotEvent) {
      setDeviceOrientation({ isSupported: false, permissionState: 'unavailable' })
    }
  }, 3000)

  // Return a cleanup fn — stored on the ref so the iOS path can call it too
  return () => {
    clearTimeout(timeout)
    window.removeEventListener('deviceorientationabsolute', handleOrientation, true)
    window.removeEventListener('deviceorientation', handleOrientation, true)
    listenersAdded.current = false
  }
}

export async function requestOrientationPermission(
  setDeviceOrientation: (s: Partial<{ heading: number | null; isSupported: boolean; permissionState: 'granted' | 'denied' | 'prompt' | 'unavailable' }>) => void
): Promise<void> {
  const IOSEvent = DeviceOrientationEvent as IOSDeviceOrientationEventStatic

  if (typeof IOSEvent.requestPermission === 'function') {
    let result: 'granted' | 'denied'
    try {
      result = await IOSEvent.requestPermission()
    } catch {
      setDeviceOrientation({ permissionState: 'denied' })
      return
    }

    if (result !== 'granted') {
      setDeviceOrientation({ permissionState: 'denied' })
      return
    }
  }

  // Permission granted (or not needed) — now start listening
  // We use a module-level ref stand-in since this is called outside the hook
  let gotEvent = false

  const handleOrientation = (event: DeviceOrientationEvent) => {
    const heading = extractHeading(event)
    if (!gotEvent) {
      gotEvent = true
      setDeviceOrientation({ isSupported: true, permissionState: 'granted', heading })
    } else {
      setDeviceOrientation({ heading })
    }
  }

  window.addEventListener('deviceorientationabsolute', handleOrientation, true)
  window.addEventListener('deviceorientation', handleOrientation, true)

  // If events still don't fire within 3s after permission, sensor is truly unavailable
  setTimeout(() => {
    if (!gotEvent) {
      setDeviceOrientation({ isSupported: false, permissionState: 'unavailable' })
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true)
      window.removeEventListener('deviceorientation', handleOrientation, true)
    }
  }, 3000)
}
