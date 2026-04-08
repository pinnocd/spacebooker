import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Clock, Check, Save, ToggleLeft, ToggleRight } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Reorder so Monday is first for display
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

export default function AdminHours() {
  const { hours, setHours } = useApp()
  const [localHours, setLocalHours] = useState({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Deep clone to avoid mutating context
    const clone = {}
    for (let i = 0; i <= 6; i++) {
      clone[i] = hours[i]
        ? { ...hours[i] }
        : { open: '09:00', close: '18:00', closed: false }
    }
    setLocalHours(clone)
  }, [hours])

  const handleToggleClosed = (dayNum) => {
    setLocalHours((prev) => ({
      ...prev,
      [dayNum]: { ...prev[dayNum], closed: !prev[dayNum].closed },
    }))
    setSaved(false)
  }

  const handleTimeChange = (dayNum, field, value) => {
    setLocalHours((prev) => ({
      ...prev,
      [dayNum]: { ...prev[dayNum], [field]: value },
    }))
    setSaved(false)
  }

  const handleSave = () => {
    // Validate: for non-closed days, open must be before close
    for (let i = 0; i <= 6; i++) {
      const day = localHours[i]
      if (!day.closed) {
        const [oh, om] = day.open.split(':').map(Number)
        const [ch, cm] = day.close.split(':').map(Number)
        if (oh * 60 + om >= ch * 60 + cm) {
          alert(`${DAY_NAMES[i]}: Open time must be before close time.`)
          return
        }
      }
    }
    setHours(localHours)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const todayDayNum = new Date().getDay()

  if (Object.keys(localHours).length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <Clock className="w-8 h-8 text-gray-300 mx-auto animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          to="/admin/dashboard"
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" />
            Office Hours
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Set open and close times for each day of the week
          </p>
        </div>
      </div>

      {/* Schedule editor */}
      <div className="card overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
          <p className="text-sm font-medium text-gray-600">Weekly Schedule</p>
        </div>

        <div className="divide-y divide-gray-100">
          {DISPLAY_ORDER.map((dayNum) => {
            const day = localHours[dayNum]
            if (!day) return null
            const isToday = dayNum === todayDayNum

            return (
              <div
                key={dayNum}
                className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
                  isToday ? 'bg-blue-50/50' : ''
                }`}
              >
                {/* Day name */}
                <div className="flex items-center gap-2 w-32 flex-shrink-0">
                  <span className="font-medium text-gray-900 text-sm">
                    {DAY_NAMES[dayNum]}
                  </span>
                  {isToday && (
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-xs font-medium">
                      Today
                    </span>
                  )}
                </div>

                {/* Closed toggle */}
                <button
                  onClick={() => handleToggleClosed(dayNum)}
                  className="flex items-center gap-2 flex-shrink-0"
                >
                  {day.closed ? (
                    <>
                      <ToggleLeft className="w-7 h-7 text-gray-400" />
                      <span className="text-sm text-gray-400 font-medium w-14">Closed</span>
                    </>
                  ) : (
                    <>
                      <ToggleRight className="w-7 h-7 text-green-500" />
                      <span className="text-sm text-green-700 font-medium w-14">Open</span>
                    </>
                  )}
                </button>

                {/* Time inputs */}
                {!day.closed ? (
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500 w-8">From</label>
                      <input
                        type="time"
                        value={day.open}
                        onChange={(e) => handleTimeChange(dayNum, 'open', e.target.value)}
                        className="input text-sm py-1.5 w-32"
                      />
                    </div>
                    <span className="text-gray-400 text-sm">–</span>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500 w-5">To</label>
                      <input
                        type="time"
                        value={day.close}
                        onChange={(e) => handleTimeChange(dayNum, 'close', e.target.value)}
                        className="input text-sm py-1.5 w-32"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 text-sm text-gray-400 italic">
                    No bookings accepted on this day
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center justify-between">
        <div>
          {saved && (
            <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
              <Check className="w-4 h-4" />
              Hours saved successfully!
            </div>
          )}
        </div>
        <button onClick={handleSave} className="btn-primary">
          <Save className="w-4 h-4" />
          Save Hours
        </button>
      </div>

      {/* Summary */}
      <div className="card p-5 mt-6">
        <h3 className="font-semibold text-gray-900 mb-4 text-sm">Current Hours Summary</h3>
        <div className="grid grid-cols-2 gap-2">
          {DISPLAY_ORDER.map((dayNum) => {
            const day = localHours[dayNum]
            if (!day) return null
            const isToday = dayNum === todayDayNum
            return (
              <div
                key={dayNum}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                  isToday ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'
                }`}
              >
                <span
                  className={`font-medium ${
                    isToday ? 'text-blue-700' : 'text-gray-700'
                  }`}
                >
                  {DAY_ABBR[dayNum]}
                </span>
                {day.closed ? (
                  <span className="text-gray-400 text-xs">Closed</span>
                ) : (
                  <span
                    className={`text-xs ${
                      isToday ? 'text-blue-600' : 'text-gray-500'
                    }`}
                  >
                    {day.open} – {day.close}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
