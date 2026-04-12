// api/verify/confirm.js
// POST /api/verify/confirm — validate code, create member with status 'active'
import { withDb, setCors } from '../_db.js'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, code } = req.body || {}
  if (!email || !code) return res.status(400).json({ error: 'email and code are required' })

  await withDb(req, res, async (client) => {
    const { rows } = await client.query(
      `SELECT * FROM pending_verifications WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
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

    // Code is valid — create member with active status (no approval required)
    const existing = await client.query(
      `SELECT id FROM members WHERE email = $1`, [email.toLowerCase()]
    )

    if (existing.rows.length === 0) {
      await client.query(
        `INSERT INTO members (id, name, email, password, status)
         VALUES ($1, $2, $3, '', 'active')
         ON CONFLICT (email) DO NOTHING`,
        [crypto.randomUUID(), record.name, email.toLowerCase()]
      )
    }

    // Clean up verification record
    await client.query(`DELETE FROM pending_verifications WHERE id = $1`, [record.id])

    return res.status(200).json({ ok: true, name: record.name, email: record.email })
  })
}
