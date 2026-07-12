import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  BarChart3,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ROLE_LABELS } from '../utils/constants'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/vehicles', label: 'Vehicles', icon: Truck },
  { to: '/drivers', label: 'Drivers', icon: Users },
  { to: '/trips', label: 'Trips', icon: Route },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 bg-rail-bg text-white flex flex-col">
      <div className="px-5 py-6 flex items-center gap-2 border-b border-white/10">
        <div className="w-2 h-8 rail-line rounded-full" />
        <div>
          <div className="font-display font-semibold text-lg leading-none">TransitOps</div>
          <div className="text-[11px] text-slate-400 tracking-wide mt-0.5">DISPATCH CONSOLE</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/10 text-accent border-l-2 border-accent -ml-[2px] pl-[14px]'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-semibold font-mono">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : '--'}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{user?.name || 'Unknown user'}</div>
            <div className="text-[11px] text-slate-400 truncate">
              {ROLE_LABELS[user?.role] || user?.role}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg py-2 transition-colors"
        >
          <LogOut size={15} />
          Log out
        </button>
      </div>
    </aside>
  )
}
