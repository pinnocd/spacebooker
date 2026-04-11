import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Edit,
  Trash2,
  X,
  Check,
  ArrowLeft,
  Building2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { createSpaceInApi, updateSpaceInApi, deleteSpaceFromApi } from '../../utils/apiClient'

const EMPTY_FORM = {
  name: '',
  type: 'room',
  capacity: 1,
  description: '',
  amenities: '',
  active: true,
}

export default function AdminSpaces() {
  const { spaces, setSpaces } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [filterType, setFilterType] = useState('all')

  const filteredSpaces = spaces.filter(
    (s) => filterType === 'all' || s.type === filterType
  )

  const openAddForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setFormErrors({})
    setShowForm(true)
  }

  const openEditForm = (space) => {
    setForm({
      name: space.name,
      type: space.type,
      capacity: space.capacity,
      description: space.description || '',
      amenities: (space.amenities || []).join(', '),
      active: space.active,
    })
    setEditingId(space.id)
    setFormErrors({})
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
  }

  const validateForm = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.capacity || Number(form.capacity) < 1) errs.capacity = 'Capacity must be at least 1'
    return errs
  }

  const handleSave = () => {
    const errs = validateForm()
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs)
      return
    }

    const amenitiesArr = form.amenities
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean)

    if (editingId) {
      const updates = {
        name: form.name.trim(),
        type: form.type,
        capacity: Number(form.capacity),
        description: form.description.trim(),
        amenities: amenitiesArr,
        active: form.active,
      }
      const updated = spaces.map((s) => s.id === editingId ? { ...s, ...updates } : s)
      setSpaces(updated)
      updateSpaceInApi(editingId, updates)
    } else {
      const newSpace = {
        id: `space-${Date.now()}`,
        name: form.name.trim(),
        type: form.type,
        capacity: Number(form.capacity),
        description: form.description.trim(),
        amenities: amenitiesArr,
        active: form.active,
      }
      setSpaces([...spaces, newSpace])
      createSpaceInApi(newSpace)
    }

    closeForm()
  }

  const handleDelete = (id) => {
    setSpaces(spaces.filter((s) => s.id !== id))
    setDeleteConfirm(null)
    deleteSpaceFromApi(id)
  }

  const handleToggleActive = (id) => {
    const updated = spaces.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    setSpaces(updated)
    const space = updated.find((s) => s.id === id)
    if (space) updateSpaceInApi(id, { active: space.active })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/dashboard"
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              Manage Spaces
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {spaces.length} total · {spaces.filter((s) => s.active).length} active
            </p>
          </div>
        </div>
        <button onClick={openAddForm} className="btn-primary text-sm">
          <Plus className="w-4 h-4" />
          Add Space
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5">
        {[
          { val: 'all', label: 'All' },
          { val: 'room', label: 'Rooms' },
          { val: 'table', label: 'Desks' },
        ].map(({ val, label }) => (
          <button
            key={val}
            onClick={() => setFilterType(val)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterType === val
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card p-6 mb-6 border-blue-200 bg-blue-50/30">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">
              {editingId ? 'Edit Space' : 'Add New Space'}
            </h2>
            <button
              onClick={closeForm}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Board Room"
                className="input bg-white"
              />
              {formErrors.name && (
                <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="label">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="input bg-white"
              >
                <option value="room">Room</option>
                <option value="table">Desk / Table</option>
              </select>
            </div>

            <div>
              <label className="label">
                Capacity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                className="input bg-white"
              />
              {formErrors.capacity && (
                <p className="mt-1 text-xs text-red-600">{formErrors.capacity}</p>
              )}
            </div>

            <div>
              <label className="label">Amenities</label>
              <input
                type="text"
                value={form.amenities}
                onChange={(e) => setForm({ ...form, amenities: e.target.value })}
                placeholder="Projector, Whiteboard, TV Screen"
                className="input bg-white"
              />
              <p className="mt-1 text-xs text-gray-400">Comma-separated list</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="label">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of the space..."
              rows={2}
              className="input bg-white resize-none"
            />
          </div>

          <div className="flex items-center gap-3 mb-5">
            <button
              type="button"
              onClick={() => setForm({ ...form, active: !form.active })}
              className="flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              {form.active ? (
                <ToggleRight className="w-8 h-8 text-green-500" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-gray-400" />
              )}
              {form.active ? 'Active (visible to users)' : 'Inactive (hidden from users)'}
            </button>
          </div>

          <div className="flex gap-3">
            <button onClick={closeForm} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleSave} className="btn-primary">
              <Check className="w-4 h-4" />
              {editingId ? 'Save Changes' : 'Add Space'}
            </button>
          </div>
        </div>
      )}

      {/* Spaces table */}
      {filteredSpaces.length === 0 ? (
        <div className="card p-12 text-center">
          <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No spaces found</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="card hidden md:block overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Amenities
                  </th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSpaces.map((space) => (
                  <tr key={space.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900 text-sm">{space.name}</p>
                      {space.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">
                          {space.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          space.type === 'room'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {space.type === 'room' ? 'Room' : 'Desk'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{space.capacity}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(space.amenities || []).slice(0, 3).map((a) => (
                          <span
                            key={a}
                            className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs"
                          >
                            {a}
                          </span>
                        ))}
                        {(space.amenities || []).length > 3 && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded text-xs">
                            +{space.amenities.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleToggleActive(space.id)}
                        className="flex items-center gap-1.5 text-sm font-medium"
                      >
                        {space.active ? (
                          <>
                            <ToggleRight className="w-5 h-5 text-green-500" />
                            <span className="text-green-700">Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-400">Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditForm(space)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(space)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filteredSpaces.map((space) => (
              <div key={space.id} className="card p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-gray-900 text-sm">{space.name}</h3>
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
                    <p className="text-xs text-gray-400">Capacity: {space.capacity}</p>
                  </div>
                  <button
                    onClick={() => handleToggleActive(space.id)}
                    className="flex items-center gap-1 text-xs font-medium flex-shrink-0"
                  >
                    {space.active ? (
                      <>
                        <ToggleRight className="w-5 h-5 text-green-500" />
                        <span className="text-green-700">Active</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-400">Inactive</span>
                      </>
                    )}
                  </button>
                </div>

                {space.description && (
                  <p className="text-xs text-gray-500 mb-2">{space.description}</p>
                )}

                {(space.amenities || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {space.amenities.map((a) => (
                      <span
                        key={a}
                        className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditForm(space)}
                    className="btn-secondary text-xs flex-1"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(space)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete Space?</h3>
                <p className="text-sm text-gray-500">This cannot be undone.</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 mb-5">
              <p className="text-sm font-medium text-gray-900">{deleteConfirm.name}</p>
              <p className="text-xs text-gray-400 capitalize">{deleteConfirm.type} · {deleteConfirm.capacity} people</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="btn-danger flex-1"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
