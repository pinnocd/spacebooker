import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  getSpaces, saveSpaces,
  getHours, saveHours,
  getBookings, saveBookings,
  addBooking as localAddBooking,
  cancelBooking as localCancelBooking,
  isAdminLoggedIn, setAdminLoggedIn,
  getCurrentAdminUser, setCurrentAdminUser,
  getMemberSession, setMemberSession,
  getConfig, saveConfig,
} from '../utils/data'
import {
  fetchConfigFromApi,
  fetchSpacesFromApi,
  fetchHoursFromApi,
  fetchBookingsFromApi,
  fetchLocationsFromApi,
  createBookingInApi,
  cancelBookingInApi,
  createSpaceInApi,
  saveHoursToApi,
} from '../utils/apiClient'

// Hex color helpers for generating shade variants at runtime
function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
}
function darken(hex, pct) {
  const [r, g, b] = hexToRgb(hex)
  const f = 1 - pct / 100
  return rgbToHex(r * f, g * f, b * f)
}
function lighten(hex, pct) {
  const [r, g, b] = hexToRgb(hex)
  const f = pct / 100
  return rgbToHex(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f)
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [spaces, setSpacesState] = useState([])
  const [hours, setHoursState] = useState({})
  const [bookings, setBookingsState] = useState([])
  const [locations, setLocationsState] = useState([])
  const [isAdmin, setIsAdminState] = useState(false)
  const [currentUser, setCurrentUserState] = useState(null)   // admin user
  const [member, setMemberState] = useState(null)             // logged-in member
  const [config, setConfigState] = useState({})

  const applyBrandColors = useCallback((cfg) => {
    const root = document.documentElement.style
    const primary = cfg.primaryColor || '#2563eb'
    const secondary = cfg.secondaryColor || '#7c3aed'
    root.setProperty('--color-primary', primary)
    root.setProperty('--color-primary-dark', darken(primary, 10))
    root.setProperty('--color-primary-xdark', darken(primary, 20))
    root.setProperty('--color-primary-light', lighten(primary, 42))
    root.setProperty('--color-primary-text', primary)
    root.setProperty('--color-secondary', secondary)
    root.setProperty('--color-secondary-dark', darken(secondary, 10))
    root.setProperty('--color-secondary-light', lighten(secondary, 42))
  }, [])

  const refreshData = useCallback(() => {
    setSpacesState(getSpaces())
    setHoursState(getHours())
    setBookingsState(getBookings())
    setIsAdminState(isAdminLoggedIn())
    setCurrentUserState(getCurrentAdminUser())
    setMemberState(getMemberSession())
    const cfg = getConfig()
    setConfigState(cfg)
    applyBrandColors(cfg)
  }, [applyBrandColors])

  useEffect(() => {
    // 1. Load synchronously from localStorage so UI is instant
    refreshData()

    // 2. Hydrate from DB in background — DB is shared source of truth.
    //    If DB is empty but localStorage has data, migrate localStorage → DB.
    Promise.all([
      fetchConfigFromApi(),
      fetchSpacesFromApi(),
      fetchHoursFromApi(),
      fetchBookingsFromApi(),
      fetchLocationsFromApi(),
    ]).then(([configRes, spacesRes, hoursRes, bookingsRes, locationsRes]) => {
      // Config
      if (!configRes.error && configRes.data && Object.keys(configRes.data).length > 0) {
        const local = getConfig()
        const merged = { ...local, ...configRes.data, dbUrl: local.dbUrl }
        saveConfig(merged)
        setConfigState(merged)
        applyBrandColors(merged)
      }

      // Spaces — if DB has data use it; if empty, migrate localStorage → DB
      if (!spacesRes.error) {
        if (Array.isArray(spacesRes.data) && spacesRes.data.length > 0) {
          saveSpaces(spacesRes.data)
          setSpacesState(spacesRes.data)
        } else if (spacesRes.data !== null) {
          // DB is empty — push localStorage spaces up
          const local = getSpaces()
          if (local.length > 0) {
            local.forEach(s => createSpaceInApi(s))
          }
        }
      }

      // Hours — if DB has data use it; if empty, migrate localStorage → DB
      if (!hoursRes.error && hoursRes.data) {
        const keys = Object.keys(hoursRes.data)
        if (keys.length > 0) {
          const normalized = {}
          for (let i = 0; i <= 6; i++) {
            normalized[i] = hoursRes.data[i] || hoursRes.data[String(i)]
          }
          saveHours(normalized)
          setHoursState(normalized)
        } else {
          // DB hours table is empty — push localStorage hours up
          const local = getHours()
          saveHoursToApi(local)
        }
      }

      // Bookings — if DB has data use it; never wipe with empty
      if (!bookingsRes.error && Array.isArray(bookingsRes.data) && bookingsRes.data.length > 0) {
        saveBookings(bookingsRes.data)
        setBookingsState(bookingsRes.data)
      }

      // Locations — always use DB as source of truth
      if (!locationsRes.error && Array.isArray(locationsRes.data)) {
        setLocationsState(locationsRes.data)
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const setSpaces = useCallback((v) => { saveSpaces(v); setSpacesState(v) }, [])
  const setLocations = useCallback((v) => setLocationsState(v), [])
  const setHours = useCallback((v) => { saveHours(v); setHoursState(v) }, [])
  const setBookings = useCallback((v) => { saveBookings(v); setBookingsState(v) }, [])

  const setIsAdmin = useCallback((val) => {
    setAdminLoggedIn(val)
    setIsAdminState(val)
    if (!val) { setCurrentAdminUser(null); setCurrentUserState(null) }
  }, [])

  const loginAdmin = useCallback((user) => {
    setCurrentAdminUser(user)
    setCurrentUserState(user)
    setIsAdminState(true)
  }, [])

  const loginMember = useCallback((m) => {
    setMemberSession(m)
    setMemberState(m)
  }, [])

  const logoutMember = useCallback(() => {
    setMemberSession(null)
    setMemberState(null)
  }, [])

  const setConfig = useCallback((v) => {
    saveConfig(v)
    setConfigState(v)
    applyBrandColors(v)
  }, [applyBrandColors])

  // Add a booking: optimistic localStorage update + API call
  const addBooking = useCallback(async (bookingData) => {
    // Write to localStorage immediately for instant UI feedback
    const booking = localAddBooking(bookingData)
    setBookingsState(getBookings())

    // Persist to DB — if conflict, revert
    const { data, error, status } = await createBookingInApi(booking)
    if (error) {
      if (status === 409) {
        // Genuine conflict — revert optimistic update
        localCancelBooking(booking.id)
        setBookingsState(getBookings())
        return { booking: null, error: 'This time slot is no longer available.' }
      }
      // Network/DB error — keep local booking, warn caller
      return { booking, error }
    }
    // Replace with server-side booking (server is canonical)
    const updated = getBookings().map(b => b.id === booking.id ? data : b)
    saveBookings(updated)
    setBookingsState(updated)
    return { booking: data, error: null }
  }, [])

  // Cancel a booking: optimistic + API
  const cancelBooking = useCallback(async (id) => {
    localCancelBooking(id)
    setBookingsState(getBookings())
    await cancelBookingInApi(id)
  }, [])

  return (
    <AppContext.Provider value={{
      spaces, setSpaces,
      hours, setHours,
      bookings, setBookings,
      locations, setLocations,
      isAdmin, setIsAdmin,
      currentUser, loginAdmin,
      member, loginMember, logoutMember,
      config, setConfig,
      addBooking, cancelBooking,
      refreshData,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
