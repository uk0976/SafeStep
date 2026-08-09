import { callGroqJson } from './_groq.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { destination } = req.body ?? {}
  if (!destination || typeof destination !== 'string') {
    res.status(400).json({ error: 'destination is required' })
    return
  }

  try {
    const parsed = await callGroqJson({
      system:
        'You give brief, general personal-safety reminders for someone walking or commuting alone. ' +
        'You have no real-time information about any specific location, route, or area — never claim ' +
        'to know about actual conditions, crime rates, or hazards at the destination. Give universally ' +
        'sound, generic safety habits (well-lit routes, staying aware, sharing your live location, ' +
        'trusting your instincts, keeping your phone charged) framed naturally around the kind of ' +
        'place the person mentioned. ' +
        'Respond with JSON only, no other text, in exactly this shape: ' +
        '{"tips": ["short tip", "short tip", "short tip"]} — 3 to 4 tips, each under 15 words.',
      user: `Destination: ${destination.slice(0, 200)}`,
      maxTokens: 300,
    })

    const tips = Array.isArray(parsed.tips) ? parsed.tips.filter((t) => typeof t === 'string').slice(0, 4) : []
    res.status(200).json({ tips })
  } catch (err) {
    console.error('[safety-tips] Groq API error', err)
    res.status(200).json({ tips: [], error: 'unavailable' })
  }
}
