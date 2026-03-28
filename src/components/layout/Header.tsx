import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import type { LocationBookmark } from '@/store/types'

export function Header() {
  const navigate = useNavigate()
  const location = useAppStore((s) => s.location)
  const bookmarks = useAppStore((s) => s.bookmarks)
  const addBookmark = useAppStore((s) => s.addBookmark)
  const removeBookmark = useAppStore((s) => s.removeBookmark)
  const setLocation = useAppStore((s) => s.setLocation)
  const [showBookmarks, setShowBookmarks] = useState(false)

  const isCurrentSaved = location.coords
    ? bookmarks.some((b) => b.coords.lat === location.coords!.lat && b.coords.lng === location.coords!.lng)
    : false

  const handleToggleBookmark = () => {
    if (!location.coords) return
    if (isCurrentSaved) {
      const existing = bookmarks.find(
        (b) => b.coords.lat === location.coords!.lat && b.coords.lng === location.coords!.lng
      )
      if (existing) removeBookmark(existing.id)
    } else {
      addBookmark({
        id: `${location.coords.lat.toFixed(4)},${location.coords.lng.toFixed(4)}`,
        label: location.label || 'Unnamed location',
        coords: location.coords,
      })
    }
  }

  const handleLoadBookmark = (bm: LocationBookmark) => {
    setLocation({ coords: bm.coords, label: bm.label, source: 'search' })
    setShowBookmarks(false)
  }

  return (
    <header className="relative shrink-0 bg-te-bg" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="flex items-center justify-between px-4 h-11 border-b border-te-border">
        <span className="te-label text-te-text tracking-[0.22em]">SUNCHASER</span>

        <div className="flex items-center gap-3">
          {/* Bookmark toggle */}
          {location.coords && (
            <button
              onClick={handleToggleBookmark}
              className="te-label transition-colors"
              style={{ color: isCurrentSaved ? '#ff6600' : '#363636' }}
              title={isCurrentSaved ? 'Remove bookmark' : 'Save location'}
            >
              {isCurrentSaved ? '★' : '☆'}
            </button>
          )}

          {/* Bookmarks list button */}
          {bookmarks.length > 0 && (
            <button
              onClick={() => setShowBookmarks((p) => !p)}
              className="te-label transition-colors"
              style={{ color: showBookmarks ? '#ff6600' : '#686868' }}
            >
              ▤ {bookmarks.length}
            </button>
          )}

          {/* Location button */}
          <button
            onClick={() => navigate('/onboarding')}
            className="flex items-center gap-2 te-label hover:text-te-orange transition-colors"
          >
            <svg viewBox="0 0 10 10" fill="currentColor" className="w-2 h-2 shrink-0">
              <polygon points="5,1 9,9 1,9" />
            </svg>
            <span
              className="truncate max-w-[140px] normal-case text-te-muted hover:text-te-orange transition-colors"
              style={{ fontSize: '11px', letterSpacing: '0.06em' }}
            >
              {location.label || 'SET LOCATION'}
            </span>
          </button>
        </div>
      </div>

      {/* Bookmark dropdown */}
      {showBookmarks && (
        <div className="absolute top-full left-0 right-0 bg-te-s1 border-b border-te-border z-50">
          {bookmarks.map((bm) => (
            <div
              key={bm.id}
              className="flex items-center justify-between px-4 py-2.5 border-b border-te-border last:border-0"
            >
              <button
                onClick={() => handleLoadBookmark(bm)}
                className="flex-1 text-left te-label text-te-text hover:text-te-orange transition-colors truncate pr-2"
                style={{ fontSize: '11px' }}
              >
                ▸ {bm.label}
              </button>
              <button
                onClick={() => removeBookmark(bm.id)}
                className="te-label text-te-dim hover:text-te-red transition-colors shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </header>
  )
}
