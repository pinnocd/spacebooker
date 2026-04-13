// api/_sms.js — SMS sender via Twilio REST API
// Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER in env vars
// Sign up at twilio.com — free trial gives ~$15 credit, no card needed initially

export async function sendSms({ to, body }) {
  const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: token, TWILIO_FROM_NUMBER: from } = process.env

  if (!sid || !token || !from) {
    console.error('[sms] Twilio not configured')
    return { error: 'SMS service not configured.' }
  }

  // Ensure E.164 format (+447911123456)
  const normalised = to.startsWith('+') ? to : `+${to.replace(/\D/g, '')}`

  try {
    const credentials = Buffer.from(`${sid}:${token}`).toString('base64')
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: normalised, From: from, Body: body }).toString(),
      }
    )

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      const msg = data.message || `HTTP ${res.status}`
      console.error('[sms] Twilio failed:', msg)
      return { error: msg }
    }

    return { error: null }
  } catch (err) {
    console.error('[sms] Twilio failed:', err.message)
    return { error: err.message }
  }
}
