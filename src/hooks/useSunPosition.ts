import { useEffect } from 'react'
import { useAppStore } from '@/store/appStore'
import { getSunPosition, getSunTimes } from '@/utils/sunCalcUtils'

export function useSunPosition() {
  const coords = useAppStore((s) => s.location.coords)
  const setSunPosition = useAppStore((s) => s.setSunPosition)
  const setSunTimes = useAppStore((s) => s.setSunTimes)

  useEffect(() => {
    if (!coords) return

    const tick = () => {
      const now = new Date()
      setSunPosition(getSunPosition(now, coords.lat, coords.lng))
      setSunTimes(getSunTimes(now, coords.lat, coords.lng))
    }

    tick()
    const id = setInterval(tick, 10_000)
    return () => clearInterval(id)
  }, [coords, setSunPosition, setSunTimes])
}
