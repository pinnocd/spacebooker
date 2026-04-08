import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Plus, Edit, Trash2, X, Check, AlertCircle, Shield, User, Mail, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { getAdminUsers, saveAdminUsers, getMembers, updateMemberStatus, saveMembers } from '../../utils/data'

const EMPTY_FORM = { username: '', password: '', name: '', role: 'admin' }

const STATUS_STYLES = {
  active:    { cls: 'bg-green-100 text-green-700',  Icon: CheckCircle, label: 'Active' },
  pending:   { cls: 'bg-amber-100 text-amber-700',  Icon: Clock,       label: 'Pending' },
  suspended: { cls: 'bg-red-100 text-red-700',      Icon: XCircle,     label: 'Suspended' },
}

export default function AdminUsers() {
  const { currentUser } = useApp()
  const navigate = useNavigate()
  const [tab, setTab] = useState('members')
  const [members, setMembers] = useState([])
  const [adminUsers, setAdminUsers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [memberFilter, setMemberFilter] = useState('all')

  useEffect(() => {
    if (currentUser && currentUser.role !== 'superadmin') navigate('/admin/dashboard', { replace: true })
  }, [currentUser, navigate])

  const refresh = () => { setMembers(getMembers()); setAdminUsers(getAdminUsers()) }
  useEffect(() => { refresh() }, [])

  const flash = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000) }

  // ── Members ──────────────────────────────────────────────────────────────

  const handleMemberStatus = (id, status) => {
    updateMemberStatus(id, status)
    refresh()
    flash(status === 'active' ? 'Member approved.' : status === 'suspended' ? 'Member suspended.' : 'Member updated.')
  }

  const handleDeleteMember = (id) => {
    saveMembers(getMembers().filter((m) => m.id !== id))
    refresh(); setDeleteConfirm(null); flash('Member deleted.')
  }

  const filteredMembers = memberFilter === 'all' ? members : members.filter((m) => m.status === memberFilter)

  // ── Admin users ──────────────────────────────────────────────────────────

  const openAdd = () => { setEditId(null); setForm(EMPTY_FORM); setFormError(''); setShowForm(true) }
  const openEdit = (u) => { setEditId(u.id); setForm({ username: u.username, password: '', name: u.name, role: u.role }); setFormError(''); setShowForm(true) }
  const handleCancel = () => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); setFormError('') }

  const handleAdminSubmit = (e) => {
    e.preventDefault(); setFormError('')
    if (!form.username.trim()) return setFormError('Username is required.')
    if (!form.name.trim()) return setFormError('Display name is required.')
    if (!/^[a-zA-Z0-9_]+$/.test(form.username.trim())) return setFormError('Username may only contain letters, numbers, and underscores.')
    const all = getAdminUsers()
    if (editId) {
      const idx = all.findIndex((u) => u.id === editId)
      if (idx === -1) return setFormError('User not found.')
      if (all.find((u) => u.username === form.username.trim() && u.id !== editId)) return setFormError('Username already taken.')
      if (all[idx].role === 'superadmin' && form.role !== 'superadmin' && all.filter((u) => u.role === 'superadmin' && u.id !== editId).length === 0)
        return setFormError('Cannot demote the last superadmin.')
      all[idx] = { ...all[idx], username: form.username.trim(), name: form.name.trim(), role: form.role, ...(form.password ? { password: form.password } : {}) }
      saveAdminUsers(all); refresh(); flash('Admin user updated.'); handleCancel()
    } else {
      if (!form.password) return setFormError('Password is required.')
      if (form.password.length < 6) return setFormError('Password must be at least 6 characters.')
      if (all.find((u) => u.username === form.username.trim())) return setFormError('Username already taken.')
      all.push({ id: `user-${Date.now()}`, username: form.username.trim(), password: form.password, name: form.name.trim(), role: form.role, createdAt: new Date().toISOString() })
      saveAdminUsers(all); refresh(); flash('Admin user created.'); handleCancel()
    }
  }

  const handleDeleteAdmin = (id) => {
    if (currentUser?.id === id) return alert('You cannot delete your own account.')
    const all = getAdminUsers()
    const target = all.find((u) => u.id === id)
    if (target?.role === 'superadmin' && all.filter((u) => u.role === 'superadmin').length <= 1)
      return alert('Cannot delete the last superadmin.')
    saveAdminUsers(all.filter((u) => u.id !== id)); refresh(); setDeleteConfirm(null); flash('Admin user deleted.')
  }

  const pendingCount = members.filter((m) => m.status === 'pending').length

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />Users
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Manage members and admin accounts</p>
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700">{successMsg}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {[{ key: 'members', label: 'Members', badge: pendingCount }, { key: 'admins', label: 'Admin accounts', badge: 0 }].map(({ key, label, badge }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {label}
            {badge > 0 && <span className="inline-flex items-center justify-center w-5 h-5 bg-amber-500 text-white text-xs rounded-full">{badge}</span>}
          </button>
        ))}
      </div>

      {/* ── MEMBERS TAB ── */}
      {tab === 'members' && (
        <>
          <div className="flex gap-2 mb-4 flex-wrap">
            {['all', 'pending', 'active', 'suspended'].map((f) => (
              <button key={f} onClick={() => setMemberFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${memberFilter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
              >
                {f === 'all' ? `All (${members.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${members.filter((m) => m.status === f).length})`}
              </button>
            ))}
          </div>

          <div className="card overflow-hidden">
            {filteredMembers.length === 0 ? (
              <div className="p-10 text-center">
                <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">{members.length === 0 ? 'No members have registered yet' : 'No members match this filter'}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredMembers.map((m) => {
                  const st = STATUS_STYLES[m.status] || STATUS_STYLES.pending
                  const { Icon } = st
                  return (
                    <div key={m.id} className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{m.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 flex-shrink-0" />{m.email}
                        </p>
                      </div>
                      <span className={`hidden sm:inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${st.cls}`}>
                        <Icon className="w-3 h-3" />{st.label}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {m.status === 'pending' && (
                          <button onClick={() => handleMemberStatus(m.id, 'active')}
                            className="text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg transition-colors">
                            Approve
                          </button>
                        )}
                        {m.status === 'active' && (
                          <button onClick={() => handleMemberStatus(m.id, 'suspended')}
                            className="text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg transition-colors">
                            Suspend
                          </button>
                        )}
                        {m.status === 'suspended' && (
                          <button onClick={() => handleMemberStatus(m.id, 'active')}
                            className="text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg transition-colors">
                            Reinstate
                          </button>
                        )}
                        {deleteConfirm === m.id ? (
                          <>
                            <span className="text-xs text-gray-500">Delete?</span>
                            <button onClick={() => handleDeleteMember(m.id)} className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1.5 rounded-lg">Yes</button>
                            <button onClick={() => setDeleteConfirm(null)} className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1.5 rounded-lg">No</button>
                          </>
                        ) : (
                          <button onClick={() => setDeleteConfirm(m.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── ADMINS TAB ── */}
      {tab === 'admins' && (
        <>
          {!showForm && (
            <div className="mb-4 flex justify-end">
              <button onClick={openAdd} className="btn-primary text-sm"><Plus className="w-4 h-4" />Add admin</button>
            </div>
          )}

          {showForm && (
            <div className="card p-6 mb-6">
              <h2 className="font-semibold text-gray-900 mb-4">{editId ? 'Edit admin user' : 'New admin user'}</h2>
              <form onSubmit={handleAdminSubmit} noValidate>
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="label" htmlFor="u-username">Username</label>
                    <input id="u-username" type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="e.g. jsmith" className="input" required />
                  </div>
                  <div>
                    <label className="label" htmlFor="u-name">Display name</label>
                    <input id="u-name" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Jane Smith" className="input" required />
                  </div>
                  <div>
                    <label className="label" htmlFor="u-password">Password {editId && <span className="text-gray-400 font-normal">(leave blank to keep)</span>}</label>
                    <input id="u-password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editId ? 'Leave blank to keep' : 'Min. 6 characters'} className="input" autoComplete="new-password" />
                  </div>
                  <div>
                    <label className="label" htmlFor="u-role">Role</label>
                    <select id="u-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input">
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
                  <button type="submit" className="btn-primary text-sm"><Check className="w-4 h-4" />{editId ? 'Save changes' : 'Create user'}</button>
                  <button type="button" onClick={handleCancel} className="btn-secondary text-sm"><X className="w-4 h-4" />Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="card overflow-hidden">
            {adminUsers.length === 0 ? (
              <div className="p-10 text-center"><Users className="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-gray-400 text-sm">No admin users</p></div>
            ) : (
              <div className="divide-y divide-gray-100">
                {adminUsers.map((u) => (
                  <div key={u.id} className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm flex items-center gap-2">
                        {u.name}
                        {currentUser?.id === u.id && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">You</span>}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">{u.username}</p>
                    </div>
                    <span className={`hidden sm:inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${u.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      <Shield className="w-3 h-3" />{u.role === 'superadmin' ? 'Superadmin' : 'Admin'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(u)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                      {deleteConfirm === u.id ? (
                        <>
                          <span className="text-xs text-gray-500">Delete?</span>
                          <button onClick={() => handleDeleteAdmin(u.id)} className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1.5 rounded-lg">Yes</button>
                          <button onClick={() => setDeleteConfirm(null)} className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1.5 rounded-lg">No</button>
                        </>
                      ) : (
                        <button onClick={() => setDeleteConfirm(u.id)} disabled={currentUser?.id === u.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="mt-4 text-xs text-gray-400">
            <Shield className="w-3 h-3 inline mr-1" />
            <strong>Superadmin</strong> — full access including user management &nbsp;·&nbsp;
            <strong>Admin</strong> — manage spaces, hours, and bookings only
          </p>
        </>
      )}
    </div>
  )
}
