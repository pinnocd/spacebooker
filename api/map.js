// api/map.js
// GET  /api/map — fetch floor map (background image + pin positions)
// POST /api/map — save floor map
import { withDb, setCors } from './_db.js'

const EMPTY = { backgroundImage: null, pins: [] }

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()

  await withDb(req, res, async (client) => {
    if (req.method === 'GET') {
      const { rows } = await client.query(
        `SELECT value FROM app_config WHERE key = 'floorMap'`
      )
      if (rows.length === 0) return res.status(200).json(EMPTY)
      try {
        return res.status(200).json(JSON.parse(rows[0].value))
      } catch {
        return res.status(200).json(EMPTY)
      }
    }

    if (req.method === 'POST') {
      const { backgroundImage, pins } = req.body || {}
      const value = JSON.stringify({
        backgroundImage: backgroundImage || null,
        pins: Array.isArray(pins) ? pins : [],
      })
      await client.query(
        `INSERT INTO app_config (key, value) VALUES ('floorMap', $1)
         ON CONFLICT (key) DO UPDATE SET value = $1`,
        [value]
      )
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  })
}
