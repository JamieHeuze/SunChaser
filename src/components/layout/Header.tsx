import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'

export function Header() {
  const navigate = useNavigate()
  const label = useAppStore((s) => s.location.label)

  return (
    <header className="flex items-center justify-between px-4 h-10 border-b border-te-border bg-te-bg shrink-0">
      <span className="te-label text-te-text tracking-[0.22em]">SUNCHASER</span>
      <button
        onClick={() => navigate('/onboarding')}
        className="flex items-center gap-2 te-label hover:text-te-orange transition-colors"
      >
        <svg viewBox="0 0 10 10" fill="currentColor" className="w-2 h-2 shrink-0">
          <polygon points="5,1 9,9 1,9" />
        </svg>
        <span className="truncate max-w-[160px] normal-case text-te-muted hover:text-te-orange transition-colors" style={{ fontSize: '10px', letterSpacing: '0.06em' }}>
          {label || 'SET LOCATION'}
        </span>
      </button>
    </header>
  )
}
