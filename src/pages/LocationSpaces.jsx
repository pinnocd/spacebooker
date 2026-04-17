import { useState, useMemo, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, ChevronLeft, ChevronRight, ChevronDown, Users, Calendar, Lock, Map, X } from 'lucide-react'
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
  const [showMap, setShowMap] = useState(false)
  const [selectedSpace, setSelectedSpace] = useState(null)
  const [modalImgIndex, setModalImgIndex] = useState(0)

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
        <div className="flex flex-col sm:flex-row items-stretch">
          {/* Left: logo + details */}
          <div className="p-5 flex items-stretch gap-5 flex-1 min-w-0">
            {location.logo && (
              <div className="flex-shrink-0 rounded-xl overflow-hidden border border-gray-200"
                style={{ minWidth: '80px', maxWidth: '160px', width: '20%', alignSelf: 'stretch', background: 'white' }}>
                <img src={location.logo} alt={`${location.name} logo`}
                  className="w-full h-full object-contain" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 mb-0.5">{location.name}</h1>
              {location.tagline && <p className="text-sm text-gray-500 italic mb-1">{location.tagline}</p>}
              {location.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-500 flex items-center gap-1.5 hover:text-blue-600 transition-colors w-fit"
                >
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />{location.address}
                </a>
              )}
              {location.description && <p className="text-sm text-gray-600 mt-2">{location.description}</p>}
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

          {/* Right: photo (50% on desktop, full-width on mobile) */}
          {images.length > 0 && (
            <div className="relative h-48 sm:h-auto sm:w-1/2 flex-shrink-0 bg-gray-100 overflow-hidden self-stretch">
              <img src={images[imgIndex]} alt={location.name} className="absolute inset-0 w-full h-full object-cover" />
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
        </div>
      </div>

      {/* Floor map */}
      {location.floorMap?.backgroundImage && (
        <div className="mb-6">
          <button
            onClick={() => setShowMap(v => !v)}
            className="flex items-center gap-2 text-sm font-medium mb-4 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            <Map className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
            {showMap ? 'Hide floor plan' : 'View floor plan'}
          </button>

          {showMap && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Map className="w-4 h-4 text-gray-500" /> Floor Plan
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Click a pin to view space details</p>
              </div>
              <div className="relative w-full select-none">
                <img
                  src={location.floorMap.backgroundImage}
                  alt="Floor plan"
                  className="w-full h-auto block"
                  draggable={false}
                />
                {(location.floorMap.pins || []).map(pin => {
                  const space = spaces.find(s => s.id === pin.spaceId && s.active)
                  if (!space) return null
                  const isSelected = selectedSpace?.id === pin.spaceId
                  return (
                    <button
                      key={pin.spaceId}
                      onClick={() => { setSelectedSpace(space); setModalImgIndex(0) }}
                      style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: 'translate(-50%, -100%)' }}
                      className="absolute group focus:outline-none"
                      title={space.name}
                    >
                      <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded whitespace-nowrap text-xs font-medium shadow transition-all z-10 pointer-events-none
                        ${isSelected ? 'opacity-100 text-white' : 'opacity-0 group-hover:opacity-100 bg-gray-900 text-white'}`}
                        style={isSelected ? { background: 'var(--color-primary)' } : {}}>
                        {space.name}
                      </div>
                      <div className={`flex items-center justify-center rounded-full border-2 border-white shadow-lg transition-all ${
                        isSelected ? 'w-9 h-9 scale-110' : 'w-7 h-7 hover:scale-110'
                      }`} style={{ background: 'var(--color-primary)' }}>
                        <MapPin className={`text-white ${isSelected ? 'w-5 h-5' : 'w-4 h-4'}`} />
                      </div>
                      <div className="w-0.5 h-2 mx-auto" style={{ background: 'var(--color-primary)' }} />
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

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

      {/* Space detail modal */}
      {selectedSpace && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          onClick={() => setSelectedSpace(null)}
        >
          <div
            className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-5 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    selectedSpace.type === 'room' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {selectedSpace.type === 'room' ? 'Room' : 'Desk'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">{selectedSpace.name}</h2>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                  <Users className="w-4 h-4" />
                  Up to {selectedSpace.capacity} {selectedSpace.capacity === 1 ? 'person' : 'people'}
                </div>
              </div>
              <button onClick={() => setSelectedSpace(null)} className="text-gray-400 hover:text-gray-600 transition-colors ml-4 flex-shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedSpace.images && selectedSpace.images.length > 0 && (
              <div className="relative bg-gray-100">
                <img
                  src={selectedSpace.images[modalImgIndex]}
                  alt={`${selectedSpace.name} photo ${modalImgIndex + 1}`}
                  className="w-full h-52 object-cover"
                />
                {selectedSpace.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setModalImgIndex(i => (i - 1 + selectedSpace.images.length) % selectedSpace.images.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setModalImgIndex(i => (i + 1) % selectedSpace.images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {selectedSpace.images.map((_, i) => (
                        <button key={i} onClick={() => setModalImgIndex(i)}
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${i === modalImgIndex ? 'bg-white' : 'bg-white/50'}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="p-5 space-y-4">
              {selectedSpace.description && (
                <p className="text-sm text-gray-600">{selectedSpace.description}</p>
              )}
              {selectedSpace.amenities && selectedSpace.amenities.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSpace.amenities.map(a => (
                      <span key={a} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">{a}</span>
                    ))}
                  </div>
                </div>
              )}
              {member ? (
                <Link to={`/book/${selectedSpace.id}`} className="btn-primary w-full justify-center"
                  onClick={() => setSelectedSpace(null)}>
                  <Calendar className="w-4 h-4" /> Book this space
                </Link>
              ) : (
                <Link to="/login" className="btn-secondary w-full justify-center"
                  onClick={() => setSelectedSpace(null)}>
                  <Lock className="w-4 h-4" /> Sign in to book
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
