import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    concern: {
      type: 'boolean',
      description: 'true if the note contains any signal of distress, danger, fear, or something being wrong',
    },
    severity: {
      type: 'string',
      enum: ['none', 'low', 'medium', 'high'],
      description: 'How urgent the signal is. "high" means possible immediate danger.',
    },
    reason: {
      type: 'string',
      description: 'One short sentence explaining the assessment, for the emergency contact to read',
    },
  },
  required: ['concern', 'severity', 'reason'],
  additionalProperties: false,
}

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
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 200,
      system:
        'You screen short check-in notes from someone on a solo walk/commute for signs of distress ' +
        '(being followed, feeling unsafe, an accident, being pressured, asking for help indirectly). ' +
        'Most notes are mundane ("almost home", "running 5 min late", "all good") — for these, concern ' +
        'is false and severity is "none". Only flag concern for genuine signals, not just informal language. ' +
        'Be conservative: false alarms cause real harm by eroding trust in the alert system.',
      messages: [{ role: 'user', content: `Check-in note: "${note.slice(0, 500)}"` }],
      output_config: { format: { type: 'json_schema', schema: ANALYSIS_SCHEMA } },
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    const parsed = JSON.parse(textBlock.text)
    res.status(200).json(parsed)
  } catch (err) {
    console.error('[analyze-checkin] Claude API error', err)
    // Degrade to "no concern detected" rather than blocking the check-in flow
    res.status(200).json({ concern: false, severity: 'none', reason: 'Analysis unavailable', error: 'unavailable' })
  }
}
