import React, { useState, useEffect, useRef } from 'react'
import { Settings, Database, Check, AlertCircle, ChevronDown, ChevronRight, Eye, EyeOff, ToggleLeft, ToggleRight, Palette, Upload, X, Image } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { getConfig, saveConfig } from '../../utils/data'

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

const SQL_SCHEMA = `-- ============================================================
-- SpaceBooker PostgreSQL Schema
-- Run this in psql or your database tool (e.g. pgAdmin, DBeaver)
-- ============================================================

-- Users (members who make bookings)
CREATE TABLE IF NOT EXISTS members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,          -- store bcrypt hash in production
  status      TEXT NOT NULL DEFAULT 'pending',  -- pending | active | suspended
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin users
CREATE TABLE IF NOT EXISTS admin_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username    TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,          -- store bcrypt hash in production
  name        TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'admin',  -- admin | superadmin
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Spaces (rooms and tables)
CREATE TABLE IF NOT EXISTS spaces (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL,          -- room | table
  capacity    INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  amenities   TEXT[] DEFAULT '{}',
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Office open hours (one row per day of week)
CREATE TABLE IF NOT EXISTS office_hours (
  day_of_week INTEGER PRIMARY KEY,   -- 0=Sunday … 6=Saturday
  open_time   TIME,
  close_time  TIME,
  closed      BOOLEAN NOT NULL DEFAULT false
);

-- Pre-populate default hours
INSERT INTO office_hours (day_of_week, open_time, close_time, closed) VALUES
  (0, '09:00', '18:00', true),
  (1, '08:00', '18:00', false),
  (2, '08:00', '18:00', false),
  (3, '08:00', '18:00', false),
  (4, '08:00', '18:00', false),
  (5, '08:00', '18:00', false),
  (6, '09:00', '18:00', true)
ON CONFLICT (day_of_week) DO NOTHING;

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id    UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  space_name  TEXT NOT NULL,
  member_id   UUID REFERENCES members(id) ON DELETE SET NULL,
  user_name   TEXT NOT NULL,
  user_email  TEXT NOT NULL,
  date        DATE NOT NULL,
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_overlap EXCLUDE USING gist (
    space_id WITH =,
    daterange(date, date, '[]') WITH &&,
    timerange(start_time, end_time) WITH &&
  )
);

-- App config (key-value store)
CREATE TABLE IF NOT EXISTS app_config (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL
);

INSERT INTO app_config (key, value) VALUES
  ('require_approval', 'true')
ON CONFLICT (key) DO NOTHING;

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_bookings_space_date ON bookings(space_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_member     ON bookings(member_id);
CREATE INDEX IF NOT EXISTS idx_bookings_email      ON bookings(user_email);
CREATE INDEX IF NOT EXISTS idx_members_email       ON members(email);`

