import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Building2, Menu, X, LogOut, Home, BookOpen, User, UserPlus } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function Navbar() {
  const { member, logoutMember, config } = useApp()
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  const close = () => setMobileOpen(false)
  const appName = config?.appName || 'OfficeBook'
  const logo = config?.logo || ''

  const handleLogout = () => { logoutMember(); close(); navigate('/') }

  const navLinkClass = ({ isActive }) =>
    isActive
      ? 'flex items-center gap-1.5 font-medium text-sm brand-text'
      : 'flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors'

  const mobileNavClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'brand-bg-light brand-text' : 'text-gray-700 hover:bg-gray-50'
    }`

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo / brand */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            {logo ? (
              <img src={logo} alt={appName} className="h-8 w-auto object-contain max-w-[140px]" />
            ) : (
              <>
                <Building2 className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
                <span className="font-bold text-lg tracking-tight text-gray-900">
                  {appName.length <= 12
                    ? <>{appName.slice(0, -4)}<span style={{ color: 'var(--color-primary)' }}>{appName.slice(-4)}</span></>
                    : appName
                  }
                </span>
              </>
            )}
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/" end className={navLinkClass}>
              <Home className="w-4 h-4" />Home
            </NavLink>

            {member ? (
              <>
                <NavLink to="/my-bookings" className={navLinkClass}>
                  <BookOpen className="w-4 h-4" />My Bookings
                </NavLink>
                <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                  <span className="text-sm text-gray-700 font-medium flex items-center gap-1.5">
                    <User className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                    {member.name.split(' ')[0]}
                  </span>
                  <button onClick={handleLogout}
                    className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 transition-colors">
                    <LogOut className="w-4 h-4" />Sign out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <NavLink to="/login" className={navLinkClass}>
                  <User className="w-4 h-4" />Sign in
                </NavLink>
                <NavLink to="/register"
                  className="flex items-center gap-1.5 text-sm font-medium text-white px-3 py-1.5 rounded-lg transition-colors btn-primary">
                  <UserPlus className="w-4 h-4" />Create account
                </NavLink>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            <NavLink to="/" end onClick={close} className={mobileNavClass}>
              <Home className="w-4 h-4" />Home
            </NavLink>

            {member ? (
              <>
                <NavLink to="/my-bookings" onClick={close} className={mobileNavClass}>
                  <BookOpen className="w-4 h-4" />My Bookings
                </NavLink>
                <div className="px-3 py-2 text-xs text-gray-400 font-medium">
                  Signed in as {member.name}
                </div>
                <button onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut className="w-4 h-4" />Sign out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" onClick={close} className={mobileNavClass}>
                  <User className="w-4 h-4" />Sign in
                </NavLink>
                <NavLink to="/register" onClick={close} className={mobileNavClass}>
                  <UserPlus className="w-4 h-4" />Create account
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
