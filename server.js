// Local dev server — serves api/* routes so Vite can proxy to them.
// NOT used in production (Vercel runs the api/ functions directly).
import 'dotenv/config'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load .env.local manually (dotenv/config only loads .env)
const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const raw = readFileSync(resolve(__dirname, '.env.local'), 'utf8')
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const [key, ...rest] = trimmed.split('=')
    if (key && !(key in process.env)) process.env[key] = rest.join('=')
  }
} catch { /* .env.local is optional */ }

import express from 'express'

// Import all API handlers
import configHandler    from './api/config.js'
import spacesHandler    from './api/spaces.js'
import hoursHandler     from './api/hours.js'
import bookingsHandler  from './api/bookings.js'
import membersHandler   from './api/members.js'
import adminUsersHandler from './api/admin-users.js'
import memberAuthHandler  from './api/auth/member.js'
import adminAuthHandler   from './api/auth/admin.js'
import verifyHandler      from './api/verify.js'
import verifyConfirmHandler from './api/verify/confirm.js'

const app = express()
app.use(express.json({ limit: '2mb' }))

// Adapt Vercel-style handlers (req, res) to Express
function route(handler) {
  return (req, res) => handler(req, res)
}

app.all('/api/config',          route(configHandler))
app.all('/api/spaces',          route(spacesHandler))
app.all('/api/hours',           route(hoursHandler))
app.all('/api/bookings',        route(bookingsHandler))
app.all('/api/members',         route(membersHandler))
app.all('/api/admin-users',     route(adminUsersHandler))
app.all('/api/auth/member',      route(memberAuthHandler))
app.all('/api/auth/admin',       route(adminAuthHandler))
app.all('/api/verify/confirm',   route(verifyConfirmHandler))
app.all('/api/verify',           route(verifyHandler))

const PORT = process.env.API_PORT || 3001
app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`))
