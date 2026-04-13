// api/verify.js
// POST /api/verify        — generate a code and send verification email
// POST /api/verify/confirm — check the code and create a member record
import { withDb, setCors } from './_db.js'
import { sendEmail } from './_mailer.js'

const APP_NAME = process.env.APP_NAME || 'SpaceBooker'

function generateCode() {
  return String(Math.floor(10000 + Math.random() * 90000))
}

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()

  // POST /api/verify — send code
  if (req.method === 'POST') {
    const { email, name, bookingId } = req.body || {}
    if (!email || !name) return res.status(400).json({ error: 'email and name are required' })

    await withDb(req, res, async (client) => {
      const code = generateCode()
      const id   = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

      // Upsert — replace any existing code for this email
      await client.query(
        `DELETE FROM pending_verifications WHERE email = $1`,
        [email.toLowerCase()]
      )
      await client.query(
        `INSERT INTO pending_verifications (id, email, name, code, expires_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, email.toLowerCase(), name, code, expiresAt]
      )

      const { error: emailErr } = await sendEmail({
        to: email,
        subject: `Your ${APP_NAME} verification code: ${code}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
            <h2 style="margin:0 0 8px;font-size:22px;color:#111">Verify your email</h2>
            <p style="margin:0 0 24px;color:#555;font-size:15px">
              Hi ${name}, thanks for making a booking with ${APP_NAME}.
              Enter the code below to verify your email address.
            </p>
            <div style="background:#f4f4f5;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
              <span style="font-size:40px;font-weight:700;letter-spacing:10px;color:#111;font-family:monospace">
                ${code}
              </span>
            </div>
            <p style="margin:0;color:#888;font-size:13px">
              This code expires in 15 minutes. If you didn't make a booking, you can ignore this email.
            </p>
          </div>
        `,
      })

      if (emailErr) {
        console.error('[verify] email send failed:', emailErr)
        return res.status(200).json({ ok: true, emailError: true })
      }

      return res.status(200).json({ ok: true })
    })
    return
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
