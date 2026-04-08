import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Plus, Edit, Trash2, X, Check, AlertCircle, Shield, User } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { getAdminUsers, saveAdminUsers } from '../../utils/data'

const EMPTY_FORM = { username: '', password: '', name: '', role: 'admin' }

export default function AdminUsers() {
  const { currentUser } = useApp()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')

  // Only superadmin can access this page
  useEffect(() => {
    if (currentUser && currentUser.role !== 'superadmin') {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [currentUser, navigate])

  useEffect(() => {
    setUsers(getAdminUsers())
  }, [])

  const refresh = () => setUsers(getAdminUsers())

  const flash = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const openAdd = () => {
    setEditId(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (user) => {
    setEditId(user.id)
    setForm({ username: user.username, password: '', name: user.name, role: user.role })
    setFormError('')
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY_FORM)
    setFormError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setFormError('')

    if (!form.username.trim()) return setFormError('Username is required.')
    if (!form.name.trim()) return setFormError('Display name is required.')
    if (!/^[a-zA-Z0-9_]+$/.test(form.username.trim()))
      return setFormError('Username may only contain letters, numbers, and underscores.')

    const all = getAdminUsers()

    if (editId) {
      // Editing existing user
      const idx = all.findIndex((u) => u.id === editId)
      if (idx === -1) return setFormError('User not found.')

      // Check username uniqueness (allow same username for same user)
      const conflict = all.find(
        (u) => u.username === form.username.trim() && u.id !== editId
      )
      if (conflict) return setFormError('That username is already taken.')

      // Prevent removing the last superadmin
      if (all[idx].role === 'superadmin' && form.role !== 'superadmin') {
        const otherSuperadmins = all.filter(
          (u) => u.role === 'superadmin' && u.id !== editId
        )
        if (otherSuperadmins.length === 0)
          return setFormError('Cannot demote the last superadmin.')
      }

      all[idx] = {
        ...all[idx],
        username: form.username.trim(),
        name: form.name.trim(),
        role: form.role,
        ...(form.password ? { password: form.password } : {}),
      }
      saveAdminUsers(all)
      refresh()
      flash('User updated successfully.')
    } else {
      // Adding new user
      if (!form.password) return setFormError('Password is required for new users.')
      if (form.password.length < 6) return setFormError('Password must be at least 6 characters.')

      const conflict = all.find((u) => u.username === form.username.trim())
      if (conflict) return setFormError('That username is already taken.')

      all.push({
        id: `user-${Date.now()}`,
        username: form.username.trim(),
        password: form.password,
        name: form.name.trim(),
        role: form.role,
        createdAt: new Date().toISOString(),
      })
      saveAdminUsers(all)
      refresh()
      flash('User created successfully.')
    }

    handleCancel()
  }

  const handleDelete = (id) => {
    const all = getAdminUsers()
    const target = all.find((u) => u.id === id)
    if (!target) return

    // Cannot delete yourself
    if (currentUser && currentUser.id === id) {
      alert('You cannot delete your own account.')
      return
    }

    // Cannot delete last superadmin
    if (target.role === 'superadmin') {
      const superadmins = all.filter((u) => u.role === 'superadmin')
      if (superadmins.length <= 1) {
        alert('Cannot delete the last superadmin account.')
        return
      }
    }

    saveAdminUsers(all.filter((u) => u.id !== id))
    refresh()
    setDeleteConfirm(null)
    flash('User deleted.')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Admin Users
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Manage who can access the admin area</p>
        </div>
        {!showForm && (
          <button onClick={openAdd} className="btn-primary text-sm">
            <Plus className="w-4 h-4" />
            Add User
          </button>
        )}
      </div>

      {successMsg && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700">{successMsg}</p>
        </div>
      )}

      {/* Add / Edit form */}
      {showForm && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            {editId ? 'Edit User' : 'New Admin User'}
          </h2>
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label" htmlFor="u-username">Username</label>
                <input
                  id="u-username"
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="e.g. jsmith"
                  className="input"
                  autoComplete="off"
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="u-name">Display Name</label>
                <input
                  id="u-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Jane Smith"
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="u-password">
                  Password {editId && <span className="text-gray-400 font-normal">(leave blank to keep current)</span>}
                </label>
                <input
                  id="u-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editId ? 'Leave blank to keep' : 'Min. 6 characters'}
                  className="input"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="label" htmlFor="u-role">Role</label>
                <select
                  id="u-role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="input"
                >
                  <option value="admin">Admin — manage spaces &amp; hours</option>
                  <option value="superadmin">Superadmin — full access incl. users</option>
                </select>
              </div>
            </div>

            {formError && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{formError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button type="submit" className="btn-primary text-sm">
                <Check className="w-4 h-4" />
                {editId ? 'Save Changes' : 'Create User'}
              </button>
              <button type="button" onClick={handleCancel} className="btn-secondary text-sm">
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users table */}
      <div className="card overflow-hidden">
        {users.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No admin users found</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Name</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Username</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Role</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          {user.name}
                          {currentUser && currentUser.id === user.id && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">You</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 font-mono">{user.username}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                          user.role === 'superadmin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          <Shield className="w-3 h-3" />
                          {user.role === 'superadmin' ? 'Superadmin' : 'Admin'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          {deleteConfirm === user.id ? (
                            <>
                              <span className="text-xs text-gray-500 mr-1">Delete?</span>
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="text-xs font-medium text-red-600 hover:text-red-700 px-2 py-1 bg-red-50 hover:bg-red-100 rounded transition-colors"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="text-xs font-medium text-gray-600 hover:text-gray-700 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                              >
                                No
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => openEdit(user)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(user.id)}
                                disabled={currentUser && currentUser.id === user.id}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-100">
              {users.map((user) => (
                <div key={user.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {user.name}
                          {currentUser && currentUser.id === user.id && (
                            <span className="ml-1.5 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">You</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">{user.username}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                      user.role === 'superadmin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      <Shield className="w-3 h-3" />
                      {user.role === 'superadmin' ? 'Superadmin' : 'Admin'}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => openEdit(user)}
                      className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    {deleteConfirm === user.id ? (
                      <>
                        <span className="text-xs text-gray-500 self-center">Delete?</span>
                        <button onClick={() => handleDelete(user.id)} className="text-xs font-medium text-red-600 px-2.5 py-1.5 bg-red-50 rounded-lg">Yes</button>
                        <button onClick={() => setDeleteConfirm(null)} className="text-xs font-medium text-gray-600 px-2.5 py-1.5 bg-gray-100 rounded-lg">No</button>
                      </>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(user.id)}
                        disabled={currentUser && currentUser.id === user.id}
                        className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-400">
        <Shield className="w-3 h-3 inline mr-1" />
        <strong>Superadmin</strong> — full access including user management &nbsp;·&nbsp;
        <strong>Admin</strong> — manage spaces, hours, and bookings only
      </p>
    </div>
  )
}
