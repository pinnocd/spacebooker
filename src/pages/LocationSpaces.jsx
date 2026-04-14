import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, ChevronLeft, ChevronRight, ChevronDown, Users, Calendar, Lock } from 'lucide-react'
import { format } from 'date-fns'
import { useApp } from '../context/AppContext'
import { SpaceCard } from './Home'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function LocationSpaces() {
  const { locationId } = useParams()
  const { locations, spaces, bookings, hours, member } = useApp()

  const [imgIndex, setImgIndex] = useState(0)
  const [typeFilter, setTypeFilter] = useState('all')
  const [capacityFilter, setCapacityFilter] = useState('all')

  const location = locations.find(l => l.id === locationId)

  const todayDayNum = new Date().getDay()
  const todayHours = hours[todayDayNum]
  const isTodayClosed = !todayHours || todayHours.closed
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const filteredSpaces = useMemo(() => {
    return spaces
      .filter(s => s.active && s.locationId === locationId)
      .filter(s => typeFilter === 'all' || s.type === typeFilter)
      .filter(s => {
        if (capacityFilter === 'all') return true
        if (capacityFilter === '1') return s.capacity === 1
        if (capacityFilter === '2-4') return s.capacity >= 2 && s.capacity <= 4
        if (capacityFilter === '5-8') return s.capacity >= 5 && s.capacity <= 8
        if (capacityFilter === '9+') return s.capacity >= 9
        return true
      })
  }, [spaces, locationId, typeFilter, capacityFilter])

  if (!location) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <h2 className="font-semibold text-gray-600 mb-2">Location not found</h2>
        <Link to="/" className="btn-secondary text-sm">Back to home</Link>
      </div>
    )
  }

  const images = location.images || []

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
      {/* Back */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> All locations
      </Link>

      {/* Location header */}
      <div className="card overflow-hidden mb-6">
        {/* Image carousel */}
        {images.length > 0 && (
          <div className="relative h-48 sm:h-64 bg-gray-100">
            <img src={images[imgIndex]} alt={location.name} className="w-full h-full object-cover" />
            {images.length > 1 && (
              <>
                <button onClick={() => setImgIndex(i => (i - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => setImgIndex(i => (i + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center">
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setImgIndex(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIndex ? 'bg-white' : 'bg-white/50'}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="p-5">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{location.name}</h1>
          {location.address && (
            <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-2">
              <MapPin className="w-4 h-4 text-gray-400" />{location.address}
            </p>
          )}
          {location.description && <p className="text-sm text-gray-600">{location.description}</p>}

          <div className="flex items-center gap-2 mt-3">
            {isTodayClosed ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                <span className="w-2 h-2 rounded-full bg-gray-300" />
                Closed today ({DAY_NAMES[todayDayNum]})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm text-green-600">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Open today {todayHours.open} – {todayHours.close}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
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

      <p className="text-sm text-gray-500 mb-5">{filteredSpaces.length} space{filteredSpaces.length !== 1 ? 's' : ''}</p>

      {filteredSpaces.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No spaces at this location yet</p>
          {typeFilter !== 'all' || capacityFilter !== 'all' ? (
            <button onClick={() => { setTypeFilter('all'); setCapacityFilter('all') }} className="mt-4 btn-secondary text-sm">Clear filters</button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {filteredSpaces.map(space => (
            <SpaceCard
              key={space.id}
              space={space}
              member={member}
              isTodayClosed={isTodayClosed}
              todayBookings={bookings.filter(b => b.spaceId === space.id && b.date === todayStr)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
