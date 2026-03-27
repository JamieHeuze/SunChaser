import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'

export function Header() {
  const navigate = useNavigate()
  const label = useAppStore((s) => s.location.label)

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-slate-900/80 backdrop-blur border-b border-slate-800/60">
      <div className="flex items-center gap-2">
        <span className="text-xl">☀️</span>
        <span className="font-bold text-white tracking-tight">SunChaser</span>
      </div>
      <button
        onClick={() => navigate('/onboarding')}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-orange-400 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 shrink-0">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span className="truncate max-w-[140px]">{label || 'Set location'}</span>
      </button>
    </header>
  )
}
