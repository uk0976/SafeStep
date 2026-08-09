import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const TIPS_SCHEMA = {
  type: 'object',
  properties: {
    tips: {
      type: 'array',
      items: { type: 'string' },
      description: '3-4 short, general personal-safety tips, each under 15 words',
    },
  },
  required: ['tips'],
  additionalProperties: false,
}

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
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      system:
        'You give brief, general personal-safety reminders for someone walking or commuting alone. ' +
        'You have no real-time information about any specific location, route, or area — never claim ' +
        'to know about actual conditions, crime rates, or hazards at the destination. Give universally ' +
        'sound, generic safety habits (well-lit routes, staying aware, sharing your live location, ' +
        'trusting your instincts, keeping your phone charged) framed naturally around the kind of ' +
        'place the person mentioned.',
      messages: [
        {
          role: 'user',
          content: `Destination: ${destination.slice(0, 200)}`,
        },
      ],
      output_config: { format: { type: 'json_schema', schema: TIPS_SCHEMA } },
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    const parsed = JSON.parse(textBlock.text)
    res.status(200).json(parsed)
  } catch (err) {
    console.error('[safety-tips] Claude API error', err)
    res.status(200).json({ tips: [], error: 'unavailable' })
  }
}
