import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Building2, MapPin, ChevronRight, ChevronDown } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { format } from 'date-fns'

export default function Home() {
  const { spaces, hours, locations, config } = useApp()
  const logo = config?.logo || ''
  const appName = config?.appName || 'SpaceBooker'
  const tagline = config?.tagline || 'Reserve rooms, desks and meeting spaces — quickly and easily.'

  const todayDayNum = new Date().getDay()
  const todayHours = hours[todayDayNum]
  const isTodayClosed = !todayHours || todayHours.closed

  const activeLocations = useMemo(() => locations.filter(l => l.active), [locations])
  const hasLocations = activeLocations.length > 0

  // Count active spaces per location
  const spaceCountByLocation = useMemo(() => {
    const counts = {}
    spaces.filter(s => s.active).forEach(s => {
      if (s.locationId) counts[s.locationId] = (counts[s.locationId] || 0) + 1
    })
    return counts
  }, [spaces])

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
      {/* Hero */}
      <div className="rounded-2xl px-4 py-4 sm:px-6 sm:py-12 mb-5 sm:mb-10 text-white text-center"
        style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)' }}>
        <div className="flex justify-center mb-2 sm:mb-5">
          {logo
            ? <img src={logo} alt={appName} className="h-10 sm:h-24 w-auto object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
            : <Building2 className="w-6 h-6 sm:w-12 sm:h-12 opacity-80" />
          }
        </div>
        <h1 className="text-base sm:text-4xl font-bold mb-1 sm:mb-3">{appName}</h1>
        {tagline && (
          <p className="hidden sm:block text-white/80 text-lg max-w-xl mx-auto mb-0">{tagline}</p>
        )}
      </div>

      {hasLocations ? (
        <LocationGrid locations={activeLocations} spaceCountByLocation={spaceCountByLocation} />
      ) : (
        <AllSpacesView spaces={spaces} hours={hours} isTodayClosed={isTodayClosed} todayDayNum={todayDayNum} />
      )}
    </div>
  )
}

// ── Location cards ────────────────────────────────────────────────────────

function LocationGrid({ locations, spaceCountByLocation }) {
  return (
    <>
      <p className="text-sm text-gray-500 mb-5">
        {locations.length} location{locations.length !== 1 ? 's' : ''} available
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
        {locations.map(loc => {
          const count = spaceCountByLocation[loc.id] || 0
          return (
            <Link key={loc.id} to={`/location/${loc.id}`}
              className="card hover:shadow-md transition-shadow duration-200 overflow-hidden group flex flex-col">
              {/* Image */}
              <div className="h-40 bg-gray-100 relative overflow-hidden flex-shrink-0">
                {loc.images && loc.images.length > 0 ? (
                  <img src={loc.images[0]} alt={loc.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-primary) 100%)' }}>
                    <MapPin className="w-10 h-10 text-white/60" />
                  </div>
                )}
              </div>
              {/* Content */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col">
                <h2 className="font-semibold text-gray-900 text-lg mb-1">{loc.name}</h2>
                {loc.address && (
                  <p className="text-xs text-gray-400 flex items-center gap-1 mb-2">
                    <MapPin className="w-3 h-3" />{loc.address}
                  </p>
                )}
                {loc.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{loc.description}</p>
                )}
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {count} space{count !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all"
                    style={{ color: 'var(--color-primary)' }}>
                    View spaces <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </>
  )
}

// ── Fallback: all spaces (no locations configured) ────────────────────────

import { Users, Calendar, Lock } from 'lucide-react'
import { useApp as useAppInner } from '../context/AppContext'
import { generateTimeSlots } from '../utils/data'
import { parseISO, isBefore, startOfDay } from 'date-fns'

function AllSpacesView({ spaces, hours, isTodayClosed, todayDayNum }) {
  const { bookings, member } = useAppInner()
  const [typeFilter, setTypeFilter] = useState('all')
  const [capacityFilter, setCapacityFilter] = useState('all')
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const filteredSpaces = useMemo(() => {
    return spaces
      .filter(s => s.active)
      .filter(s => typeFilter === 'all' || s.type === typeFilter)
      .filter(s => {
        if (capacityFilter === 'all') return true
        if (capacityFilter === '1') return s.capacity === 1
        if (capacityFilter === '2-4') return s.capacity >= 2 && s.capacity <= 4
        if (capacityFilter === '5-8') return s.capacity >= 5 && s.capacity <= 8
        if (capacityFilter === '9+') return s.capacity >= 9
        return true
      })
  }, [spaces, typeFilter, capacityFilter])

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="flex gap-2">
          {[{ val: 'all', label: 'All Spaces' }, { val: 'room', label: 'Rooms' }, { val: 'table', label: 'Desks' }].map(({ val, label }) => (
            <button key={val} onClick={() => setTypeFilter(val)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${typeFilter === val ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto">
          <select value={capacityFilter} onChange={e => setCapacityFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-9 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
            <option value="all">Any Capacity</option>
            <option value="1">1 person</option>
            <option value="2-4">2–4 people</option>
            <option value="5-8">5–8 people</option>
            <option value="9+">9+ people</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-5">{filteredSpaces.length} space{filteredSpaces.length !== 1 ? 's' : ''} available</p>

      {filteredSpaces.length === 0 ? (
        <div className="card p-12 text-center">
          <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No spaces match your filters</p>
          <button onClick={() => { setTypeFilter('all'); setCapacityFilter('all') }} className="mt-4 btn-secondary text-sm">Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {filteredSpaces.map(space => (
            <SpaceCard key={space.id} space={space} member={member} isTodayClosed={isTodayClosed} todayBookings={bookings.filter(b => b.spaceId === space.id && b.date === todayStr)} />
          ))}
        </div>
      )}
    </>
  )
}

export function SpaceCard({ space, member, isTodayClosed, todayBookings = [] }) {
  return (
    <div className="card hover:shadow-md transition-shadow duration-200 flex flex-col">
      <div className="p-3 sm:p-5 flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${space.type === 'room' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                {space.type === 'room' ? 'Room' : 'Desk'}
              </span>
              <span className={`inline-flex items-center gap-1 text-xs font-medium ${isTodayClosed ? 'text-gray-400' : 'text-green-600'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isTodayClosed ? 'bg-gray-300' : 'bg-green-500'}`} />
                {isTodayClosed ? 'Closed today' : 'Available today'}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">{space.name}</h3>
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{space.description}</p>
        <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-4">
          <Users className="w-4 h-4 text-gray-400" />
          {space.capacity} {space.capacity === 1 ? 'person' : 'people'}
        </div>
        {space.amenities && space.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {space.amenities.slice(0, 4).map(a => (
              <span key={a} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{a}</span>
            ))}
            {space.amenities.length > 4 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">+{space.amenities.length - 4} more</span>
            )}
          </div>
        )}
      </div>
      <div className="px-3 pb-3 sm:px-5 sm:pb-5">
        {member ? (
          <Link to={`/book/${space.id}`} className="btn-primary w-full text-sm">
            <Calendar className="w-4 h-4" /> Book Now
          </Link>
        ) : (
          <Link to="/login" className="btn-secondary w-full text-sm justify-center">
            <Lock className="w-4 h-4" /> Sign in to book
          </Link>
        )}
      </div>
    </div>
  )
}
