import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { confirmVerificationCode } from '../utils/apiClient'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const token = params.get('token')

  const [status, setStatus] = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No confirmation token found. Please check the link in your email.')
      return
    }

    fetch(`/api/verify/confirm?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (res.ok) {
          setName(data.name || '')
          setStatus('success')
        } else {
          setStatus('error')
          setMessage(data.error || 'Something went wrong. Please try again.')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Could not connect to the server. Please try again.')
      })
  }, [token])

  if (status === 'loading') {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Confirming your account…</p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Email confirmed!</h1>
          <p className="text-gray-500 text-sm mb-6">
            {name ? `Welcome, ${name}! ` : ''}Your account is active. You can now sign in.
          </p>
          <Link to="/login" className="btn-primary inline-flex">
            Sign in now
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirmation failed</h1>
        <p className="text-gray-500 text-sm mb-6">{message}</p>
        <Link to="/register" className="btn-primary inline-flex">
          Register again
        </Link>
      </div>
    </div>
  )
}
