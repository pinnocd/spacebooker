import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Building2 } from 'lucide-react'
import { authenticateMember } from '../utils/data'
import { useApp } from '../context/AppContext'

export default function Login() {
  const { loginMember, member } = useApp()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (member) {
    navigate('/', { replace: true })
    return null
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    setTimeout(() => {
      const user = authenticateMember(email.trim(), password)
      if (!user) {
        setError('Incorrect email or password.')
        setLoading(false)
        return
      }
      if (user.status === 'pending') {
        setError('Your account is awaiting approval from an administrator.')
        setLoading(false)
        return
      }
      if (user.status === 'suspended') {
        setError('Your account has been suspended. Please contact an administrator.')
        setLoading(false)
        return
      }
      loginMember(user)
      navigate('/')
    }, 400)
  }

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 mt-1 text-sm">Sign in to your account</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label className="label" htmlFor="login-email">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input id="login-email" type="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  placeholder="jane@company.com" className="input pl-10"
                  autoComplete="email" required />
              </div>
            </div>

            <div className="mb-5">
              <label className="label" htmlFor="login-password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input id="login-password" type={showPass ? 'text' : 'password'} value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  placeholder="Your password" className="input pl-10 pr-10"
                  autoComplete="current-password" required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading || !email || !password} className="btn-primary w-full mb-4">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</>
                : 'Sign in'
              }
            </button>

            <p className="text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">Create one</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
