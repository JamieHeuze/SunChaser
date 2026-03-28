export interface LightQuality {
  score: number       // 0-100
  name: string
  color: string       // hex accent color
  description: string
  segmentsFilled: number  // 0-10 for bar display
}

export function getLightQuality(altitudeDeg: number): LightQuality {
  if (altitudeDeg < -6) {
    return { score: 0, name: 'NIGHT', color: '#363636', description: 'No natural light', segmentsFilled: 0 }
  }
  if (altitudeDeg < -0.833) {
    // Civil twilight: -6° to -0.833°
    const t = (altitudeDeg + 6) / 5.167  // 0..1
    const score = Math.round(40 + t * 25)
    return { score, name: 'BLUE HOUR', color: '#0099ff', description: 'Soft diffuse blue light', segmentsFilled: Math.round(score / 10) }
  }
  if (altitudeDeg < 6) {
    // Golden hour: 0° to 6°
    const t = altitudeDeg / 6
    const score = Math.round(80 + t * 15)
    return { score, name: 'GOLDEN', color: '#ff6600', description: 'Warm directional light', segmentsFilled: Math.round(score / 10) }
  }
  if (altitudeDeg < 20) {
    // Soft light: 6° to 20°
    const t = (altitudeDeg - 6) / 14
    const score = Math.round(75 - t * 15)
    return { score, name: 'SOFT LIGHT', color: '#ffaa00', description: 'Warm angled light', segmentsFilled: Math.round(score / 10) }
  }
  if (altitudeDeg < 45) {
    // Neutral: 20° to 45°
    const t = (altitudeDeg - 20) / 25
    const score = Math.round(60 - t * 25)
    return { score, name: 'NEUTRAL', color: '#686868', description: 'Even overhead light', segmentsFilled: Math.round(score / 10) }
  }
  // Harsh: 45°+
  const t = Math.min((altitudeDeg - 45) / 45, 1)
  const score = Math.round(35 - t * 25)
  return { score, name: 'HARSH', color: '#ff3333', description: 'Hard overhead shadows', segmentsFilled: Math.round(score / 10) }
}
