import { useWeather } from '@/hooks/useWeather'

function cloudColor(pct: number): string {
  if (pct < 25) return '#ff6600'  // clear → orange (good light)
  if (pct < 60) return '#ffaa00'  // partial → amber
  return '#686868'                // overcast → muted
}

export function WeatherCard() {
  const { weather, loading, error } = useWeather()

  return (
    <div className="border-b border-te-border px-4 py-3">
      <div className="te-label text-te-muted mb-2">WEATHER</div>

      {loading && (
        <div className="te-label text-te-dim">FETCHING…</div>
      )}

      {error && (
        <div className="te-label text-te-dim">{error}</div>
      )}

      {weather && (
        <div className="flex flex-col gap-2">
          {/* Top row: condition + temp */}
          <div className="flex items-baseline justify-between">
            <span className="te-value" style={{ fontSize: '22px' }}>
              {weather.conditionLabel}
            </span>
            <span className="te-value text-te-muted" style={{ fontSize: '22px' }}>
              {weather.temperature}°C
            </span>
          </div>

          {/* Cloud cover bar */}
          <div className="flex items-center gap-3">
            <span className="te-label" style={{ width: 56 }}>CLOUD</span>
            <div className="flex-1 h-[3px] bg-te-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${weather.cloudCover}%`,
                  background: cloudColor(weather.cloudCover),
                }}
              />
            </div>
            <span
              className="te-value"
              style={{ fontSize: '18px', color: cloudColor(weather.cloudCover), minWidth: 40, textAlign: 'right' }}
            >
              {weather.cloudCover}%
            </span>
          </div>

          {/* Bottom row: light note + wind */}
          <div className="flex items-center justify-between">
            <span className="te-label" style={{ color: cloudColor(weather.cloudCover) }}>
              {weather.lightNote}
            </span>
            <span className="te-label text-te-dim">
              WIND {weather.windSpeed} M/S
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
