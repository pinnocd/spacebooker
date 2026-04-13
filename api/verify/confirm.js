// api/verify/confirm.js
// GET  /api/verify/confirm?token= — activate account via email link
// POST /api/verify/confirm        — validate 5-digit booking code
import { withDb, setCors } from '../_db.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()

  // ── GET — registration link click ─────────────────────────────────────
  if (req.method === 'GET') {
    const { token } = req.query || {}
    if (!token) return res.status(400).json({ error: 'token is required' })

    await withDb(req, res, async (client) => {
      const { rows } = await client.query(
        `SELECT * FROM pending_verifications WHERE id = $1 AND type = 'registration'`,
        [token]
      )

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Invalid or already used confirmation link.' })
      }

      const record = rows[0]

      if (new Date() > new Date(record.expires_at)) {
        await client.query(`DELETE FROM pending_verifications WHERE id = $1`, [record.id])
        return res.status(410).json({ error: 'This link has expired. Please register again.' })
      }

      // Create the member (idempotent — ignore if email already exists)
      const newId = crypto.randomUUID()
      await client.query(
        `INSERT INTO members (id, name, email, phone, password, status)
         VALUES ($1, $2, $3, $4, $5, 'active')
         ON CONFLICT (email) DO NOTHING`,
        [newId, record.name, record.email, record.phone || null, record.password_hash]
      )

      await client.query(`DELETE FROM pending_verifications WHERE id = $1`, [record.id])

      return res.status(200).json({ ok: true, name: record.name, email: record.email })
    })
    return
  }

  // ── POST — booking 5-digit code ────────────────────────────────────────
  if (req.method === 'POST') {
    const { email, code } = req.body || {}
    if (!email || !code) return res.status(400).json({ error: 'email and code are required' })

    await withDb(req, res, async (client) => {
      const { rows } = await client.query(
        `SELECT * FROM pending_verifications WHERE email = $1 AND type = 'booking' ORDER BY created_at DESC LIMIT 1`,
        [email.toLowerCase()]
      )

      if (rows.length === 0) return res.status(404).json({ error: 'No verification pending for this email.' })

      const record = rows[0]

      if (new Date() > new Date(record.expires_at)) {
        await client.query(`DELETE FROM pending_verifications WHERE id = $1`, [record.id])
        return res.status(410).json({ error: 'Code has expired. Please request a new one.' })
      }

      if (record.code !== String(code).trim()) {
        return res.status(422).json({ error: 'Incorrect code. Please try again.' })
      }

      // Add to members if not already there (no password — booking-only account)
      await client.query(
        `INSERT INTO members (id, name, email, phone, password, status)
         VALUES ($1, $2, $3, $4, '', 'active')
         ON CONFLICT (email) DO NOTHING`,
        [crypto.randomUUID(), record.name, record.email, record.phone || null]
      )

      await client.query(`DELETE FROM pending_verifications WHERE id = $1`, [record.id])
      return res.status(200).json({ ok: true, name: record.name, email: record.email })
    })
    return
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
