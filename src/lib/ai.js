// Thin wrappers around the /api serverless functions. Both degrade gracefully
// (empty tips / no-concern) on any failure so AI features never block the
// core safety flow.

export async function getSafetyTips(destination) {
  try {
    const res = await fetch('/api/safety-tips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination }),
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data.tips) ? data.tips : []
  } catch (err) {
    console.warn('[SafeStep] Safety tips unavailable', err)
    return []
  }
}

export async function analyzeCheckIn(note) {
  try {
    const res = await fetch('/api/analyze-checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    })
    if (!res.ok) return { concern: false, severity: 'none', reason: '' }
    return await res.json()
  } catch (err) {
    console.warn('[SafeStep] Check-in analysis unavailable', err)
    return { concern: false, severity: 'none', reason: '' }
  }
}
