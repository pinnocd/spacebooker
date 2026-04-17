// api/members.js
// GET    /api/members      — all members (no passwords)
// POST   /api/members      — register: stores pending verification, sends confirmation email
// PATCH  /api/members?id=  — update status
// DELETE /api/members?id=  — delete member
import { withDb, setCors } from './_db.js'
import bcrypt from 'bcryptjs'
import { sendEmail } from './_mailer.js'

const APP_NAME = process.env.APP_NAME || 'SpaceBooker'
const APP_URL  = process.env.APP_URL  || 'https://spacebooker.vercel.app'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()

  await withDb(req, res, async (client) => {
    const id = req.query?.id

    // ── GET ────────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const { rows } = await client.query(
        `SELECT id, name, email, phone, status, dark_mode, created_at FROM members ORDER BY created_at DESC`
      )
      return res.status(200).json(rows.map(normalise))
    }

    // ── POST — register ────────────────────────────────────────────────────
    if (req.method === 'POST') {
      const { name, email, password, phone } = req.body || {}
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'name, email and password are required' })
      }
      const normalEmail = email.trim().toLowerCase()

      // Reject if already a confirmed member
      const existing = await client.query(
        `SELECT id FROM members WHERE email = $1`, [normalEmail]
      )
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'An account with that email already exists.' })
      }

      // Store pending registration (replaces any previous attempt for this email)
      const token      = crypto.randomUUID()
      const hash       = await bcrypt.hash(password, 10)
      const expiresAt  = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      await client.query(
        `DELETE FROM pending_verifications WHERE email = $1 AND type = 'registration'`,
        [normalEmail]
      )
      await client.query(
        `INSERT INTO pending_verifications (id, email, name, password_hash, phone, type, expires_at)
         VALUES ($1, $2, $3, $4, $5, 'registration', $6)`,
        [token, normalEmail, name.trim(), hash, phone || null, expiresAt]
      )

      // Send confirmation email
      const confirmUrl = `${APP_URL}/verify-email?token=${token}`
      const { error: emailErr } = await sendEmail({
        to: email,
        subject: `Confirm your ${APP_NAME} account`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
            <h2 style="margin:0 0 8px;font-size:22px;color:#111">Welcome to ${APP_NAME}</h2>
            <p style="margin:0 0 24px;color:#555;font-size:15px">
              Hi ${name.trim()}, click the button below to confirm your email address and activate your account.
            </p>
            <a href="${confirmUrl}"
               style="display:inline-block;background:#2563eb;color:#fff;font-weight:600;
                      font-size:15px;padding:12px 28px;border-radius:8px;text-decoration:none;margin-bottom:24px">
              Confirm my account
            </a>
            <p style="margin:0;color:#888;font-size:13px">
              This link expires in 24 hours. If you didn't create an account you can ignore this email.
            </p>
          </div>
        `,
      })

      if (emailErr) {
        await client.query(`DELETE FROM pending_verifications WHERE id = $1`, [token])
        return res.status(500).json({ error: `Failed to send confirmation email: ${emailErr}` })
      }

      return res.status(201).json({ pending: true })
    }

    // ── PATCH — admin status update ────────────────────────────────────────
    if (req.method === 'PATCH') {
      if (!id) return res.status(400).json({ error: 'id query param required' })
      const { status } = req.body || {}
      if (!status) return res.status(400).json({ error: 'status is required' })
      await client.query(`UPDATE members SET status = $2 WHERE id = $1`, [id, status])
      return res.status(200).json({ ok: true })
    }

    // ── PUT — member self-update (name, phone, optional password change) ───
    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'id query param required' })
      const { name, phone, darkMode, currentPassword, newPassword } = req.body || {}

      const { rows } = await client.query(
        `SELECT id, name, email, phone, status, password, dark_mode, created_at FROM members WHERE id = $1`, [id]
      )
      if (rows.length === 0) return res.status(404).json({ error: 'Member not found' })
      const existing = rows[0]

      if (newPassword) {
        if (!currentPassword) return res.status(400).json({ error: 'Current password is required to set a new password.' })
        const valid = await bcrypt.compare(currentPassword, existing.password)
        if (!valid) return res.status(401).json({ error: 'Current password is incorrect.' })
        if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters.' })
        const newHash = await bcrypt.hash(newPassword, 10)
        await client.query(
          `UPDATE members SET name=$2, phone=$3, password=$4, dark_mode=$5 WHERE id=$1`,
          [id, name?.trim() || existing.name, phone?.trim() || null, newHash, darkMode ?? existing.dark_mode]
        )
      } else {
        await client.query(
          `UPDATE members SET name=$2, phone=$3, dark_mode=$4 WHERE id=$1`,
          [id, name?.trim() || existing.name, phone?.trim() || null, darkMode ?? existing.dark_mode]
        )
      }

      const { rows: updated } = await client.query(
        `SELECT id, name, email, phone, status, dark_mode, created_at FROM members WHERE id=$1`, [id]
      )
      return res.status(200).json(normalise(updated[0]))
    }

    // ── DELETE ─────────────────────────────────────────────────────────────
    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'id query param required' })
      await client.query(`DELETE FROM members WHERE id = $1`, [id])
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  })
}

function normalise(row) {
  return { id: row.id, name: row.name, email: row.email, phone: row.phone || null, status: row.status, darkMode: row.dark_mode ?? false, createdAt: row.created_at }
}
