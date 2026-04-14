import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, Plus, Edit, Trash2, X, Check,
  MapPin, AlertCircle, ToggleLeft, ToggleRight,
  Upload, Image,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import {
  createLocationInApi,
  updateLocationInApi,
  deleteLocationFromApi,
} from '../../utils/apiClient'

const EMPTY_FORM = { name: '', description: '', address: '', images: [], active: true }
const MAX_IMAGES = 4
const MAX_IMG_SIZE = 500 * 1024

export default function AdminLocations() {
  const { locations, setLocations } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const openAdd = () => { setForm(EMPTY_FORM); setEditingId(null); setErrors({}); setShowForm(true) }

  const openEdit = (loc) => {
    setForm({ name: loc.name, description: loc.description, address: loc.address, images: loc.images || [], active: loc.active })
    setEditingId(loc.id)
    setErrors({})
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); setErrors({}) }

  const handleSave = () => {
    if (!form.name.trim()) { setErrors({ name: 'Name is required' }); return }

    if (editingId) {
      const updates = { name: form.name.trim(), description: form.description.trim(), address: form.address.trim(), images: form.images, active: form.active }
      setLocations(locations.map(l => l.id === editingId ? { ...l, ...updates } : l))
      updateLocationInApi(editingId, updates)
    } else {
      const loc = { id: crypto.randomUUID(), name: form.name.trim(), description: form.description.trim(), address: form.address.trim(), images: form.images, active: form.active }
      setLocations([...locations, loc])
      createLocationInApi(loc)
    }
    closeForm()
  }

  const handleDelete = (id) => {
    setLocations(locations.filter(l => l.id !== id))
    setDeleteConfirm(null)
    deleteLocationFromApi(id)
  }

  const handleToggle = (id) => {
    const updated = locations.map(l => l.id === id ? { ...l, active: !l.active } : l)
    setLocations(updated)
    const loc = updated.find(l => l.id === id)
    updateLocationInApi(id, { active: loc.active })
  }

  const addImage = (file) => {
    if (!file) return
    if (file.size > MAX_IMG_SIZE) return alert('Image must be under 500 KB')
    const reader = new FileReader()
    reader.onload = (ev) => setForm(f => ({ ...f, images: [...(f.images || []), ev.target.result] }))
    reader.readAsDataURL(file)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/dashboard" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-blue-600" /> Manage Locations
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{locations.length} location{locations.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> Add Location
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6 mb-6 border-blue-200 bg-blue-50/30">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">{editingId ? 'Edit Location' : 'Add Location'}</h2>
            <button onClick={closeForm} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Name <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Trinity Hub — Ground Floor" className="input bg-white" />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label className="label">Address</label>
              <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="e.g. 1 High Street, London" className="input bg-white" />
            </div>
          </div>

          <div className="mb-4">
            <label className="label">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Brief description of this location…" rows={2} className="input bg-white resize-none" />
          </div>

          {/* Images */}
          <div className="mb-4">
            <label className="label flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-gray-400" />
              Photos <span className="text-gray-400 font-normal">(up to {MAX_IMAGES}, 500 KB each)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {(form.images || []).map((src, i) => (
                <div key={i} className="relative w-24 h-20 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                  <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {(form.images || []).length < MAX_IMAGES && (
                <label className="w-24 h-20 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50 flex flex-col items-center justify-center cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-400 mt-1">Add photo</span>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => { addImage(e.target.files?.[0]); e.target.value = '' }} />
                </label>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <button type="button" onClick={() => setForm(f => ({ ...f, active: !f.active }))
            } className="flex items-center gap-2 text-sm font-medium text-gray-700">
              {form.active
                ? <><ToggleRight className="w-8 h-8 text-green-500" />Active (visible to users)</>
                : <><ToggleLeft className="w-8 h-8 text-gray-400" />Inactive (hidden)</>}
            </button>
          </div>

          <div className="flex gap-3">
            <button onClick={closeForm} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} className="btn-primary">
              <Check className="w-4 h-4" /> {editingId ? 'Save Changes' : 'Add Location'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {locations.length === 0 ? (
        <div className="card p-12 text-center">
          <MapPin className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No locations yet — add one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {locations.map(loc => (
            <div key={loc.id} className="card p-4">
              <div className="flex items-start gap-4">
                {/* Thumbnail */}
                {loc.images && loc.images.length > 0 ? (
                  <img src={loc.images[0]} alt={loc.name}
                    className="w-16 h-14 object-cover rounded-lg flex-shrink-0 border border-gray-100" />
                ) : (
                  <div className="w-16 h-14 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-gray-300" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <h3 className="font-semibold text-gray-900 text-sm">{loc.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${loc.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {loc.active ? 'Active' : 'Inactive'}
                    </span>
                    {loc.images?.length > 0 && (
                      <span className="text-xs text-gray-400">{loc.images.length} photo{loc.images.length !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                  {loc.address && <p className="text-xs text-gray-500 mb-0.5">{loc.address}</p>}
                  {loc.description && <p className="text-xs text-gray-400 line-clamp-1">{loc.description}</p>}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => handleToggle(loc.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Toggle active">
                    {loc.active ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button onClick={() => openEdit(loc)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteConfirm(loc)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete Location?</h3>
                <p className="text-sm text-gray-500">Spaces assigned here will be unlinked.</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 mb-5">
              <p className="text-sm font-medium text-gray-900">{deleteConfirm.name}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="btn-danger flex-1">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
