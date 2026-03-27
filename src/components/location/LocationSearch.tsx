import { useState } from 'react'
import { useGeocodingSearch, type GeocodingResult } from '@/hooks/useGeocodingSearch'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

interface Props {
  onSelect: (result: GeocodingResult) => void
}

export function LocationSearch({ onSelect }: Props) {
  const [query, setQuery] = useState('')
  const { search, results, isLoading, clear } = useGeocodingSearch()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    search(val)
  }

  const handleSelect = (result: GeocodingResult) => {
    setQuery(result.label.split(',').slice(0, 2).join(','))
    clear()
    onSelect(result)
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search for a city or place…"
          className="w-full bg-slate-800 text-white placeholder-slate-400 rounded-xl py-3 pl-10 pr-10 text-sm border border-slate-700 focus:border-orange-500 focus:outline-none transition-colors"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <LoadingSpinner size="sm" />
          </div>
        )}
        {query && !isLoading && (
          <button
            onClick={() => { setQuery(''); clear() }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {results.length > 0 && (
        <ul className="absolute top-full mt-1 left-0 right-0 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden z-50 shadow-xl">
          {results.map((r, i) => (
            <li key={i}>
              <button
                onClick={() => handleSelect(r)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-0"
              >
                <span className="text-white block truncate">{r.label.split(',')[0]}</span>
                <span className="text-slate-400 text-xs truncate block">
                  {r.label.split(',').slice(1, 3).join(',')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
