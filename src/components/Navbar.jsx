import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Building2, Menu, X, Shield, LogOut, Home, BookOpen } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function Navbar() {
  const { isAdmin, setIsAdmin, currentUser } = useApp()
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    setIsAdmin(false)
    setMobileOpen(false)
    navigate('/')
  }

  const navLinkClass = ({ isActive }) =>
    isActive
      ? 'flex items-center gap-1.5 text-blue-600 font-medium text-sm'
      : 'flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors'

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Building2 className="w-6 h-6" />
            <span className="font-bold text-lg tracking-tight text-gray-900">
              Office<span className="text-blue-600">Book</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/" end className={navLinkClass}>
              <Home className="w-4 h-4" />
              Home
            </NavLink>
            <NavLink to="/my-bookings" className={navLinkClass}>
              <BookOpen className="w-4 h-4" />
              My Bookings
            </NavLink>

            {isAdmin ? (
              <>
                <NavLink to="/admin/dashboard" className={navLinkClass}>
                  <Shield className="w-4 h-4" />
                  {currentUser ? currentUser.name : 'Admin'}
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <NavLink to="/admin" className={navLinkClass}>
                <Shield className="w-4 h-4" />
                Admin
              </NavLink>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            <NavLink
              to="/"
              end
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <Home className="w-4 h-4" />
              Home
            </NavLink>
            <NavLink
              to="/my-bookings"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <BookOpen className="w-4 h-4" />
              My Bookings
            </NavLink>

            {isAdmin ? (
              <>
                <NavLink
                  to="/admin/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <Shield className="w-4 h-4" />
                  Admin Dashboard
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <NavLink
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                <Shield className="w-4 h-4" />
                Admin Login
              </NavLink>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
