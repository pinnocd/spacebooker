// api/auth/member.js
// POST /api/auth/member — authenticate a member (email + password)
import { withDb } from '../_db.js'
import { createHash } from 'crypto'

function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex')
}

export default async function handler(req, res) {
  await withDb(req, res, async (client) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' })
    }

    const { rows } = await client.query(
      `SELECT id, name, email, status FROM members WHERE email = $1 AND password = $2`,
      [email.trim().toLowerCase(), hashPassword(password)]
    )

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const member = rows[0]
    if (member.status === 'pending') {
      return res.status(403).json({ error: 'Your account is pending approval.' })
    }
    if (member.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended.' })
    }

    return res.status(200).json({
      id: member.id,
      name: member.name,
      email: member.email,
      status: member.status,
    })
  })
}
