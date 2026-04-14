import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Upload, Check, Loader2, MapPin, X, Move, Image, Trash2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { fetchMapFromApi, saveMapToApi } from '../../utils/apiClient'

export default function AdminMap() {
  const { spaces } = useApp()
  const mapRef = useRef(null)

  const [backgroundImage, setBackgroundImage] = useState(null)
  const [pins, setPins] = useState([])
  const [activePlaceId, setActivePlaceId] = useState(null)
  const [dragging, setDragging] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [imgError, setImgError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMapFromApi().then(({ data }) => {
      if (data) {
        setBackgroundImage(data.backgroundImage || null)
        setPins(data.pins || [])
      }
      setLoading(false)
    })
  }, [])

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImgError('')
    if (!file.type.startsWith('image/')) return setImgError('Please upload an image file.')
    if (file.size > 4 * 1024 * 1024) return setImgError('Floor plan must be under 4 MB.')
    const reader = new FileReader()
    reader.onload = (ev) => setBackgroundImage(ev.target.result)
    reader.readAsDataURL(file)
  }

  const getRelativePos = (clientX, clientY) => {
    if (!mapRef.current) return { x: 50, y: 50 }
    const rect = mapRef.current.getBoundingClientRect()
    return {
      x: Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.max(2, Math.min(98, ((clientY - rect.top) / rect.height) * 100)),
    }
  }

  const handleMapClick = (e) => {
    if (!activePlaceId || dragging) return
    const { x, y } = getRelativePos(e.clientX, e.clientY)
    setPins(prev => [...prev.filter(p => p.spaceId !== activePlaceId), { spaceId: activePlaceId, x, y }])
    setActivePlaceId(null)
  }

  const handlePinPointerDown = (e, spaceId) => {
    if (activePlaceId) return
    e.stopPropagation()
    e.preventDefault()
    const pin = pins.find(p => p.spaceId === spaceId)
    if (!pin) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging({ spaceId, startX: e.clientX, startY: e.clientY, origX: pin.x, origY: pin.y })
  }

  const handlePinPointerMove = (e, spaceId) => {
    if (!dragging || dragging.spaceId !== spaceId || !mapRef.current) return
    const rect = mapRef.current.getBoundingClientRect()
    const dx = ((e.clientX - dragging.startX) / rect.width) * 100
    const dy = ((e.clientY - dragging.startY) / rect.height) * 100
    setPins(prev => prev.map(p =>
      p.spaceId === spaceId
        ? { ...p, x: Math.max(2, Math.min(98, dragging.origX + dx)), y: Math.max(2, Math.min(98, dragging.origY + dy)) }
        : p
    ))
  }

  const handlePinPointerUp = () => setDragging(null)

  const removePin = (e, spaceId) => {
    e.stopPropagation()
    setPins(prev => prev.filter(p => p.spaceId !== spaceId))
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    await saveMapToApi({ backgroundImage, pins })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const activeSpaces = spaces.filter(s => s.active)
  const placedIds = new Set(pins.map(p => p.spaceId))

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 flex items-center justify-center min-h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/dashboard" className="btn-secondary text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-blue-600" /> Floor Map Editor
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Upload a floor plan, then click a space name and place its pin on the map.
          </p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Map'}
        </button>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          {/* Upload background */}
          <div className="card p-4">
            <h2 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
              <Image className="w-4 h-4 text-gray-500" /> Floor Plan Image
            </h2>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-500 text-center">
                {backgroundImage ? 'Replace image' : 'Upload floor plan'}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            {imgError && <p className="text-xs text-red-600 mt-2">{imgError}</p>}
            {backgroundImage && (
              <button
                onClick={() => { setBackgroundImage(null); setPins([]) }}
                className="mt-2 text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Remove image &amp; pins
              </button>
            )}
          </div>

          {/* Space list */}
          <div className="card p-4">
            <h2 className="font-semibold text-gray-900 text-sm mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" /> Spaces
            </h2>
            <p className="text-xs text-gray-400 mb-3">
              {activePlaceId
                ? 'Click on the map to place this pin'
                : 'Select a space to place its pin'}
            </p>
            {activeSpaces.length === 0 && (
              <p className="text-xs text-gray-400">No active spaces</p>
            )}
            <div className="space-y-1.5">
              {activeSpaces.map(space => {
                const placed = placedIds.has(space.id)
                const isActive = activePlaceId === space.id
                return (
                  <div key={space.id} className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                    isActive ? 'border-blue-400 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'
                  }`}>
                    <button
                      onClick={() => setActivePlaceId(isActive ? null : space.id)}
                      className="flex-1 text-left flex items-center gap-2 min-w-0"
                    >
                      <MapPin className={`w-4 h-4 flex-shrink-0 ${placed ? 'text-blue-600' : 'text-gray-300'}`} />
                      <span className="text-sm font-medium text-gray-800 truncate">{space.name}</span>
                      {placed && !isActive && (
                        <span className="ml-auto text-xs text-green-600 font-medium flex-shrink-0">Placed</span>
                      )}
                      {isActive && (
                        <span className="ml-auto text-xs text-blue-600 font-medium flex-shrink-0">Placing…</span>
                      )}
                    </button>
                    {placed && (
                      <button
                        onClick={(e) => removePin(e, space.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                        title="Remove pin"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {pins.length > 0 && (
            <div className="text-xs text-gray-400 flex items-center gap-1.5 px-1">
              <Move className="w-3.5 h-3.5" /> Drag pins to reposition
            </div>
          )}
        </div>

        {/* Map canvas */}
        <div className="card overflow-hidden">
          {!backgroundImage ? (
            <div className="flex flex-col items-center justify-center h-80 text-center p-8">
              <Image className="w-12 h-12 text-gray-200 mb-3" />
              <p className="font-medium text-gray-500 mb-1">No floor plan uploaded</p>
              <p className="text-sm text-gray-400">Upload an image using the panel on the left</p>
            </div>
          ) : (
            <div
              ref={mapRef}
              onClick={handleMapClick}
              className={`relative w-full select-none ${activePlaceId ? 'cursor-crosshair' : 'cursor-default'}`}
              style={{ minHeight: 300 }}
            >
              <img
                src={backgroundImage}
                alt="Floor plan"
                className="w-full h-auto block"
                draggable={false}
              />

              {pins.map(pin => {
                const space = spaces.find(s => s.id === pin.spaceId)
                if (!space) return null
                return (
                  <div
                    key={pin.spaceId}
                    style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: 'translate(-50%, -100%)' }}
                    className="absolute group"
                    onPointerDown={(e) => handlePinPointerDown(e, pin.spaceId)}
                    onPointerMove={(e) => handlePinPointerMove(e, pin.spaceId)}
                    onPointerUp={handlePinPointerUp}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {space.name}
                    </div>
                    {/* Pin */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-grab active:cursor-grabbing ${
                      dragging?.spaceId === pin.spaceId ? 'scale-125' : ''
                    }`} style={{ background: 'var(--color-primary)' }}>
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    {/* Pin stem */}
                    <div className="w-0.5 h-2 mx-auto" style={{ background: 'var(--color-primary)' }} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
