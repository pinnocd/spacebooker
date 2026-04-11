// api/admin-users.js
// GET    /api/admin-users        — all admin users (no passwords)
// POST   /api/admin-users        — create admin user
// PATCH  /api/admin-users?id=    — update admin user
// DELETE /api/admin-users?id=    — delete admin user
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
        `SELECT id, username, name, role, created_at FROM admin_users ORDER BY created_at`
      )
      return res.status(200).json(rows.map(normalise))
    }

    if (req.method === 'POST') {
      const { username, name, password, role } = req.body || {}
      if (!username || !name || !password) {
        return res.status(400).json({ error: 'username, name and password are required' })
      }
      const existing = await client.query(`SELECT id FROM admin_users WHERE username = $1`, [username])
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Username already exists.' })
      }
      const newId = `admin-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      await client.query(
        `INSERT INTO admin_users (id, username, name, password, role) VALUES ($1, $2, $3, $4, $5)`,
        [newId, username.trim(), name.trim(), hashPassword(password), role || 'admin']
      )
      const { rows } = await client.query(
        `SELECT id, username, name, role, created_at FROM admin_users WHERE id = $1`,
        [newId]
      )
      return res.status(201).json(normalise(rows[0]))
    }

    if (req.method === 'PATCH') {
      if (!id) return res.status(400).json({ error: 'id query param required' })
      const { name, role, password } = req.body || {}
      if (password) {
        await client.query(
          `UPDATE admin_users SET
             name = COALESCE($2, name),
             role = COALESCE($3, role),
             password = $4
           WHERE id = $1`,
          [id, name, role, hashPassword(password)]
        )
      } else {
        await client.query(
          `UPDATE admin_users SET
             name = COALESCE($2, name),
             role = COALESCE($3, role)
           WHERE id = $1`,
          [id, name, role]
        )
      }
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'id query param required' })
      // Prevent deleting the last superadmin
      const { rows: superadmins } = await client.query(
        `SELECT id FROM admin_users WHERE role = 'superadmin'`
      )
      if (superadmins.length === 1 && superadmins[0].id === id) {
        return res.status(400).json({ error: 'Cannot delete the last superadmin account.' })
      }
      await client.query(`DELETE FROM admin_users WHERE id = $1`, [id])
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  })
}

function normalise(row) {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role,
    createdAt: row.created_at,
  }
}
