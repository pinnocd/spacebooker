// api/config.js — Vercel serverless function
// Reads/writes app config to the app_config table in PostgreSQL.
// Requires POSTGRES_URL environment variable to be set in Vercel dashboard.
// The dbUrl field is intentionally NOT stored here — it must be set as an
// environment variable on the server, not saved back into the database.

import pg from 'pg'
const { Pool } = pg

let _pool = null

function getPool() {
  if (!_pool) {
    if (!process.env.POSTGRES_URL) return null
    _pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 5,
    })
  }
  return _pool
}

// Keys that are safe to read/write. Excludes dbUrl (server-only env var).
const ALLOWED_KEYS = ['appName', 'logo', 'primaryColor', 'secondaryColor', 'requireApproval']

export default async function handler(req, res) {
  // CORS headers for local dev
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(204).end()

  const pool = getPool()
  if (!pool) {
    return res.status(503).json({ error: 'Database not configured. Set POSTGRES_URL in environment variables.' })
  }

  let client
  try {
    client = await pool.connect()

    // Ensure the table exists (idempotent)
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_config (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `)

    // ── GET — return all config as a flat object ─────────────────────────
    if (req.method === 'GET') {
      const { rows } = await client.query(
        `SELECT key, value FROM app_config WHERE key = ANY($1)`,
        [ALLOWED_KEYS]
      )
      const config = {}
      for (const row of rows) {
        // Booleans and other JSON-serialised values are stored as JSON strings
        try { config[row.key] = JSON.parse(row.value) } catch { config[row.key] = row.value }
      }
      return res.status(200).json(config)
    }

    // ── POST — upsert provided keys ──────────────────────────────────────
    if (req.method === 'POST') {
      const body = req.body || {}
      const updates = Object.entries(body).filter(([k]) => ALLOWED_KEYS.includes(k))

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No valid config keys provided.' })
      }

      for (const [key, value] of updates) {
        const serialised = typeof value === 'string' ? value : JSON.stringify(value)
        await client.query(
          `INSERT INTO app_config (key, value) VALUES ($1, $2)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
          [key, serialised]
        )
      }

      return res.status(200).json({ ok: true, saved: updates.map(([k]) => k) })
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (err) {
    console.error('[api/config]', err)
    return res.status(500).json({ error: err.message })
  } finally {
    client?.release()
  }
}
