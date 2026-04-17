import React, { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Building2,
  Calendar,
  Clock,
  Users,
  LogOut,
  ChevronRight,
  LayoutDashboard,
  Settings,
  Database,
  MapPin,
} from 'lucide-react'
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns'
import { useApp } from '../../context/AppContext'

export default function AdminDashboard() {
  const { spaces, bookings, setIsAdmin, currentUser } = useApp()
  const navigate = useNavigate()

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const stats = useMemo(() => {
    const totalSpaces = spaces.length
    const activeSpaces = spaces.filter((s) => s.active).length
    const todaysBookings = bookings.filter((b) => b.date === todayStr)

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })
    const thisWeekBookings = bookings.filter((b) => {
      try {
        const d = parseISO(b.date)
        return isWithinInterval(d, { start: weekStart, end: weekEnd })
      } catch {
        return false
      }
    })

    return {
      totalSpaces,
      activeSpaces,
      todaysBookings,
      thisWeekCount: thisWeekBookings.length,
    }
  }, [spaces, bookings, todayStr])

  const handleLogout = () => {
    setIsAdmin(false)
    navigate('/')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-blue-600" />
            Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {currentUser ? `Signed in as ${currentUser.name}` : format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="btn-secondary text-sm text-red-600 border-red-200 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">Total Spaces</p>
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalSpaces}</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">Active Spaces</p>
            <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.activeSpaces}</p>
          {stats.totalSpaces > stats.activeSpaces && (
            <p className="text-xs text-amber-600 mt-1">
              {stats.totalSpaces - stats.activeSpaces} inactive
            </p>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">Today's Bookings</p>
            <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.todaysBookings.length}</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">This Week</p>
            <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.thisWeekCount}</p>
          <p className="text-xs text-gray-400 mt-1">bookings</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's bookings table */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Today's Bookings</h2>
              <span className="text-sm text-gray-400">
                {format(new Date(), 'MMM d, yyyy')}
              </span>
            </div>

            {stats.todaysBookings.length === 0 ? (
              <div className="p-10 text-center">
                <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No bookings for today</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {stats.todaysBookings
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((b) => (
                    <div
                      key={b.id}
                      className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-20 text-sm font-medium text-gray-700 flex-shrink-0">
                        {b.startTime}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{b.spaceName}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {b.userName} · {b.userEmail}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400 flex-shrink-0 text-right">
                        <div>{b.startTime} – {b.endTime}</div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="space-y-4">
          <div className="card">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-3 space-y-1">
              <Link
                to="/admin/spaces"
                className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Manage Spaces</p>
                    <p className="text-xs text-gray-400">Add, edit, or disable spaces</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </Link>

              <Link
                to="/admin/hours"
                className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Office Hours</p>
                    <p className="text-xs text-gray-400">Set open/close times per day</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </Link>

              {currentUser?.role === 'superadmin' && (
                <Link
                  to="/admin/users"
                  className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Manage Users</p>
                      <p className="text-xs text-gray-400">Add or remove admin accounts</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </Link>
              )}

              <Link
                to="/admin/locations"
                className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Manage Locations</p>
                    <p className="text-xs text-gray-400">Add, edit or remove locations</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </Link>


              <Link
                to="/admin/bookings"
                className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Manage Bookings</p>
                    <p className="text-xs text-gray-400">View and cancel bookings</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </Link>

              {currentUser?.role === 'superadmin' && (
                <Link
                  to="/admin/config"
                  className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Database className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Manage Configuration</p>
                      <p className="text-xs text-gray-400">Database &amp; app settings</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </Link>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
