import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Building2, Phone } from 'lucide-react'
import { registerMember } from '../utils/data'
import { registerMemberInApi } from '../utils/apiClient'
import { useApp } from '../context/AppContext'

export default function Register() {
  const { loginMember } = useApp()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setError('') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) return setError('Please enter your full name.')
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return setError('Please enter a valid email address.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    if (form.password !== form.confirm) return setError('Passwords do not match.')

    setLoading(true)
    try {
      const { error: apiError, status } = await registerMemberInApi({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone.trim() || null,
      })

      // Hard errors — show to user
      if (status === 409) {
        setError(apiError || 'An account with that email already exists.')
        return
      }
      if (status === 500) {
        setError(apiError || 'Something went wrong. Please try again.')
        return
      }

      if (!apiError) {
        // API accepted — show "check your email"
        setSuccess(true)
        return
      }

      // API unreachable — fall back to localStorage (no email verification possible)
      const result = registerMember({ name: form.name, email: form.email, password: form.password })
      if (result.error) { setError(result.error); return }
      result.member.status = 'active'
      loginMember(result.member)
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
          <p className="text-gray-500 text-sm mb-6">
            We've sent a confirmation link to <strong>{form.email}</strong>.
            Click the link to activate your account.
          </p>
          <Link to="/" className="btn-primary inline-flex">Back to home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create an account</h1>
          <p className="text-gray-500 mt-1 text-sm">Book rooms and desks in the office</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label className="label" htmlFor="reg-name">Full name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input id="reg-name" type="text" value={form.name} onChange={set('name')}
                  placeholder="Jane Smith" className="input pl-10" required />
              </div>
            </div>

            <div className="mb-4">
              <label className="label" htmlFor="reg-email">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input id="reg-email" type="email" value={form.email} onChange={set('email')}
                  placeholder="jane@company.com" className="input pl-10" autoComplete="email" required />
              </div>
            </div>

            <div className="mb-4">
              <label className="label" htmlFor="reg-phone">
                Mobile number <span className="text-gray-400 font-normal">(optional — for SMS verification codes)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input id="reg-phone" type="tel" value={form.phone} onChange={set('phone')}
                  placeholder="+447911123456" className="input pl-10" autoComplete="tel" />
              </div>
            </div>

            <div className="mb-4">
              <label className="label" htmlFor="reg-password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input id="reg-password" type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={set('password')} placeholder="Min. 6 characters"
                  className="input pl-10 pr-10" autoComplete="new-password" required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="mb-5">
              <label className="label" htmlFor="reg-confirm">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input id="reg-confirm" type={showPass ? 'text' : 'password'} value={form.confirm}
                  onChange={set('confirm')} placeholder="Repeat password"
                  className="input pl-10" autoComplete="new-password" required />
              </div>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mb-4">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account...</>
                : <><UserPlus className="w-4 h-4" />Create account</>
              }
            </button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
