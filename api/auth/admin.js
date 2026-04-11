// api/auth/admin.js
// POST /api/auth/admin — authenticate an admin user (username + password)
import { withDb } from '../_db.js'
import { createHash } from 'crypto'

function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex')
}

// Seed the default superadmin if the table is empty
async function ensureDefaultAdmin(client) {
  const { rows } = await client.query(`SELECT id FROM admin_users LIMIT 1`)
  if (rows.length === 0) {
    await client.query(
      `INSERT INTO admin_users (id, username, name, password, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (username) DO NOTHING`,
      ['admin-default', 'admin', 'Administrator', hashPassword('admin123'), 'superadmin']
    )
  }
}

export default async function handler(req, res) {
  await withDb(req, res, async (client) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { username, password } = req.body || {}
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' })
    }

    await ensureDefaultAdmin(client)

    const { rows } = await client.query(
      `SELECT id, username, name, role FROM admin_users WHERE username = $1 AND password = $2`,
      [username.trim(), hashPassword(password)]
    )

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' })
    }

    const admin = rows[0]
    return res.status(200).json({
      id: admin.id,
      username: admin.username,
      name: admin.name,
      role: admin.role,
    })
  })
}
