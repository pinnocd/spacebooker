// api/hours.js
// GET  /api/hours  — all 7 days as { 0: {open,close,closed}, ... }
// POST /api/hours  — upsert all 7 days (body: same shape)
import { withDb } from './_db.js'

export default async function handler(req, res) {
  await withDb(req, res, async (client) => {
    if (req.method === 'GET') {
      const { rows } = await client.query(
        `SELECT day_of_week, open_time, close_time, closed FROM office_hours ORDER BY day_of_week`
      )
      if (rows.length === 0) {
        // Return defaults if table is empty
        return res.status(200).json(DEFAULT_HOURS)
      }
      const result = {}
      for (const row of rows) {
        result[row.day_of_week] = {
          open: row.open_time,
          close: row.close_time,
          closed: row.closed,
        }
      }
      return res.status(200).json(result)
    }

    if (req.method === 'POST') {
      const hours = req.body || {}
      for (let day = 0; day <= 6; day++) {
        const h = hours[day] || hours[String(day)]
        if (!h) continue
        await client.query(
          `INSERT INTO office_hours (day_of_week, open_time, close_time, closed)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (day_of_week) DO UPDATE SET
             open_time=$2, close_time=$3, closed=$4`,
          [day, h.open || '09:00', h.close || '18:00', h.closed ?? false]
        )
      }
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  })
}

const DEFAULT_HOURS = {
  0: { open: '09:00', close: '18:00', closed: true },
  1: { open: '08:00', close: '18:00', closed: false },
  2: { open: '08:00', close: '18:00', closed: false },
  3: { open: '08:00', close: '18:00', closed: false },
  4: { open: '08:00', close: '18:00', closed: false },
  5: { open: '08:00', close: '18:00', closed: false },
  6: { open: '09:00', close: '18:00', closed: true },
}
