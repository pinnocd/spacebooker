import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Users, MapPin, Calendar, ChevronDown, Lock } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { format } from 'date-fns'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function Home() {
  const { spaces, hours, bookings, config, member } = useApp()
  const logo = config?.logo || ''
  const [typeFilter, setTypeFilter] = useState('all')
  const [capacityFilter, setCapacityFilter] = useState('all')

  const todayDayNum = new Date().getDay()
  const todayHours = hours[todayDayNum]
  const isTodayClosed = !todayHours || todayHours.closed

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const filteredSpaces = useMemo(() => {
    return spaces
      .filter((s) => s.active)
      .filter((s) => typeFilter === 'all' || s.type === typeFilter)
      .filter((s) => {
        if (capacityFilter === 'all') return true
        if (capacityFilter === '1') return s.capacity === 1
        if (capacityFilter === '2-4') return s.capacity >= 2 && s.capacity <= 4
        if (capacityFilter === '5-8') return s.capacity >= 5 && s.capacity <= 8
        if (capacityFilter === '9+') return s.capacity >= 9
        return true
      })
  }, [spaces, typeFilter, capacityFilter])

  const getSpaceBookingsToday = (spaceId) => {
    return bookings.filter((b) => b.spaceId === spaceId && b.date === todayStr)
  }

  const hasAvailabilityToday = (space) => {
    if (isTodayClosed) return false
    const todayBookings = getSpaceBookingsToday(space.id)
    // Simple check: if less than the day's total 30-min slots are booked, there's availability
    // We just return true if not fully blocked
    if (todayBookings.length === 0) return true
    return true // simplified — detailed check in BookSpace
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="rounded-2xl px-6 py-12 mb-10 text-white text-center" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)' }}>
        <div className="flex justify-center mb-5">
          {logo
            ? <img src={logo} alt="Logo" className="h-24 w-auto object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
            : <Building2 className="w-12 h-12 opacity-80" />
          }
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Book a space to use at the Trinity Hub</h1>
        <p className="text-white/80 text-lg max-w-xl mx-auto">
          Reserve rooms, desks and the Main Hall — quickly and easily.
        </p>
        {isTodayClosed ? (
          <div className="mt-5 inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-2 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-gray-300" />
            Office closed today ({DAY_NAMES[todayDayNum]})
          </div>
        ) : (
          <div className="mt-5 inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-2 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            Open today {todayHours.open} – {todayHours.close}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2">
          {[
            { val: 'all', label: 'All Spaces' },
            { val: 'room', label: 'Rooms' },
            { val: 'table', label: 'Desks' },
          ].map(({ val, label }) => (
            <button
              key={val}
              onClick={() => setTypeFilter(val)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                typeFilter === val
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative sm:ml-auto">
          <select
            value={capacityFilter}
            onChange={(e) => setCapacityFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-9 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">Any Capacity</option>
            <option value="1">1 person</option>
            <option value="2-4">2–4 people</option>
            <option value="5-8">5–8 people</option>
            <option value="9+">9+ people</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-5">
        {filteredSpaces.length} space{filteredSpaces.length !== 1 ? 's' : ''} available
      </p>

      {/* Space grid */}
      {filteredSpaces.length === 0 ? (
        <div className="card p-12 text-center">
          <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No spaces match your filters</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting the filters above</p>
          <button
            onClick={() => { setTypeFilter('all'); setCapacityFilter('all') }}
            className="mt-4 btn-secondary text-sm"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSpaces.map((space) => {
            const available = hasAvailabilityToday(space)
            return (
              <div key={space.id} className="card hover:shadow-md transition-shadow duration-200 flex flex-col">
                {/* Card header */}
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            space.type === 'room'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {space.type === 'room' ? 'Room' : 'Desk'}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium ${
                            isTodayClosed
                              ? 'text-gray-400'
                              : available
                              ? 'text-green-600'
                              : 'text-gray-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isTodayClosed
                                ? 'bg-gray-300'
                                : available
                                ? 'bg-green-500'
                                : 'bg-gray-300'
                            }`}
                          />
                          {isTodayClosed ? 'Closed today' : 'Available today'}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 text-lg">{space.name}</h3>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{space.description}</p>

                  <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-4">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>
                      {space.capacity} {space.capacity === 1 ? 'person' : 'people'}
                    </span>
                  </div>

                  {/* Amenities */}
                  {space.amenities && space.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {space.amenities.slice(0, 4).map((a) => (
                        <span
                          key={a}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                        >
                          {a}
                        </span>
                      ))}
                      {space.amenities.length > 4 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                          +{space.amenities.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card footer */}
                <div className="px-5 pb-5">
                  {member ? (
                    <Link
                      to={`/book/${space.id}`}
                      className="btn-primary w-full text-sm"
                    >
                      <Calendar className="w-4 h-4" />
                      Book Now
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      className="btn-secondary w-full text-sm justify-center"
                    >
                      <Lock className="w-4 h-4" />
                      Sign in to book
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
