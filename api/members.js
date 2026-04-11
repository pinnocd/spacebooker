// api/members.js
// GET    /api/members           — all members (no passwords)
// POST   /api/members           — register new member
// PATCH  /api/members?id=       — update status
// DELETE /api/members?id=       — delete member
import { withDb } from './_db.js'
import { createHash } from 'crypto'

function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex')
}

export default async function handler(req, res) {
  await withDb(req, res, async (client) => {
    const id = req.query?.id

    if (req.method === 'GET') {
      const { rows } = await client.query(
        `SELECT id, name, email, status, created_at FROM members ORDER BY created_at DESC`
      )
      return res.status(200).json(rows.map(normalise))
    }

    if (req.method === 'POST') {
      const { name, email, password } = req.body || {}
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'name, email and password are required' })
      }
      const normalEmail = email.trim().toLowerCase()
      const existing = await client.query(`SELECT id FROM members WHERE email = $1`, [normalEmail])
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'An account with that email already exists.' })
      }
      const newId = `member-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      await client.query(
        `INSERT INTO members (id, name, email, password, status) VALUES ($1, $2, $3, $4, $5)`,
        [newId, name.trim(), normalEmail, hashPassword(password), 'pending']
      )
      const { rows } = await client.query(
        `SELECT id, name, email, status, created_at FROM members WHERE id = $1`,
        [newId]
      )
      return res.status(201).json(normalise(rows[0]))
    }

    if (req.method === 'PATCH') {
      if (!id) return res.status(400).json({ error: 'id query param required' })
      const { status } = req.body || {}
      if (!status) return res.status(400).json({ error: 'status is required' })
      await client.query(`UPDATE members SET status = $2 WHERE id = $1`, [id, status])
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'id query param required' })
      await client.query(`DELETE FROM members WHERE id = $1`, [id])
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  })
}

function normalise(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    status: row.status,
    createdAt: row.created_at,
  }
}
