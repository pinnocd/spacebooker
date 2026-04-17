import { useState } from 'react'
import { User, Mail, Phone, Lock, Eye, EyeOff, AlertCircle, Check, Loader2, Moon } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { updateMemberProfileInApi } from '../utils/apiClient'

export default function AccountSettings() {
  const { member, loginMember } = useApp()

  const [form, setForm] = useState({
    name: member?.name || '',
    phone: member?.phone || '',
    darkMode: member?.darkMode ?? false,
  })
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  if (!member) return null

  const set = (k) => (e) => { setForm(f => ({ ...f, [k]: e.target.value })); setError(''); setSaved(false) }
  const setP = (k) => (e) => { setPasswords(p => ({ ...p, [k]: e.target.value })); setError(''); setSaved(false) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaved(false)

    if (!form.name.trim()) return setError('Name cannot be empty.')

    const changingPassword = passwords.current || passwords.newPass || passwords.confirm
    if (changingPassword) {
      if (!passwords.current) return setError('Enter your current password to set a new one.')
      if (passwords.newPass.length < 6) return setError('New password must be at least 6 characters.')
      if (passwords.newPass !== passwords.confirm) return setError('New passwords do not match.')
    }

    setSaving(true)
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      darkMode: form.darkMode,
      ...(changingPassword && { currentPassword: passwords.current, newPassword: passwords.newPass }),
    }

    const { data, error: apiError, status } = await updateMemberProfileInApi(member.id, payload)
    setSaving(false)

    if (apiError) {
      setError(status === 401 ? 'Current password is incorrect.' : apiError)
      return
    }

    // Update session — loginMember also applies/removes dark class
    loginMember({ ...member, name: data.name, phone: data.phone, darkMode: data.darkMode })
    setPasswords({ current: '', newPass: '', confirm: '' })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Account settings</h1>
      <p className="text-sm text-gray-500 mb-6">Update your name, phone number or password.</p>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Profile */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Profile</h2>

          <div>
            <label className="label" htmlFor="acc-name">Full name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input id="acc-name" type="text" value={form.name} onChange={set('name')}
                className="input pl-10" required />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="acc-email">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input id="acc-email" type="email" value={member.email}
                className="input pl-10 bg-gray-50 text-gray-400 cursor-not-allowed" disabled />
            </div>
            <p className="text-xs text-gray-400 mt-1">Email address cannot be changed.</p>
          </div>

          <div>
            <label className="label" htmlFor="acc-phone">
              Mobile number <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input id="acc-phone" type="tel" value={form.phone} onChange={set('phone')}
                placeholder="+447911123456" className="input pl-10" />
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-4">Appearance</h2>
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div className="flex items-center gap-3">
              <Moon className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">Dark mode</p>
                <p className="text-xs text-gray-400">Use a dark colour scheme</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.darkMode}
              onClick={() => {
                const next = !form.darkMode
                setForm(f => ({ ...f, darkMode: next }))
                document.documentElement.classList.toggle('dark', next)
              }}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                form.darkMode ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                form.darkMode ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </label>
        </div>

        {/* Change password */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Change password</h2>
          <p className="text-xs text-gray-400 -mt-2">Leave blank to keep your current password.</p>

          <div>
            <label className="label" htmlFor="acc-current">Current password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input id="acc-current" type={showPass ? 'text' : 'password'} value={passwords.current}
                onChange={setP('current')} placeholder="Your current password"
                className="input pl-10 pr-10" autoComplete="current-password" />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="acc-new">New password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input id="acc-new" type={showPass ? 'text' : 'password'} value={passwords.newPass}
                onChange={setP('newPass')} placeholder="Min. 6 characters"
                className="input pl-10" autoComplete="new-password" />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="acc-confirm">Confirm new password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input id="acc-confirm" type={showPass ? 'text' : 'password'} value={passwords.confirm}
                onChange={setP('confirm')} placeholder="Repeat new password"
                className="input pl-10" autoComplete="new-password" />
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
            : saved
            ? <><Check className="w-4 h-4" />Saved!</>
            : 'Save changes'
          }
        </button>
      </form>
    </div>
  )
}
