export interface Coordinates {
  lat: number
  lng: number
}

export interface LocationState {
  coords: Coordinates | null
  label: string
  source: 'gps' | 'search' | null
}

export interface SunPosition {
  azimuthDeg: number
  altitudeDeg: number
  isAboveHorizon: boolean
}

export interface SunTimes {
  sunrise: Date | null
  sunset: Date | null
  goldenHourMorningEnd: Date | null
  goldenHourEveningStart: Date | null
  solarNoon: Date | null
  civilDawn: Date | null
  civilDusk: Date | null
}

export interface DeviceOrientationState {
  heading: number | null
  isSupported: boolean
  permissionState: 'granted' | 'denied' | 'prompt' | 'unavailable'
}

export type ActiveTab = 'dashboard' | 'compass' | 'map' | 'planner' | 'calendar'

export interface LocationBookmark {
  id: string
  label: string
  coords: Coordinates
}
