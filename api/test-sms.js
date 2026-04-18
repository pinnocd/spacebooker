// api/test-sms.js — temporary diagnostic endpoint
// GET /api/test-sms?to=+447911123456
// Remove this file once SMS is confirmed working.
import { sendSms } from './_sms.js'

export default async function handler(req, res) {
  // Only allow in non-production or with a secret param to prevent misuse
  if (process.env.NODE_ENV === 'production' && req.query.secret !== process.env.TEST_SECRET) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const to = req.query.to
  if (!to) return res.status(400).json({ error: 'Pass ?to=+447911123456' })

  // Log what env vars are present (values masked)
  const config = {
    TWILIO_ACCOUNT_SID:   process.env.TWILIO_ACCOUNT_SID   ? `${process.env.TWILIO_ACCOUNT_SID.slice(0, 6)}…` : 'NOT SET',
    TWILIO_AUTH_TOKEN:    process.env.TWILIO_AUTH_TOKEN     ? '****' : 'NOT SET',
    TWILIO_FROM_NUMBER:   process.env.TWILIO_FROM_NUMBER    || 'NOT SET',
  }

  const { error } = await sendSms({ to, body: 'SpaceBooker test SMS — working correctly.' })

  return res.status(200).json({ config, to, error: error || null, sent: !error })
}
