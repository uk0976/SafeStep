import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createJourney } from '../lib/journeys'
import { captureLocation } from '../lib/location'
import { getSafetyTips } from '../lib/ai'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function NewJourney() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    destination: '',
    etaMinutes: '',
    contactName: '',
    contactEmail: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [tips, setTips] = useState([])
  const [tipsLoading, setTipsLoading] = useState(false)

  function update(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  // Debounced AI safety tips — fires ~800ms after the user stops typing a
  // destination of reasonable length, never blocks the form otherwise.
  useEffect(() => {
    const destination = form.destination.trim()
    if (destination.length < 4) {
      setTips([])
      return
    }
    setTipsLoading(true)
    const timer = setTimeout(async () => {
      const result = await getSafetyTips(destination)
      setTips(result)
      setTipsLoading(false)
    }, 800)
    return () => {
      clearTimeout(timer)
      setTipsLoading(false)
    }
  }, [form.destination])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const eta = Number(form.etaMinutes)
    if (!form.name.trim() || !form.destination.trim()) {
      setError('Please fill in your name and destination.')
      return
    }
    if (!eta || eta <= 0) {
      setError('Enter a valid ETA in minutes.')
      return
    }
    if (!form.contactName.trim() || !EMAIL_RE.test(form.contactEmail)) {
      setError("Enter your emergency contact's name and a valid email.")
      return
    }

    setSubmitting(true)
    try {
      const location = await captureLocation()
      const id = await createJourney({
        name: form.name.trim(),
        destination: form.destination.trim(),
        etaMinutes: eta,
        contactName: form.contactName.trim(),
        contactEmail: form.contactEmail.trim(),
        location,
      })
      navigate(`/track/${id}`)
    } catch (err) {
      console.error('[SafeStep] Failed to create journey', err)
      setError('Something went wrong starting your journey. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="page-narrow">
        <Link to="/" className="back-link">
          ← Back
        </Link>

        <div className="card">
          <div className="card-header">
            <h2>Start a journey</h2>
            <p>We'll generate a live link you can share with someone you trust.</p>
          </div>

          {error && <div className="form-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">Your name</label>
              <input
                id="name"
                type="text"
                placeholder="e.g. Priya"
                value={form.name}
                onChange={update('name')}
                autoComplete="name"
              />
            </div>

            <div className="field">
              <label htmlFor="destination">Destination</label>
              <input
                id="destination"
                type="text"
                placeholder="e.g. Home, Andheri Station"
                value={form.destination}
                onChange={update('destination')}
              />
              {tipsLoading && <div className="tips-loading">Getting safety tips…</div>}
              {!tipsLoading && tips.length > 0 && (
                <div className="tips-box">
                  <span className="tips-label">✨ Safety tips for this route</span>
                  <ul>
                    {tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="field">
              <label htmlFor="eta">Expected time to arrive (minutes)</label>
              <input
                id="eta"
                type="number"
                min="1"
                placeholder="e.g. 20"
                value={form.etaMinutes}
                onChange={update('etaMinutes')}
              />
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="contactName">Emergency contact name</label>
                <input
                  id="contactName"
                  type="text"
                  placeholder="e.g. Riya"
                  value={form.contactName}
                  onChange={update('contactName')}
                />
              </div>
              <div className="field">
                <label htmlFor="contactEmail">Contact email</label>
                <input
                  id="contactEmail"
                  type="email"
                  placeholder="riya@email.com"
                  value={form.contactEmail}
                  onChange={update('contactEmail')}
                  autoComplete="email"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Starting…' : 'Start Journey & Get Link'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
