import React, { useState, useEffect, useRef } from 'react'
import { Settings, Database, Check, AlertCircle, Eye, EyeOff, Palette, Upload, X, Image, Loader2, Wifi, WifiOff } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { getConfig, saveConfig } from '../../utils/data'
import { saveConfigToApi, fetchConfigFromApi } from '../../utils/apiClient'

// Preset colour palettes [primary, secondary]
const PRESETS = [
  { name: 'Ocean Blue',    primary: '#2563eb', secondary: '#0891b2' },
  { name: 'Violet',        primary: '#7c3aed', secondary: '#db2777' },
  { name: 'Emerald',       primary: '#059669', secondary: '#0284c7' },
  { name: 'Rose',          primary: '#e11d48', secondary: '#ea580c' },
  { name: 'Amber',         primary: '#d97706', secondary: '#65a30d' },
  { name: 'Slate',         primary: '#475569', secondary: '#334155' },
  { name: 'Indigo',        primary: '#4338ca', secondary: '#7c3aed' },
  { name: 'Teal',          primary: '#0d9488', secondary: '#0369a1' },
]

function ColorSwatch({ color, label, onChange }) {
  const inputRef = useRef(null)
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-10 h-10 rounded-lg border-2 border-gray-200 shadow-sm hover:scale-105 transition-transform flex-shrink-0 relative overflow-hidden"
          style={{ backgroundColor: color }}
          aria-label={`Pick ${label}`}
        >
          <input
            ref={inputRef}
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </button>
        <input
          type="text"
          value={color}
          onChange={(e) => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) onChange(e.target.value) }}
          className="input font-mono text-sm max-w-[110px]"
          maxLength={7}
          spellCheck={false}
        />
        <span className="text-xs text-gray-400">Click swatch or type hex</span>
      </div>
    </div>
  )
}

// DB save status per attempt
const DB_STATUS = { idle: 'idle', saving: 'saving', ok: 'ok', error: 'error', unavailable: 'unavailable' }

