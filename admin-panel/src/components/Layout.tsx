import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  MapIcon,
  SwatchIcon,
  GiftIcon,
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightStartOnRectangleIcon,
  Cog6ToothIcon,
  MoonIcon,
} from '@heroicons/react/24/outline'
import { type ReactNode, useState } from 'react'

const navItems = [
  { label: 'Dashboard', path: '/', icon: HomeIcon },
  { label: 'Tasks', path: '/tasks', icon: ClipboardDocumentListIcon },
  { label: 'Levels', path: '/levels', icon: MapIcon },
  { label: 'Themes', path: '/themes', icon: SwatchIcon },
  { label: 'Rewards', path: '/rewards', icon: GiftIcon },
  { label: 'Events', path: '/events', icon: CalendarDaysIcon },
  { label: 'Audit Logs', path: '/audit-logs', icon: ClipboardDocumentCheckIcon },
  { label: 'Settings', path: '/settings', icon: Cog6ToothIcon },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? 'w-20' : 'w-64'
        } flex flex-col bg-navy-900/50 border-r border-white/5 backdrop-blur-xl transition-all duration-300`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/5">
          <div className="w-10 h-10 rounded-xl gradient-emerald flex items-center justify-center font-bold text-lg shadow-lg shadow-emerald-500/20">
            D
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-gold-400 bg-clip-text text-transparent">
                DeenQuest
              </h1>
              <p className="text-[10px] text-white/40 font-medium tracking-wider uppercase">
                Admin Panel
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : 'text-white/60'}`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/5 space-y-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="sidebar-link text-white/40 w-full"
          >
            <MoonIcon className="w-5 h-5" />
            {!collapsed && <span>Collapse</span>}
          </button>
          <button
            onClick={handleLogout}
            className="sidebar-link text-red-400 hover:bg-red-500/10 w-full"
          >
            <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 bg-navy-950/80 backdrop-blur-xl border-b border-white/5">
          <div>
            <h2 className="text-lg font-semibold text-white/90">
              Welcome back, {user?.email?.split('@')[0] ?? 'Admin'}
            </h2>
            <p className="text-xs text-white/40">Manage your DeenQuest content</p>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search..."
              className="input-field w-64 text-sm py-2"
            />
            <div className="w-9 h-9 rounded-full gradient-emerald flex items-center justify-center text-sm font-bold shadow-lg shadow-emerald-500/20">
              {user?.email?.[0]?.toUpperCase() ?? 'A'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
