import type { SunTimes } from '@/store/types'

let scheduledTimeouts: ReturnType<typeof setTimeout>[] = []

export function clearScheduledNotifications() {
  scheduledTimeouts.forEach(clearTimeout)
  scheduledTimeouts = []
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  return Notification.requestPermission()
}

function scheduleAt(ms: number, title: string, body: string) {
  if (ms < 0 || ms > 24 * 60 * 60 * 1000) return
  const id = setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/SunChaser/icons/icon-192.png', badge: '/SunChaser/icons/icon-192.png' })
    }
  }, ms)
  scheduledTimeouts.push(id)
}

export function scheduleGoldenHourAlerts(sunTimes: SunTimes) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  clearScheduledNotifications()

  const now = Date.now()
  const warn = 10 * 60 * 1000  // 10 min warning

  if (sunTimes.sunrise) {
    scheduleAt(sunTimes.sunrise.getTime() - now - warn, '☀ Golden Hour Starting', 'Morning golden hour begins in 10 minutes')
    scheduleAt(sunTimes.sunrise.getTime() - now, '☀ Golden Hour Now', 'Morning golden hour has started')
  }
  if (sunTimes.goldenHourEveningStart) {
    scheduleAt(sunTimes.goldenHourEveningStart.getTime() - now - warn, '🌅 Golden Hour Starting', 'Evening golden hour begins in 10 minutes')
    scheduleAt(sunTimes.goldenHourEveningStart.getTime() - now, '🌅 Golden Hour Now', 'Evening golden hour has started')
  }
  if (sunTimes.civilDawn) {
    scheduleAt(sunTimes.civilDawn.getTime() - now, '◑ Blue Hour', 'Morning blue hour has started')
  }
}

export function notificationsSupported(): boolean {
  return 'Notification' in window
}
