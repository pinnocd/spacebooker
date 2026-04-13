import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Clock,
  X,
  BookOpen,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  User,
} from 'lucide-react'
import { format, parseISO, isBefore } from 'date-fns'
import { useApp } from '../context/AppContext'

export default function MyBookings() {
  const { bookings, cancelBooking, member } = useApp()
  const [tab, setTab] = useState('upcoming')
  const [confirmCancel, setConfirmCancel] = useState(null)

  const isUpcoming = (booking) => {
    // Combine date + endTime into a full datetime and compare against now
    const endDateTime = parseISO(`${booking.date}T${booking.endTime}`)
    return !isBefore(endDateTime, new Date())
  }

  const { upcoming, past } = useMemo(() => {
    if (!member) return { upcoming: [], past: [] }
    const mine = bookings.filter(
      (b) => b.userEmail.toLowerCase() === member.email.toLowerCase()
    )
    return {
      upcoming: mine
        .filter(isUpcoming)
        .sort((a, b) => a.date !== b.date ? a.date.localeCompare(b.date) : a.startTime.localeCompare(b.startTime)),
      past: mine
        .filter((b) => !isUpcoming(b))
        .sort((a, b) => a.date !== b.date ? b.date.localeCompare(a.date) : b.startTime.localeCompare(a.startTime)),
    }
  }, [bookings, member])

  const handleConfirmCancel = () => {
    if (!confirmCancel) return
    cancelBooking(confirmCancel.id)
    setConfirmCancel(null)
  }

  // Not signed in
  if (!member) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="card p-12 text-center">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-700 mb-1">Sign in to view your bookings</h3>
          <p className="text-sm text-gray-400 mb-6">You need an account to manage your bookings.</p>
          <div className="flex justify-center gap-3">
            <Link to="/login" className="btn-primary text-sm">Sign in</Link>
            <Link to="/register" className="btn-secondary text-sm">Create account</Link>
          </div>
        </div>
      </div>
    )
  }

  const tabList = [
    { key: 'upcoming', label: 'Upcoming', count: upcoming.length },
    { key: 'past',     label: 'Past',     count: past.length },
  ]
  const displayed = tab === 'upcoming' ? upcoming : past

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Bookings</h1>
        <p className="text-sm text-gray-500">
          Signed in as <span className="font-medium text-gray-700">{member.name}</span>
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabList.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
              tab === key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Booking list */}
      {displayed.length === 0 ? (
        <div className="card p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-700 mb-1">
            {tab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
          </h3>
          {tab === 'upcoming' && (
            <Link to="/" className="btn-primary text-sm mt-4 inline-flex">
              Browse Spaces <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((booking) => (
            <div key={booking.id} className={`card p-5 ${tab === 'past' ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{booking.spaceName}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      tab === 'upcoming' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {tab === 'upcoming' ? (
                        <><CheckCircle className="w-3 h-3" />Upcoming</>
                      ) : 'Past'}
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
                    <p className="mt-2 text-xs text-gray-400 italic">"{booking.notes}"</p>
                  )}

                  <p className="mt-2 text-xs text-gray-400">
                    Booked: {format(parseISO(booking.createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>

                {tab === 'upcoming' && (
                  <button
                    onClick={() => setConfirmCancel(booking)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
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
                <span className="font-medium">{format(parseISO(confirmCancel.date), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time</span>
                <span className="font-medium">{confirmCancel.startTime} – {confirmCancel.endTime}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setConfirmCancel(null)} className="btn-secondary flex-1">
                Keep it
              </button>
              <button onClick={handleConfirmCancel} className="btn-danger flex-1">
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
