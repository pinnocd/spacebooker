import React, { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  Check,
  ChevronRight,
  AlertCircle,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useApp } from '../context/AppContext'
import {
  generateTimeSlots,
  isSlotAvailable,
  addBooking,
  getBookingsForSpaceAndDate,
} from '../utils/data'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export default function BookSpace() {
  const { spaceId } = useParams()
  const { spaces, hours, refreshData } = useApp()
  const navigate = useNavigate()

  const space = spaces.find((s) => s.id === spaceId)

  const [step, setStep] = useState(1)
  const [selectedDate, setSelectedDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [successBooking, setSuccessBooking] = useState(null)

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const dayHours = useMemo(() => {
    if (!selectedDate) return null
    const d = parseISO(selectedDate)
    const dayNum = d.getDay()
    return hours[dayNum]
  }, [selectedDate, hours])

  const isDayClosed = dayHours?.closed ?? true

  const timeSlots = useMemo(() => {
    if (!selectedDate || isDayClosed || !dayHours) return []
    return generateTimeSlots(dayHours.open, dayHours.close)
  }, [selectedDate, isDayClosed, dayHours])

  const existingBookings = useMemo(() => {
    if (!selectedDate) return []
    return getBookingsForSpaceAndDate(spaceId, selectedDate)
  }, [spaceId, selectedDate])

  // A start-time slot is unavailable if ALL 30-min blocks starting there are taken
  const isStartTimeUnavailable = (slot) => {
    const slotMins = timeToMinutes(slot)
    const minEnd = slotMins + 30
    // Check if a 30-min booking from this slot is available
    const endSlotStr = minsToTime(minEnd)
    return !isSlotAvailable(spaceId, selectedDate, slot, endSlotStr)
  }

  const minsToTime = (mins) => {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const endTimeOptions = useMemo(() => {
    if (!startTime || timeSlots.length === 0) return []
    const startMins = timeToMinutes(startTime)
    // End options are slots that are after start
    const opts = timeSlots.filter((s) => timeToMinutes(s) > startMins)
    // Also add the close time if it's not already there
    const closeTime = dayHours?.close
    if (closeTime && !opts.includes(closeTime)) {
      const closeTimeMins = timeToMinutes(closeTime)
      if (closeTimeMins > startMins) {
        opts.push(closeTime)
      }
    }
    return opts
  }, [startTime, timeSlots, dayHours])

  const isEndTimeConflict = (end) => {
    if (!startTime || !end) return false
    return !isSlotAvailable(spaceId, selectedDate, startTime, end)
  }

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value)
    setStartTime('')
    setEndTime('')
    setStep(2)
  }

  const handleStartTime = (slot) => {
    setStartTime(slot)
    setEndTime('')
  }

  const validate = () => {
    const errs = {}
    if (!userName.trim()) errs.userName = 'Name is required'
    if (!userEmail.trim()) errs.userEmail = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail))
      errs.userEmail = 'Invalid email address'
    if (!selectedDate) errs.date = 'Please select a date'
    if (!startTime) errs.startTime = 'Please select a start time'
    if (!endTime) errs.endTime = 'Please select an end time'
    if (startTime && endTime && timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      errs.endTime = 'End time must be after start time'
    }
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    // Double-check availability
    if (!isSlotAvailable(spaceId, selectedDate, startTime, endTime)) {
      setErrors({ submit: 'This time slot is no longer available. Please choose another.' })
      return
    }

    setSubmitting(true)
    try {
      const booking = addBooking({
        spaceId,
        spaceName: space.name,
        userName: userName.trim(),
        userEmail: userEmail.trim().toLowerCase(),
        date: selectedDate,
        startTime,
        endTime,
        notes: notes.trim(),
      })
      refreshData()
      setSuccessBooking(booking)
    } catch (err) {
      setErrors({ submit: 'Something went wrong. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (!space) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Space not found</h2>
        <p className="text-gray-500 mb-6">This space doesn't exist or has been removed.</p>
        <Link to="/" className="btn-primary">
          <ArrowLeft className="w-4 h-4" />
          Back to spaces
        </Link>
      </div>
    )
  }

  if (!space.active) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Space unavailable</h2>
        <p className="text-gray-500 mb-6">This space is currently not available for booking.</p>
        <Link to="/" className="btn-primary">
          <ArrowLeft className="w-4 h-4" />
          Back to spaces
        </Link>
      </div>
    )
  }

  // Success screen
  if (successBooking) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-500 mb-6">Your workspace has been successfully reserved.</p>

          <div className="bg-gray-50 rounded-xl p-5 text-left space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Space</span>
              <span className="text-sm font-medium text-gray-900">{successBooking.spaceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Date</span>
              <span className="text-sm font-medium text-gray-900">
                {format(parseISO(successBooking.date), 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Time</span>
              <span className="text-sm font-medium text-gray-900">
                {successBooking.startTime} – {successBooking.endTime}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Name</span>
              <span className="text-sm font-medium text-gray-900">{successBooking.userName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Email</span>
              <span className="text-sm font-medium text-gray-900">{successBooking.userEmail}</span>
            </div>
            {successBooking.notes && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Notes</span>
                <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">
                  {successBooking.notes}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Booking ID</span>
              <span className="text-xs font-mono text-gray-400">{successBooking.id}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/" className="btn-secondary flex-1 justify-center">
              <ArrowLeft className="w-4 h-4" />
              Back to Spaces
            </Link>
            <Link to="/my-bookings" className="btn-primary flex-1 justify-center">
              View My Bookings
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to spaces
      </Link>

      {/* Space summary */}
      <div className="card p-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">{space.name}</h1>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  space.type === 'room'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {space.type === 'room' ? 'Room' : 'Desk'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-2">{space.description}</p>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Users className="w-4 h-4 text-gray-400" />
              <span>
                Up to {space.capacity} {space.capacity === 1 ? 'person' : 'people'}
              </span>
            </div>
            {space.amenities && space.amenities.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {space.amenities.map((a) => (
                  <span key={a} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                    {a}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking form */}
      <form onSubmit={handleSubmit} noValidate>
        {/* Step 1: Date */}
        <div className="card p-5 mb-4">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
              1
            </span>
            Select a Date
          </h2>
          <div>
            <label className="label" htmlFor="booking-date">
              Date
            </label>
            <input
              id="booking-date"
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              min={todayStr}
              className="input"
            />
            {errors.date && <p className="mt-1.5 text-sm text-red-600">{errors.date}</p>}
          </div>

          {selectedDate && isDayClosed && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-700">
                The office is closed on{' '}
                <strong>{DAY_NAMES[parseISO(selectedDate).getDay()]}</strong>. Please choose
                another date.
              </p>
            </div>
          )}

          {selectedDate && !isDayClosed && dayHours && (
            <p className="mt-3 text-sm text-green-700 flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              Open {dayHours.open} – {dayHours.close} on{' '}
              {DAY_NAMES[parseISO(selectedDate).getDay()]}
            </p>
          )}
        </div>

        {/* Step 2: Time */}
        {selectedDate && !isDayClosed && (
          <div className="card p-5 mb-4">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                2
              </span>
              Select Time
            </h2>

            {/* Start time */}
            <div className="mb-4">
              <label className="label">Start Time</label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {timeSlots.slice(0, -1).map((slot) => {
                  const unavailable = isStartTimeUnavailable(slot)
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={unavailable}
                      onClick={() => handleStartTime(slot)}
                      className={`px-2 py-2 rounded-lg text-sm font-medium transition-colors border ${
                        startTime === slot
                          ? 'bg-blue-600 text-white border-blue-600'
                          : unavailable
                          ? 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                      }`}
                    >
                      {slot}
                    </button>
                  )
                })}
              </div>
              {errors.startTime && (
                <p className="mt-1.5 text-sm text-red-600">{errors.startTime}</p>
              )}
            </div>

            {/* End time */}
            {startTime && (
              <div>
                <label className="label">
                  End Time{' '}
                  <span className="text-gray-400 font-normal">(must be after {startTime})</span>
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {endTimeOptions.map((slot) => {
                    const conflict = isEndTimeConflict(slot)
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={conflict}
                        onClick={() => setEndTime(slot)}
                        className={`px-2 py-2 rounded-lg text-sm font-medium transition-colors border ${
                          endTime === slot
                            ? 'bg-blue-600 text-white border-blue-600'
                            : conflict
                            ? 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                        }`}
                      >
                        {slot}
                      </button>
                    )
                  })}
                </div>
                {errors.endTime && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.endTime}</p>
                )}
              </div>
            )}

            {/* Existing bookings for the day */}
            {existingBookings.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 mb-2">Already booked on this day:</p>
                <div className="space-y-1">
                  {existingBookings.map((b) => (
                    <div key={b.id} className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>
                        {b.startTime} – {b.endTime}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Details */}
        {selectedDate && !isDayClosed && (
          <div className="card p-5 mb-4">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                3
              </span>
              Your Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="label" htmlFor="user-name">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="user-name"
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Jane Smith"
                  className="input"
                  autoComplete="name"
                />
                {errors.userName && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.userName}</p>
                )}
              </div>

              <div>
                <label className="label" htmlFor="user-email">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="user-email"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="jane@company.com"
                  className="input"
                  autoComplete="email"
                />
                {errors.userEmail && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.userEmail}</p>
                )}
              </div>

              <div>
                <label className="label" htmlFor="notes">
                  Notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requirements or notes..."
                  rows={3}
                  className="input resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Summary & submit */}
        {selectedDate && !isDayClosed && (
          <div className="card p-5">
            {startTime && endTime && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-blue-800 mb-2">Booking Summary</p>
                <div className="space-y-1 text-sm text-blue-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {startTime} – {endTime}
                  </div>
                </div>
              </div>
            )}

            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !startTime || !endTime}
              className="btn-primary w-full"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirm Booking
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
