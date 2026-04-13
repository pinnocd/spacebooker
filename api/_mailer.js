// api/_mailer.js — shared email sender
// Priority: Brevo → Gmail SMTP → Resend
// Brevo:  set BREVO_API_KEY + FROM_EMAIL (free tier, just verify sender email at brevo.com)
// Gmail:  set GMAIL_USER + GMAIL_PASS (requires Google App Password with 2FA enabled)
// Resend: set RESEND_API_KEY + FROM_EMAIL (requires verified domain)

import nodemailer from 'nodemailer'

export async function sendEmail({ to, subject, html }) {
  const appName = process.env.APP_NAME || 'SpaceBooker'
  const from    = process.env.FROM_EMAIL || process.env.GMAIL_USER || 'noreply@example.com'
  const sender  = `${appName} <${from}>`

  // ── Brevo ─────────────────────────────────────────────────────────────
  if (process.env.BREVO_API_KEY) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: appName, email: from },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        const msg = body.message || `HTTP ${response.status}`
        console.error('[mailer] Brevo failed:', msg)
        return { error: msg }
      }
      return { error: null }
    } catch (err) {
      console.error('[mailer] Brevo failed:', err.message)
      return { error: err.message }
    }
  }

  // ── Gmail SMTP ────────────────────────────────────────────────────────
  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    try {
      const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
      })
      await transport.sendMail({ from: sender, to, subject, html })
      return { error: null }
    } catch (err) {
      console.error('[mailer] Gmail failed:', err.message)
      return { error: err.message }
    }
  }

  // ── Resend ────────────────────────────────────────────────────────────
  if (process.env.RESEND_API_KEY) {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({ from: sender, to, subject, html })
    if (error) {
      console.error('[mailer] Resend failed:', JSON.stringify(error))
      return { error: error.message || JSON.stringify(error) }
    }
    return { error: null }
  }

  console.error('[mailer] No email provider configured')
  return { error: 'Email service not configured. Set BREVO_API_KEY, GMAIL_USER, or RESEND_API_KEY.' }
}
