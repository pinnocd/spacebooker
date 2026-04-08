import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  getSpaces,
  saveSpaces,
  getHours,
  saveHours,
  getBookings,
  saveBookings,
  isAdminLoggedIn,
  setAdminLoggedIn,
  getCurrentAdminUser,
  setCurrentAdminUser,
} from '../utils/data'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [spaces, setSpacesState] = useState([])
  const [hours, setHoursState] = useState({})
  const [bookings, setBookingsState] = useState([])
  const [isAdmin, setIsAdminState] = useState(false)
  const [currentUser, setCurrentUserState] = useState(null)

  const refreshData = useCallback(() => {
    setSpacesState(getSpaces())
    setHoursState(getHours())
    setBookingsState(getBookings())
    setIsAdminState(isAdminLoggedIn())
    setCurrentUserState(getCurrentAdminUser())
  }, [])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  const setSpaces = useCallback((newSpaces) => {
    saveSpaces(newSpaces)
    setSpacesState(newSpaces)
  }, [])

  const setHours = useCallback((newHours) => {
    saveHours(newHours)
    setHoursState(newHours)
  }, [])

  const setBookings = useCallback((newBookings) => {
    saveBookings(newBookings)
    setBookingsState(newBookings)
  }, [])

  const setIsAdmin = useCallback((val) => {
    setAdminLoggedIn(val)
    setIsAdminState(val)
    if (!val) {
      setCurrentAdminUser(null)
      setCurrentUserState(null)
    }
  }, [])

  const loginAdmin = useCallback((user) => {
    setCurrentAdminUser(user)
    setCurrentUserState(user)
    setIsAdminState(true)
  }, [])

  return (
    <AppContext.Provider
      value={{
        spaces,
        setSpaces,
        hours,
        setHours,
        bookings,
        setBookings,
        isAdmin,
        setIsAdmin,
        currentUser,
        loginAdmin,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
