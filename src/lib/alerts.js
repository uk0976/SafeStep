// Sends an email alert via EmailJS when a journey goes overdue or SOS is triggered.
// EmailJS is optional: if the env vars aren't configured, this degrades to a
// console log so the core status-tracking flow still works end to end.
import emailjs from '@emailjs/browser'

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

const isConfigured = Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY)

export async function sendAlertEmail(journey, reason) {
  if (!isConfigured) {
    console.warn(
      `[SafeStep] Alert would be sent here (reason: ${reason}) for ${journey.name} → ${journey.contactEmail}. ` +
        'EmailJS is not configured — set VITE_EMAILJS_* env vars to enable real email alerts.'
    )
    return { sent: false, reason: 'not_configured' }
  }

  try {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: journey.contactEmail,
        to_name: journey.contactName,
        traveler_name: journey.name,
        destination: journey.destination,
        alert_reason: reason,
      },
      { publicKey: PUBLIC_KEY }
    )
    return { sent: true }
  } catch (err) {
    console.error('[SafeStep] EmailJS send failed', err)
    return { sent: false, reason: 'send_failed' }
  }
}
