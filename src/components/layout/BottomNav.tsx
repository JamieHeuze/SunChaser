import { useNavigate, useLocation } from 'react-router-dom'

const tabs = [
  { path: '/dashboard', label: 'SUN',  icon: '◉' },
  { path: '/compass',   label: 'COMP', icon: '◎' },
  { path: '/map',       label: 'MAP',  icon: '▣' },
  { path: '/planner',   label: 'PLAN', icon: '▦' },
  { path: '/calendar',  label: 'CAL',  icon: '▤' },
  { path: '/ar',        label: 'AR',   icon: '⊙' },
]

export function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav
      className="flex border-t border-te-border bg-te-bg shrink-0"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map((tab) => {
        const active = pathname === tab.path
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex-1 flex flex-col items-center justify-center gap-[5px] transition-colors relative ${
              active ? 'text-te-orange' : 'text-te-dim hover:text-te-muted'
            }`}
            style={{ height: '49px' }}
          >
            {active && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-te-orange" />
            )}
            <span style={{ fontSize: '20px', lineHeight: 1 }}>{tab.icon}</span>
            <span className="te-label" style={{ fontSize: '10px', color: active ? '#ff6600' : undefined }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
