import { callGroqJson } from './_groq.js'

const VALID_SEVERITIES = new Set(['none', 'low', 'medium', 'high'])

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { note } = req.body ?? {}
  if (!note || typeof note !== 'string' || !note.trim()) {
    res.status(400).json({ error: 'note is required' })
    return
  }

  try {
    const parsed = await callGroqJson({
      system:
        'You screen short check-in notes from someone on a solo walk/commute for signs of distress ' +
        '(being followed, feeling unsafe, an accident, being pressured, asking for help indirectly). ' +
        'Most notes are mundane ("almost home", "running 5 min late", "all good") — for these, concern ' +
        'is false and severity is "none". Only flag concern for genuine signals, not just informal language. ' +
        'Be conservative: false alarms cause real harm by eroding trust in the alert system. ' +
        'Respond with JSON only, no other text, in exactly this shape: ' +
        '{"concern": true or false, "severity": "none" or "low" or "medium" or "high", ' +
        '"reason": "one short sentence for the emergency contact"}.',
      user: `Check-in note: "${note.slice(0, 500)}"`,
      maxTokens: 200,
    })

    const severity = VALID_SEVERITIES.has(parsed.severity) ? parsed.severity : 'none'
    res.status(200).json({
      concern: Boolean(parsed.concern),
      severity,
      reason: typeof parsed.reason === 'string' ? parsed.reason.slice(0, 300) : '',
    })
  } catch (err) {
    console.error('[analyze-checkin] Groq API error', err)
    // Degrade to "no concern detected" rather than blocking the check-in flow
    res.status(200).json({ concern: false, severity: 'none', reason: 'Analysis unavailable', error: 'unavailable' })
  }
}
