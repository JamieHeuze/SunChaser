import SunCalc from 'suncalc'

export interface MoonInfo {
  phase: number         // 0-1 (0=new, 0.5=full)
  phaseName: string
  illumination: number  // 0-100 %
  moonrise: Date | null
  moonset: Date | null
}

function getPhaseName(phase: number): string {
  if (phase < 0.03 || phase > 0.97) return 'NEW MOON'
  if (phase < 0.22) return 'WAXING CRESCENT'
  if (phase < 0.28) return 'FIRST QUARTER'
  if (phase < 0.47) return 'WAXING GIBBOUS'
  if (phase < 0.53) return 'FULL MOON'
  if (phase < 0.72) return 'WANING GIBBOUS'
  if (phase < 0.78) return 'LAST QUARTER'
  return 'WANING CRESCENT'
}

export function getMoonInfo(date: Date, lat: number, lng: number): MoonInfo {
  const illum = SunCalc.getMoonIllumination(date)
  const times = SunCalc.getMoonTimes(date, lat, lng)
  const nullIfInvalid = (d: Date | undefined): Date | null =>
    !d || isNaN(d.getTime()) ? null : d

  return {
    phase: illum.phase,
    phaseName: getPhaseName(illum.phase),
    illumination: Math.round(illum.fraction * 100),
    moonrise: nullIfInvalid(times.rise),
    moonset: nullIfInvalid(times.set),
  }
}
