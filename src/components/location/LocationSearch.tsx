import { useState } from 'react'
import { useGeocodingSearch, type GeocodingResult } from '@/hooks/useGeocodingSearch'

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
      <div className="relative flex items-center border border-te-border focus-within:border-te-orange transition-colors">
        <span className="te-label pl-3 text-te-dim shrink-0">▸</span>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="SEARCH LOCATION"
          className="w-full bg-transparent text-te-text placeholder-te-dim py-3.5 px-3 te-label text-[11px] focus:outline-none tracking-[0.1em] normal-case"
          style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'none' }}
        />
        {isLoading && (
          <span className="te-label px-3 animate-pulse text-te-dim">···</span>
        )}
        {query && !isLoading && (
          <button
            onClick={() => { setQuery(''); clear() }}
            className="te-label px-3 text-te-dim hover:text-te-text transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {results.length > 0 && (
        <ul className="absolute top-full left-0 right-0 bg-te-s1 border border-te-border border-t-0 z-50">
          {results.map((r, i) => (
            <li key={i} className="border-b border-te-border last:border-0">
              <button
                onClick={() => handleSelect(r)}
                className="w-full text-left px-3 py-3 hover:bg-te-s2 transition-colors"
              >
                <div className="text-te-text text-xs truncate" style={{ fontFeatureSettings: '"tnum" 0' }}>
                  {r.label.split(',')[0]}
                </div>
                <div className="te-label text-te-dim truncate mt-0.5">
                  {r.label.split(',').slice(1, 3).join(',').trim()}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
