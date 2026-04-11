// api/_db.js — shared database helpers (not a route — prefixed with _)
import pg from 'pg'
const { Pool } = pg

let _pool = null

export function getPool() {
  if (_pool) return _pool
  if (!process.env.POSTGRES_URL) return null
  _pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 5,
  })
  return _pool
}

export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

/** Wraps a handler with CORS, pool check, error handling, and client release. */
export async function withDb(req, res, handler) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()

  const pool = getPool()
  if (!pool) {
    return res.status(503).json({ error: 'Database not configured. Set POSTGRES_URL in environment variables.' })
  }

  let client
  try {
    client = await pool.connect()
    await ensureSchema(client)
    await handler(client, req, res)
  } catch (err) {
    console.error('[db]', err.message)
    if (!res.headersSent) res.status(500).json({ error: err.message })
  } finally {
    client?.release()
  }
}

/** Creates all tables if they don't already exist. Idempotent. */
async function ensureSchema(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS spaces (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      type        TEXT NOT NULL,
      capacity    INTEGER NOT NULL DEFAULT 1,
      description TEXT DEFAULT '',
      amenities   TEXT[] DEFAULT '{}',
      active      BOOLEAN NOT NULL DEFAULT true,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS office_hours (
      day_of_week INTEGER PRIMARY KEY,
      open_time   TEXT NOT NULL DEFAULT '09:00',
      close_time  TEXT NOT NULL DEFAULT '18:00',
      closed      BOOLEAN NOT NULL DEFAULT false
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id          TEXT PRIMARY KEY,
      space_id    TEXT NOT NULL,
      space_name  TEXT NOT NULL,
      user_name   TEXT NOT NULL,
      user_email  TEXT NOT NULL,
      date        TEXT NOT NULL,
      start_time  TEXT NOT NULL,
      end_time    TEXT NOT NULL,
      notes       TEXT DEFAULT '',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_bookings_space_date ON bookings(space_id, date);
    CREATE INDEX IF NOT EXISTS idx_bookings_email      ON bookings(user_email);

    CREATE TABLE IF NOT EXISTS members (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT UNIQUE NOT NULL,
      password    TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'pending',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);

    CREATE TABLE IF NOT EXISTS admin_users (
      id          TEXT PRIMARY KEY,
      username    TEXT UNIQUE NOT NULL,
      password    TEXT NOT NULL,
      name        TEXT NOT NULL,
      role        TEXT NOT NULL DEFAULT 'admin',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS app_config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)
}

/** Check if a booking overlaps with existing ones for the same space+date. */
export async function hasOverlap(client, spaceId, date, startTime, endTime, excludeId = null) {
  const existing = await client.query(
    `SELECT id, start_time, end_time FROM bookings
     WHERE space_id = $1 AND date = $2 ${excludeId ? 'AND id != $3' : ''}`,
    excludeId ? [spaceId, date, excludeId] : [spaceId, date]
  )
  const toMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
  const s = toMins(startTime), e = toMins(endTime)
  return existing.rows.some(r => s < toMins(r.end_time) && e > toMins(r.start_time))
}