export default function AdminConfig() {
  const { setConfig } = useApp()
  const logoInputRef = useRef(null)

  // Form state
  const [appName, setAppName] = useState('OfficeBook')
  const [logo, setLogo] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#2563eb')
  const [secondaryColor, setSecondaryColor] = useState('#7c3aed')
  const [dbUrl, setDbUrl] = useState('')
  const [showUrl, setShowUrl] = useState(false)
  const [logoError, setLogoError] = useState('')
  // Save status
  const [localStatus, setLocalStatus] = useState(DB_STATUS.idle)   // localStorage
  const [dbStatus, setDbStatus] = useState(DB_STATUS.idle)         // database
  const [dbError, setDbError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const cfg = getConfig()
    setAppName(cfg.appName || 'OfficeBook')
    setLogo(cfg.logo || '')
    setPrimaryColor(cfg.primaryColor || '#2563eb')
    setSecondaryColor(cfg.secondaryColor || '#7c3aed')
    setDbUrl(cfg.dbUrl || '')
    // Check if DB is reachable and load any newer values from it
    fetchConfigFromApi().then(({ data, error }) => {
      if (!error && data && Object.keys(data).length > 0) {
        if (data.appName)        setAppName(data.appName)
        if (data.logo !== undefined) setLogo(data.logo)
        if (data.primaryColor)   setPrimaryColor(data.primaryColor)
        if (data.secondaryColor) setSecondaryColor(data.secondaryColor)
        setDbStatus(DB_STATUS.idle) // DB is reachable
      }
    })
  }, [])

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoError('')
    if (!file.type.startsWith('image/')) return setLogoError('Please upload an image file (PNG, JPG, SVG).')
    if (file.size > 500 * 1024) return setLogoError('Logo must be under 500 KB.')
    const reader = new FileReader()
    reader.onload = (ev) => setLogo(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setLocalStatus(DB_STATUS.idle)
    setDbStatus(DB_STATUS.idle)
    setDbError('')

    const cfg = {
      appName: appName.trim() || 'OfficeBook',
      logo,
      primaryColor,
      secondaryColor,
      dbUrl: dbUrl.trim(),
    }

    // 1. Always save to localStorage first (instant, never fails)
    saveConfig(cfg)
    setConfig(cfg)
    setLocalStatus(DB_STATUS.ok)

    // 2. Try to save to database
    setDbStatus(DB_STATUS.saving)
    const { ok, error } = await saveConfigToApi(cfg)
    if (ok) {
      setDbStatus(DB_STATUS.ok)
    } else if (error?.includes('Database not configured') || error?.includes('503')) {
      setDbStatus(DB_STATUS.unavailable)
    } else {
      setDbStatus(DB_STATUS.error)
      setDbError(error || 'Unknown error')
    }

    setSaving(false)
    // Reset local status indicator after a few seconds
    setTimeout(() => { setLocalStatus(DB_STATUS.idle); setDbStatus(DB_STATUS.idle) }, 5000)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
          Configuration
        </h1>
        <p className="text-gray-500 mt-1 text-sm">Branding, app settings, and database connection</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 mb-8">

        {/* ── Branding ─────────────────────────────────────────────────────── */}
        <div className="card p-6 space-y-6">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Palette className="w-4 h-4 text-gray-500" />Branding
          </h2>

          {/* App name */}
          <div>
            <label className="label" htmlFor="app-name">Application name</label>
            <input id="app-name" type="text" value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="OfficeBook" className="input max-w-xs" />
            <p className="mt-1 text-xs text-gray-400">Shown in the navbar and browser tab.</p>
          </div>

          {/* Logo upload */}
          <div>
            <label className="label">Logo</label>
            <div className="flex items-start gap-4">
              {/* Preview */}
              <div className="w-24 h-16 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 flex-shrink-0 overflow-hidden">
                {logo
                  ? <img src={logo} alt="Logo preview" className="w-full h-full object-contain p-1" />
                  : <Image className="w-6 h-6 text-gray-300" />
                }
              </div>
              <div className="space-y-2">
                <button type="button" onClick={() => logoInputRef.current?.click()}
                  className="btn-secondary text-sm">
                  <Upload className="w-4 h-4" />Upload logo
                </button>
                {logo && (
                  <button type="button" onClick={() => setLogo('')}
                    className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 transition-colors">
                    <X className="w-3.5 h-3.5" />Remove logo
                  </button>
                )}
                <p className="text-xs text-gray-400">PNG, JPG, or SVG — max 500 KB.<br />Replaces the icon in the navbar.</p>
                {logoError && <p className="text-xs text-red-600">{logoError}</p>}
              </div>
              <input ref={logoInputRef} type="file" accept="image/*"
                onChange={handleLogoUpload} className="hidden" />
            </div>
          </div>

          {/* Color pickers */}
          <div className="grid sm:grid-cols-2 gap-6">
            <ColorSwatch label="Primary colour" color={primaryColor} onChange={setPrimaryColor} />
            <ColorSwatch label="Secondary colour" color={secondaryColor} onChange={setSecondaryColor} />
          </div>

          {/* Preset palettes */}
          <div>
            <p className="label mb-2">Colour presets</p>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {PRESETS.map((p) => (
                <button key={p.name} type="button"
                  onClick={() => { setPrimaryColor(p.primary); setSecondaryColor(p.secondary) }}
                  title={p.name}
                  className="group flex flex-col items-center gap-1"
                >
                  <div className="w-9 h-9 rounded-lg shadow-sm border-2 border-transparent group-hover:border-gray-400 transition-all overflow-hidden">
                    <div className="w-full h-1/2" style={{ backgroundColor: p.primary }} />
                    <div className="w-full h-1/2" style={{ backgroundColor: p.secondary }} />
                  </div>
                  <span className="text-[10px] text-gray-400 leading-tight text-center hidden sm:block">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Live preview strip */}
          <div>
            <p className="label mb-2">Preview</p>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-2 flex items-center gap-3" style={{ backgroundColor: primaryColor }}>
                {logo
                  ? <img src={logo} alt="" className="h-6 object-contain" />
                  : <span className="font-bold text-white text-sm">{appName || 'OfficeBook'}</span>
                }
                {logo && <span className="font-bold text-white text-sm">{appName || 'OfficeBook'}</span>}
              </div>
              <div className="p-4 bg-gray-50 flex items-center gap-3">
                <button type="button" className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: primaryColor }}>Book a space</button>
                <button type="button" className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: secondaryColor }}>My Bookings</button>
                <span className="text-sm font-medium" style={{ color: primaryColor }}>Active link</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── DB connection ─────────────────────────────────────────────────── */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-gray-500" />Database connection
          </h2>
          <div>
            <label className="label" htmlFor="db-url">PostgreSQL connection string</label>
            <div className="relative">
              <input
                id="db-url"
                type={showUrl ? 'text' : 'password'}
                value={dbUrl}
                onChange={(e) => setDbUrl(e.target.value)}
                placeholder="postgresql://user:password@host:5432/spacebooker"
                className="input pr-10 font-mono text-xs"
              />
              <button type="button" onClick={() => setShowUrl(!showUrl)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                {showUrl ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-gray-400">
              Stored locally for now. Wire this into your backend API as an environment variable — never expose it in client-side code in production.
            </p>
          </div>
        </div>

        {/* Save status */}
        <div className="space-y-2">
          {/* localStorage status */}
          {localStatus === DB_STATUS.ok && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700"><strong>Local storage</strong> — saved successfully. Colours applied live.</p>
            </div>
          )}

          {/* Database status */}
          {dbStatus === DB_STATUS.saving && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Loader2 className="w-4 h-4 text-blue-600 flex-shrink-0 animate-spin" />
              <p className="text-sm text-blue-700">Saving to database…</p>
            </div>
          )}
          {dbStatus === DB_STATUS.ok && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <Wifi className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700"><strong>Database</strong> — saved successfully.</p>
            </div>
          )}
          {dbStatus === DB_STATUS.unavailable && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <WifiOff className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-sm text-amber-800 font-medium">Database not connected</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Set <code className="font-mono bg-amber-100 px-1 rounded">POSTGRES_URL</code> in your Vercel environment variables to enable database persistence.
                </p>
              </div>
            </div>
          )}
          {dbStatus === DB_STATUS.error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-700 font-medium">Database error</p>
                {dbError && <p className="text-xs text-red-600 mt-0.5 font-mono">{dbError}</p>}
              </div>
            </div>
          )}
        </div>

        <button type="submit" disabled={saving} className="btn-primary text-sm">
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
            : <><Check className="w-4 h-4" />Save all settings</>
          }
        </button>
      </form>

    </div>
  )
}
