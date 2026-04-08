import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  getSpaces, saveSpaces,
  getHours, saveHours,
  getBookings, saveBookings,
  isAdminLoggedIn, setAdminLoggedIn,
  getCurrentAdminUser, setCurrentAdminUser,
  getMemberSession, setMemberSession,
  getConfig, saveConfig,
} from '../utils/data'
import { fetchConfigFromApi } from '../utils/apiClient'

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

    // 2. Attempt to hydrate branding config from the database in the background.
    //    If it succeeds, merge into localStorage and apply — DB is the source of truth.
    fetchConfigFromApi().then(({ data, error }) => {
      if (error || !data || Object.keys(data).length === 0) return
      const local = getConfig()
      // DB values override local for branding keys; preserve dbUrl from local
      const merged = { ...local, ...data, dbUrl: local.dbUrl }
      saveConfig(merged)
      setConfigState(merged)
      applyBrandColors(merged)
    })
  }, [refreshData, applyBrandColors])

  const setSpaces = useCallback((v) => { saveSpaces(v); setSpacesState(v) }, [])
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

  return (
    <AppContext.Provider value={{
      spaces, setSpaces,
      hours, setHours,
      bookings, setBookings,
      isAdmin, setIsAdmin,
      currentUser, loginAdmin,
      member, loginMember, logoutMember,
      config, setConfig,
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