function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="font-medium text-gray-900">{title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-5 py-4 bg-white">{children}</div>}
    </div>
  )
}

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
  const [requireApproval, setRequireApproval] = useState(true)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [logoError, setLogoError] = useState('')

  useEffect(() => {
    const cfg = getConfig()
    setAppName(cfg.appName || 'OfficeBook')
    setLogo(cfg.logo || '')
    setPrimaryColor(cfg.primaryColor || '#2563eb')
    setSecondaryColor(cfg.secondaryColor || '#7c3aed')
    setDbUrl(cfg.dbUrl || '')
    setRequireApproval(cfg.requireApproval !== false)
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

  const handleSave = (e) => {
    e.preventDefault()
    const cfg = { appName: appName.trim() || 'OfficeBook', logo, primaryColor, secondaryColor, dbUrl: dbUrl.trim(), requireApproval }
    saveConfig(cfg)
    setConfig(cfg)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SCHEMA)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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

        {/* ── General settings ─────────────────────────────────────────────── */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-500" />General settings
          </h2>

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Require admin approval for new accounts</p>
              <p className="text-xs text-gray-500 mt-0.5">
                When on, new registrations are held as <em>pending</em> until an admin approves them.
                When off, accounts activate immediately.
              </p>
            </div>
            <button type="button" onClick={() => setRequireApproval(!requireApproval)}
              className="flex-shrink-0 mt-0.5" aria-label="Toggle approval requirement">
              {requireApproval
                ? <ToggleRight className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
                : <ToggleLeft className="w-8 h-8 text-gray-300" />
              }
            </button>
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

        {/* Save */}
        {saved && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700">Settings saved — colours applied live.</p>
          </div>
        )}
        <button type="submit" className="btn-primary text-sm">
          <Check className="w-4 h-4" />Save all settings
        </button>
      </form>

      {/* ── PostgreSQL setup guide ────────────────────────────────────────── */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-900 text-lg">PostgreSQL setup guide</h2>
        <p className="text-sm text-gray-500">
          The app currently uses browser localStorage. Follow these steps to migrate to a real PostgreSQL database.
        </p>

        <Section title="Step 1 — Create a PostgreSQL database" defaultOpen>
          <div className="space-y-3 text-sm text-gray-700">
            <p><strong>Option A — Neon (recommended, free tier):</strong></p>
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>Go to <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">neon.tech</span> and create a free account.</li>
              <li>Click <em>New project</em>, name it <strong>spacebooker</strong>.</li>
              <li>Copy the connection string — it looks like:<br />
                <code className="block mt-1 text-xs bg-gray-100 px-3 py-2 rounded font-mono break-all">
                  postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/spacebooker?sslmode=require
                </code>
              </li>
            </ol>
            <p className="mt-3"><strong>Option B — Supabase (also free):</strong></p>
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>Go to <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">supabase.com</span> → New project.</li>
              <li>Settings → Database → copy the <em>Connection string (URI)</em>.</li>
            </ol>
            <p className="mt-3"><strong>Option C — Local Docker:</strong></p>
            <code className="block text-xs bg-gray-100 px-3 py-2 rounded font-mono">
              docker run -d --name spacebooker-db \<br />
              {'  '}-e POSTGRES_PASSWORD=secret \<br />
              {'  '}-e POSTGRES_DB=spacebooker \<br />
              {'  '}-p 5432:5432 postgres:16
            </code>
            <p className="text-xs text-gray-500 mt-1">Connection string: <code className="font-mono">postgresql://postgres:secret@localhost:5432/spacebooker</code></p>
          </div>
        </Section>

        <Section title="Step 2 — Run the schema">
          <div className="space-y-3 text-sm text-gray-700">
            <p>Copy the SQL below and run it against your database using psql, pgAdmin, DBeaver, or the Neon/Supabase SQL editor.</p>
            <div className="relative">
              <pre className="text-xs bg-gray-900 text-green-300 rounded-lg p-4 overflow-x-auto max-h-72 leading-relaxed">
                {SQL_SCHEMA}
              </pre>
              <button
                onClick={handleCopy}
                className={`absolute top-2 right-2 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${copied ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                The <code className="font-mono">EXCLUDE USING gist</code> constraint on bookings requires the <strong>btree_gist</strong> extension.
                Run <code className="font-mono">CREATE EXTENSION IF NOT EXISTS btree_gist;</code> first if your database doesn't have it.
              </p>
            </div>
          </div>
        </Section>

        <Section title="Step 3 — Add a backend API">
          <div className="space-y-3 text-sm text-gray-700">
            <p>The React app needs a server-side API to talk to PostgreSQL safely (you never expose DB credentials to the browser). The easiest options:</p>

            <p><strong>Option A — Vercel Serverless Functions (recommended)</strong></p>
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>Create an <code className="font-mono text-xs bg-gray-100 px-1 rounded">api/</code> folder in the repo root.</li>
              <li>Add route files e.g. <code className="font-mono text-xs bg-gray-100 px-1 rounded">api/bookings.js</code>.</li>
              <li>Install: <code className="font-mono text-xs bg-gray-100 px-1 rounded">npm install @vercel/postgres</code></li>
              <li>In Vercel dashboard → Environment Variables, add <code className="font-mono text-xs bg-gray-100 px-1 rounded">POSTGRES_URL</code> with your connection string.</li>
              <li>Example endpoint:</li>
            </ol>
            <pre className="text-xs bg-gray-900 text-green-300 rounded-lg p-4 overflow-x-auto leading-relaxed">{`// api/bookings.js
import { sql } from '@vercel/postgres'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { rows } = await sql\`SELECT * FROM bookings ORDER BY date, start_time\`
    return res.json(rows)
  }
  if (req.method === 'POST') {
    const { space_id, space_name, user_name, user_email, date, start_time, end_time, notes } = req.body
    const { rows } = await sql\`
      INSERT INTO bookings (space_id, space_name, user_name, user_email, date, start_time, end_time, notes)
      VALUES (\${space_id}, \${space_name}, \${user_name}, \${user_email}, \${date}, \${start_time}, \${end_time}, \${notes})
      RETURNING *\`
    return res.status(201).json(rows[0])
  }
}`}</pre>

            <p className="mt-2"><strong>Option B — Express server (self-hosted)</strong></p>
            <code className="block text-xs bg-gray-100 px-3 py-2 rounded font-mono">
              npm install express pg cors dotenv
            </code>
            <p className="text-xs text-gray-500">Create a separate <code className="font-mono">server/</code> directory with an Express app, connect with the <code className="font-mono">pg</code> package using your connection string as <code className="font-mono">DATABASE_URL</code> in a <code className="font-mono">.env</code> file.</p>
          </div>
        </Section>

        <Section title="Step 4 — Replace localStorage with API calls">
          <div className="space-y-3 text-sm text-gray-700">
            <p>Once your API is running, replace the functions in <code className="font-mono text-xs bg-gray-100 px-1 rounded">src/utils/data.js</code> with <code className="font-mono">fetch()</code> calls:</p>
            <pre className="text-xs bg-gray-900 text-green-300 rounded-lg p-4 overflow-x-auto leading-relaxed">{`// Example replacement for getBookings()
export async function getBookings() {
  const res = await fetch('/api/bookings')
  if (!res.ok) throw new Error('Failed to fetch bookings')
  return res.json()
}

// Example replacement for addBooking()
export async function addBooking(data) {
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create booking')
  return res.json()
}`}</pre>
            <p>Update <code className="font-mono text-xs bg-gray-100 px-1 rounded">AppContext.jsx</code> to handle async data loading (add <code className="font-mono">useEffect</code> with <code className="font-mono">await</code> calls and loading/error state).</p>
          </div>
        </Section>

        <Section title="Step 5 — Environment variables on Vercel">
          <div className="space-y-2 text-sm text-gray-700">
            <p>In your Vercel project → <strong>Settings → Environment Variables</strong>, add:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Variable</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr><td className="px-3 py-2 font-mono">POSTGRES_URL</td><td className="px-3 py-2 text-gray-500">Your connection string</td></tr>
                  <tr><td className="px-3 py-2 font-mono">NODE_ENV</td><td className="px-3 py-2 text-gray-500">production</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-2">Never commit the connection string to Git. Always use environment variables.</p>
          </div>
        </Section>
      </div>
    </div>
  )
}
