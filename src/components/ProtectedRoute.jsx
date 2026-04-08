import React from 'react'
import { Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function ProtectedRoute({ children }) {
  const { isAdmin } = useApp()

  if (!isAdmin) {
    return <Navigate to="/admin" replace />
  }

  return children
}
