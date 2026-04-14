// api/config.js
// GET  /api/config  — read app config from db
// POST /api/config  — upsert app config keys
import { withDb, setCors } from './_db.js'

const ALLOWED_KEYS = ['appName', 'tagline', 'logo', 'primaryColor', 'secondaryColor']

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()

  await withDb(req, res, async (client) => {
    if (req.method === 'GET') {
      const { rows } = await client.query(
        `SELECT key, value FROM app_config WHERE key = ANY($1)`,
        [ALLOWED_KEYS]
      )
      const config = {}
      for (const row of rows) {
        try { config[row.key] = JSON.parse(row.value) } catch { config[row.key] = row.value }
      }
      return res.status(200).json(config)
    }

    if (req.method === 'POST') {
      const body = req.body || {}
      const updates = Object.entries(body).filter(([k]) => ALLOWED_KEYS.includes(k))
      if (updates.length === 0) return res.status(400).json({ error: 'No valid config keys provided.' })
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
  })
}
