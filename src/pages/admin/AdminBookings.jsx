import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { format, parseISO, isBefore, startOfDay } from 'date-fns'
import { useApp } from '../../context/AppContext'
import { fetchBookingsFromApi } from '../../utils/apiClient'
import { saveBookings } from '../../utils/data'

const PAGE_SIZE = 20

export default function AdminBookings() {
  const { bookings, setBookings, cancelBooking } = useApp()
  const [tab, setTab] = useState('upcoming')
  const [page, setPage] = useState(1)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Refresh from DB on mount
  useEffect(() => {
    fetchBookingsFromApi().then(({ data, error }) => {
      if (!error && Array.isArray(data)) {
        saveBookings(data)
        setBookings(data)
      }
    })
  }, [])

  const today = startOfDay(new Date())

  const { upcoming, past } = useMemo(() => {
    const sorted = [...bookings].sort((a, b) => {
      const cmp = a.date.localeCompare(b.date)
      return cmp !== 0 ? cmp : a.startTime.localeCompare(b.startTime)
    })
    const upcoming = sorted.filter(b => !isBefore(parseISO(b.date), today))
    const past = sorted.filter(b => isBefore(parseISO(b.date), today)).reverse()
    return { upcoming, past }
  }, [bookings])

  const activeList = tab === 'upcoming' ? upcoming : past

  const totalPages = Math.max(1, Math.ceil(activeList.length / PAGE_SIZE))
  const paginated = activeList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleTabChange = (t) => { setTab(t); setPage(1) }

  const handleDelete = async (id) => {
    await cancelBooking(id)
    setDeleteConfirm(null)
  }

  const formatDate = (dateStr) => {
    try { return format(parseISO(dateStr), 'dd MMM yyyy') } catch { return dateStr }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/admin/dashboard"
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Manage Bookings</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {upcoming.length} upcoming · {past.length} past
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-6">
        <button
          onClick={() => handleTabChange('upcoming')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'upcoming'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Upcoming
          {upcoming.length > 0 && (
            <span className="ml-2 bg-blue-100 text-blue-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
              {upcoming.length}
            </span>
          )}
        </button>
        <button
          onClick={() => handleTabChange('past')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'past'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Past
          {past.length > 0 && (
            <span className="ml-2 bg-gray-200 text-gray-600 text-xs font-semibold px-1.5 py-0.5 rounded-full">
              {past.length}
            </span>
          )}
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {paginated.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No {tab} bookings</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Time</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Space</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Notes</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginated.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatDate(b.date)}</td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{b.startTime} – {b.endTime}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{b.spaceName}</td>
                      <td className="px-4 py-3 text-gray-700">{b.userName}</td>
                      <td className="px-4 py-3 text-gray-500">{b.userEmail}</td>
                      <td className="px-4 py-3 text-gray-400 max-w-[180px] truncate">{b.notes || '—'}</td>
                      <td className="px-4 py-3">
                        {deleteConfirm === b.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDelete(b.id)}
                              className="text-xs text-red-600 font-medium hover:text-red-700"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-xs text-gray-400 hover:text-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(b.id)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Cancel booking"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Page {page} of {totalPages} · {activeList.length} bookings
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
