// api/bookings.js
// GET    /api/bookings              — all bookings
// GET    /api/bookings?email=       — bookings for an email address
// GET    /api/bookings?spaceId=&date= — bookings for a space on a date
// POST   /api/bookings              — create booking
// DELETE /api/bookings?id=          — cancel booking
import { withDb, hasOverlap } from './_db.js'

export default async function handler(req, res) {
  await withDb(req, res, async (client) => {
    const { id, email, spaceId, date } = req.query || {}

    if (req.method === 'GET') {
      let query = `SELECT * FROM bookings`
      const params = []

      if (email) {
        params.push(email.toLowerCase())
        query += ` WHERE user_email = $1 ORDER BY date DESC, start_time DESC`
      } else if (spaceId && date) {
        params.push(spaceId, date)
        query += ` WHERE space_id = $1 AND date = $2 ORDER BY start_time`
      } else {
        query += ` ORDER BY date DESC, start_time`
      }

      const { rows } = await client.query(query, params)
      return res.status(200).json(rows.map(normalise))
    }

    if (req.method === 'POST') {
      const { id, spaceId, spaceName, userName, userEmail, date, startTime, endTime, notes } = req.body || {}
      if (!id || !spaceId || !date || !startTime || !endTime) {
        return res.status(400).json({ error: 'id, spaceId, date, startTime and endTime are required' })
      }

      const overlap = await hasOverlap(client, spaceId, date, startTime, endTime)
      if (overlap) {
        return res.status(409).json({ error: 'This time slot is no longer available.' })
      }

      await client.query(
        `INSERT INTO bookings (id, space_id, space_name, user_name, user_email, date, start_time, end_time, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [id, spaceId, spaceName, userName, userEmail?.toLowerCase(), date, startTime, endTime, notes ?? '']
      )
      const { rows } = await client.query(`SELECT * FROM bookings WHERE id = $1`, [id])
      return res.status(201).json(normalise(rows[0]))
    }

    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'id query param required' })
      await client.query(`DELETE FROM bookings WHERE id = $1`, [id])
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  })
}

function normalise(row) {
  return {
    id: row.id,
    spaceId: row.space_id,
    spaceName: row.space_name,
    userName: row.user_name,
    userEmail: row.user_email,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    notes: row.notes || '',
    createdAt: row.created_at,
  }
}
