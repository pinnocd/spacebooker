// api/members.js
// GET    /api/members      — all members (no passwords)
// POST   /api/members      — register: stores pending verification, sends confirmation email
// PATCH  /api/members?id=  — update status
// DELETE /api/members?id=  — delete member
import { withDb, setCors } from './_db.js'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'

const resend   = new Resend(process.env.RESEND_API_KEY)
const FROM     = process.env.FROM_EMAIL || 'noreply@spacebooker.app'
const APP_NAME = process.env.APP_NAME   || 'SpaceBooker'
const APP_URL  = process.env.APP_URL    || 'https://spacebooker.vercel.app'

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()

  await withDb(req, res, async (client) => {
    const id = req.query?.id

    // ── GET ────────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const { rows } = await client.query(
        `SELECT id, name, email, status, created_at FROM members ORDER BY created_at DESC`
      )
      return res.status(200).json(rows.map(normalise))
    }

    // ── POST — register ────────────────────────────────────────────────────
    if (req.method === 'POST') {
      const { name, email, password } = req.body || {}
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
        `INSERT INTO pending_verifications (id, email, name, password_hash, type, expires_at)
         VALUES ($1, $2, $3, $4, 'registration', $5)`,
        [token, normalEmail, name.trim(), hash, expiresAt]
      )

      // Send confirmation email
      const confirmUrl = `${APP_URL}/verify-email?token=${token}`
      if (!process.env.RESEND_API_KEY) {
        console.error('[members] RESEND_API_KEY is not set — cannot send confirmation email')
        return res.status(500).json({ error: 'Email service is not configured. Please contact the administrator.' })
      }

      const { error: emailErr } = await resend.emails.send({
        from: `${APP_NAME} <${FROM}>`,
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
        console.error('[members] confirmation email failed:', JSON.stringify(emailErr))
        await client.query(`DELETE FROM pending_verifications WHERE id = $1`, [token])
        return res.status(500).json({ error: `Failed to send confirmation email: ${emailErr.message || JSON.stringify(emailErr)}` })
      }

      return res.status(201).json({ pending: true })
    }

    // ── PATCH ──────────────────────────────────────────────────────────────
    if (req.method === 'PATCH') {
      if (!id) return res.status(400).json({ error: 'id query param required' })
      const { status } = req.body || {}
      if (!status) return res.status(400).json({ error: 'status is required' })
      await client.query(`UPDATE members SET status = $2 WHERE id = $1`, [id, status])
      return res.status(200).json({ ok: true })
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
  return { id: row.id, name: row.name, email: row.email, status: row.status, createdAt: row.created_at }
}
