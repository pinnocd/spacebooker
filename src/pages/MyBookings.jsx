import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Calendar,
  Clock,
  X,
  BookOpen,
  ChevronRight,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { format, parseISO, isBefore, startOfDay } from 'date-fns'
import { useApp } from '../context/AppContext'
import { cancelBooking } from '../utils/data'

export default function MyBookings() {
  const { bookings, refreshData } = useApp()
  const [emailInput, setEmailInput] = useState('')
  const [searchedEmail, setSearchedEmail] = useState('')
  const [cancelingId, setCancelingId] = useState(null)
  const [confirmCancel, setConfirmCancel] = useState(null)

  const handleSearch = (e) => {
    e.preventDefault()
    setSearchedEmail(emailInput.trim().toLowerCase())
  }

  const myBookings = useMemo(() => {
    if (!searchedEmail) return []
    return bookings
      .filter((b) => b.userEmail.toLowerCase() === searchedEmail)
      .sort((a, b) => {
        // Sort by date desc
        if (a.date !== b.date) return b.date.localeCompare(a.date)
        return b.startTime.localeCompare(a.startTime)
      })
  }, [bookings, searchedEmail])

  const today = startOfDay(new Date())

  const isUpcoming = (booking) => {
    const bookingDate = startOfDay(parseISO(booking.date))
    return !isBefore(bookingDate, today)
  }

  const handleCancelClick = (booking) => {
    setConfirmCancel(booking)
  }

  const handleConfirmCancel = () => {
    if (!confirmCancel) return
    setCancelingId(confirmCancel.id)
    cancelBooking(confirmCancel.id)
    refreshData()
    setConfirmCancel(null)
    setCancelingId(null)
  }

  const upcomingCount = myBookings.filter(isUpcoming).length
  const pastCount = myBookings.filter((b) => !isUpcoming(b)).length

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Bookings</h1>
        <p className="text-gray-500">Enter your email address to view and manage your bookings.</p>
      </div>

      {/* Email search form */}
      <form onSubmit={handleSearch} className="card p-5 mb-6">
        <label className="label" htmlFor="search-email">
          Email Address
        </label>
        <div className="flex gap-3">
          <input
            id="search-email"
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="jane@company.com"
            className="input flex-1"
            required
          />
          <button type="submit" className="btn-primary flex-shrink-0">
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Find</span>
          </button>
        </div>
      </form>

      {/* Results */}
      {searchedEmail && (
        <>
          {myBookings.length === 0 ? (
            <div className="card p-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-700 mb-1">No bookings found</h3>
              <p className="text-sm text-gray-400 mb-6">
                No bookings found for <strong>{searchedEmail}</strong>
              </p>
              <Link to="/" className="btn-primary text-sm">
                Browse Spaces
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  {myBookings.length} booking{myBookings.length !== 1 ? 's' : ''} for{' '}
                  <span className="font-medium text-gray-700">{searchedEmail}</span>
                </p>
                <div className="flex gap-3 text-xs">
                  {upcomingCount > 0 && (
                    <span className="flex items-center gap-1 text-green-600">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      {upcomingCount} upcoming
                    </span>
                  )}
                  {pastCount > 0 && (
                    <span className="flex items-center gap-1 text-gray-400">
                      <span className="w-2 h-2 rounded-full bg-gray-300" />
                      {pastCount} past
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {myBookings.map((booking) => {
                  const upcoming = isUpcoming(booking)
                  return (
                    <div
                      key={booking.id}
                      className={`card p-5 transition-opacity ${
                        !upcoming ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{booking.spaceName}</h3>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                upcoming
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {upcoming ? (
                                <>
                                  <CheckCircle className="w-3 h-3" />
                                  Upcoming
                                </>
                              ) : (
                                'Past'
                              )}
                            </span>
                          </div>

                          <div className="space-y-1 mt-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {format(parseISO(booking.date), 'EEEE, MMMM d, yyyy')}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4 text-gray-400" />
                              {booking.startTime} – {booking.endTime}
                            </div>
                          </div>

                          {booking.notes && (
                            <p className="mt-2 text-xs text-gray-400 italic">
                              "{booking.notes}"
                            </p>
                          )}

                          <p className="mt-2 text-xs text-gray-400">
                            Booked:{' '}
                            {format(parseISO(booking.createdAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>

                        {upcoming && (
                          <button
                            onClick={() => handleCancelClick(booking)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* Cancel confirmation modal */}
      {confirmCancel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Cancel Booking?</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-5 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Space</span>
                <span className="font-medium">{confirmCancel.spaceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span className="font-medium">
                  {format(parseISO(confirmCancel.date), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time</span>
                <span className="font-medium">
                  {confirmCancel.startTime} – {confirmCancel.endTime}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmCancel(null)}
                className="btn-secondary flex-1"
              >
                Keep it
              </button>
              <button
                onClick={handleConfirmCancel}
                className="btn-danger flex-1"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
