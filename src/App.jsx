import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { AppProvider, useApp } from './context/AppContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import BookSpace from './pages/BookSpace'
import MyBookings from './pages/MyBookings'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminSpaces from './pages/admin/AdminSpaces'
import AdminHours from './pages/admin/AdminHours'
import AdminUsers from './pages/admin/AdminUsers'
import AdminConfig from './pages/admin/AdminConfig'
import AdminBookings from './pages/admin/AdminBookings'
import AdminMap from './pages/admin/AdminMap'
import AdminLocations from './pages/admin/AdminLocations'
import AdminLocationMap from './pages/admin/AdminLocationMap'
import SpaceMap from './pages/SpaceMap'
import LocationSpaces from './pages/LocationSpaces'
import VerifyEmail from './pages/VerifyEmail'
import AccountSettings from './pages/AccountSettings'

function AppShell() {
  const { config } = useApp()
  const appName = config?.appName || 'SpaceBooker'
  const logo = config?.logo || ''

  useEffect(() => {
    document.title = appName
  }, [appName])

  useEffect(() => {
    const link = document.getElementById('app-favicon')
    if (!link) return
    if (logo) {
      link.href = logo
      // Detect mime type from data URL or fall back to png
      const mime = logo.startsWith('data:') ? logo.split(';')[0].slice(5) : 'image/png'
      link.type = mime
    } else {
      link.href = '/favicon.svg'
      link.type = 'image/svg+xml'
    }
  }, [logo])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/book/:spaceId" element={<BookSpace />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/spaces" element={<ProtectedRoute><AdminSpaces /></ProtectedRoute>} />
              <Route path="/admin/hours" element={<ProtectedRoute><AdminHours /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/config" element={<ProtectedRoute><AdminConfig /></ProtectedRoute>} />
              <Route path="/admin/bookings" element={<ProtectedRoute><AdminBookings /></ProtectedRoute>} />
              <Route path="/admin/map" element={<ProtectedRoute><AdminMap /></ProtectedRoute>} />
              <Route path="/admin/locations" element={<ProtectedRoute><AdminLocations /></ProtectedRoute>} />
              <Route path="/admin/locations/:locationId/map" element={<ProtectedRoute><AdminLocationMap /></ProtectedRoute>} />
              <Route path="/map" element={<SpaceMap />} />
              <Route path="/location/:locationId" element={<LocationSpaces />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/account" element={<AccountSettings />} />
            </Routes>
          </main>

          <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
              <span>© {new Date().getFullYear()} {appName} — All rights reserved</span>
              <Link to="/admin"
                className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors text-xs">
                <Shield className="w-3.5 h-3.5" />Admin access
              </Link>
            </div>
          </footer>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AppProvider>
  )
}
