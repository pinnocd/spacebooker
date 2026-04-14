import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Users, Calendar, ChevronLeft, ChevronRight, X, Lock, Loader2, Image } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { fetchMapFromApi } from '../utils/apiClient'

export default function SpaceMap() {
  const { spaces, member } = useApp()
  const [mapData, setMapData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null) // space object
  const [imgIndex, setImgIndex] = useState(0)

  useEffect(() => {
    fetchMapFromApi().then(({ data }) => {
      setMapData(data || { backgroundImage: null, pins: [] })
      setLoading(false)
    })
  }, [])

  const openSpace = (spaceId) => {
    const space = spaces.find(s => s.id === spaceId)
    if (space) { setSelected(space); setImgIndex(0) }
  }

  const closeModal = () => setSelected(null)

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!mapData?.backgroundImage) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <Image className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <h2 className="font-semibold text-gray-600 mb-1">Floor map not available yet</h2>
        <p className="text-sm text-gray-400 mb-4">An admin needs to upload the floor plan.</p>
        <Link to="/" className="btn-secondary text-sm">Browse spaces</Link>
      </div>
    )
  }

  const pins = mapData.pins || []

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-1">
          <MapPin className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
          Floor Map
        </h1>
        <p className="text-sm text-gray-500">Click a pin to view space details and photos.</p>
      </div>

      <div className="card overflow-hidden relative">
        <div className="relative w-full select-none">
          <img
            src={mapData.backgroundImage}
            alt="Floor plan"
            className="w-full h-auto block"
            draggable={false}
          />

          {pins.map(pin => {
            const space = spaces.find(s => s.id === pin.spaceId)
            if (!space || !space.active) return null
            const isSelected = selected?.id === pin.spaceId
            return (
              <button
                key={pin.spaceId}
                onClick={() => openSpace(pin.spaceId)}
                style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: 'translate(-50%, -100%)' }}
                className="absolute group focus:outline-none"
                title={space.name}
              >
                {/* Label */}
                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded whitespace-nowrap text-xs font-medium shadow transition-all z-10 pointer-events-none
                  ${isSelected ? 'opacity-100 text-white' : 'opacity-0 group-hover:opacity-100 bg-gray-900 text-white'}`}
                  style={isSelected ? { background: 'var(--color-primary)' } : {}}>
                  {space.name}
                </div>
                {/* Pin */}
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

      {/* Space detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={closeModal}>
          <div
            className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    selected.type === 'room' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {selected.type === 'room' ? 'Room' : 'Desk'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">{selected.name}</h2>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                  <Users className="w-4 h-4" />
                  Up to {selected.capacity} {selected.capacity === 1 ? 'person' : 'people'}
                </div>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors ml-4 flex-shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo carousel */}
            {selected.images && selected.images.length > 0 && (
              <div className="relative bg-gray-100">
                <img
                  src={selected.images[imgIndex]}
                  alt={`${selected.name} photo ${imgIndex + 1}`}
                  className="w-full h-52 object-cover"
                />
                {selected.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setImgIndex(i => (i - 1 + selected.images.length) % selected.images.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setImgIndex(i => (i + 1) % selected.images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {selected.images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setImgIndex(i)}
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIndex ? 'bg-white' : 'bg-white/50'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Details */}
            <div className="p-5 space-y-4">
              {selected.description && (
                <p className="text-sm text-gray-600">{selected.description}</p>
              )}

              {selected.amenities && selected.amenities.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.amenities.map(a => (
                      <span key={a} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">{a}</span>
                    ))}
                  </div>
                </div>
              )}

              {member ? (
                <Link
                  to={`/book/${selected.id}`}
                  className="btn-primary w-full justify-center"
                  onClick={closeModal}
                >
                  <Calendar className="w-4 h-4" />
                  Book this space
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="btn-secondary w-full justify-center"
                  onClick={closeModal}
                >
                  <Lock className="w-4 h-4" />
                  Sign in to book
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
