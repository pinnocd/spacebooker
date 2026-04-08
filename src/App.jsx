import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import BookSpace from './pages/BookSpace'
import MyBookings from './pages/MyBookings'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminSpaces from './pages/admin/AdminSpaces'
import AdminHours from './pages/admin/AdminHours'
import AdminUsers from './pages/admin/AdminUsers'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/book/:spaceId" element={<BookSpace />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/admin" element={<AdminLogin />} />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/spaces"
                element={
                  <ProtectedRoute>
                    <AdminSpaces />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/hours"
                element={
                  <ProtectedRoute>
                    <AdminHours />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute>
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
            <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400">
              © {new Date().getFullYear()} OfficeBook — All rights reserved
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AppProvider>
  )
}
