export interface WeatherData {
  temperature: number   // °C
  cloudCover: number    // 0–100 %
  windSpeed: number     // m/s
  conditionCode: number // WMO code
  conditionLabel: string
  /** Photographer-relevant summary */
  lightNote: string
}

export function wmoToLabel(code: number): string {
  if (code === 0)              return 'CLEAR'
  if (code <= 2)               return 'PARTLY CLOUDY'
  if (code === 3)              return 'OVERCAST'
  if (code <= 48)              return 'FOG'
  if (code <= 57)              return 'DRIZZLE'
  if (code <= 67)              return 'RAIN'
  if (code <= 77)              return 'SNOW'
  if (code <= 82)              return 'SHOWERS'
  if (code <= 86)              return 'SNOW SHOWERS'
  return 'STORM'
}

/** Plain-language note about shooting conditions */
export function lightNote(cloudCover: number, code: number): string {
  if (code >= 95)              return 'POOR — STORM'
  if (code >= 61)              return 'POOR — RAIN'
  if (code >= 45)              return 'FLAT — FOG/MIST'
  if (cloudCover >= 85)       return 'FLAT — OVERCAST'
  if (cloudCover >= 50)       return 'SOFT — DIFFUSED'
  if (cloudCover >= 20)       return 'GOOD — MIXED'
  return 'HARSH — CLEAR'
}

export function parseWeatherResponse(json: Record<string, unknown>): WeatherData {
  const c = json.current as Record<string, number>
  const code = c.weather_code ?? 0
  const cloud = c.cloud_cover ?? 0
  return {
    temperature: Math.round(c.temperature_2m ?? 0),
    cloudCover: Math.round(cloud),
    windSpeed: Math.round((c.wind_speed_10m ?? 0) * 10) / 10,
    conditionCode: code,
    conditionLabel: wmoToLabel(code),
    lightNote: lightNote(cloud, code),
  }
}
