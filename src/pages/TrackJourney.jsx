import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  subscribeToJourney,
  checkIn,
  markSafe,
  markSOS,
  markOverdue,
} from '../lib/journeys'
import { sendAlertEmail } from '../lib/alerts'
import StatusBadge from '../components/StatusBadge'

function toDate(ts) {
  if (!ts) return null
  return typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts)
}

function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function formatTime(date) {
  if (!date) return '—'
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function TrackJourney() {
  const { id } = useParams()
  const [journey, setJourney] = useState(undefined) // undefined = loading, null = not found
  const [now, setNow] = useState(Date.now())
  const [actionPending, setActionPending] = useState(false)
  const overdueAlertSent = useRef(false)

  useEffect(() => {
    const unsubscribe = subscribeToJourney(
      id,
      (data) => setJourney(data),
      (err) => {
        console.error('[SafeStep] Failed to load journey', err)
        setJourney(null)
      }
    )
    return unsubscribe
  }, [id])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const startedAt = journey ? toDate(journey.startedAt) : null
  const etaMs = journey && startedAt ? startedAt.getTime() + journey.etaMinutes * 60000 : null
  const remainingMs = etaMs ? etaMs - now : null

  // Client-side auto-overdue: if the countdown expires while still "on the way",
  // flip status and fire the alert exactly once.
  useEffect(() => {
    if (!journey || journey.status !== 'on_the_way') return
    if (remainingMs === null || remainingMs > 0) return
    if (overdueAlertSent.current) return

    overdueAlertSent.current = true
    markOverdue(id).catch((err) => console.error('[SafeStep] Failed to mark overdue', err))
    sendAlertEmail(journey, 'overdue')
  }, [journey, remainingMs, id])

  async function handleCheckIn() {
    setActionPending(true)
    try {
      await checkIn(id)
    } finally {
      setActionPending(false)
    }
  }

  async function handleSafe() {
    setActionPending(true)
    try {
      await markSafe(id)
    } finally {
      setActionPending(false)
    }
  }

  async function handleSOS() {
    setActionPending(true)
    try {
      await markSOS(id)
      if (journey) await sendAlertEmail(journey, 'sos')
    } finally {
      setActionPending(false)
    }
  }

  if (journey === undefined) {
    return (
      <div className="page">
        <div className="center-state">Loading journey…</div>
      </div>
    )
  }

  if (journey === null) {
    return (
      <div className="page">
        <div className="center-state">
          This journey link doesn't exist or has expired.
          <br />
          <Link to="/" className="back-link" style={{ justifyContent: 'center', marginTop: 16 }}>
            ← Back to SafeStep
          </Link>
        </div>
      </div>
    )
  }

  const lastCheckIn = toDate(journey.lastCheckIn)
  const isActive = journey.status === 'on_the_way'

  return (
    <div className="page">
      <div className="page-narrow">
        <Link to="/" className="back-link">
          ← SafeStep
        </Link>

        <div className="card">
          <div className="track-header">
            <div className="traveler">{journey.name}</div>
            <div className="destination">→ {journey.destination}</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <StatusBadge status={journey.status} />
          </div>

          {isActive && remainingMs !== null && (
            <div className="countdown">
              <div className="countdown-value">
                {remainingMs > 0 ? formatCountdown(remainingMs) : '0:00'}
              </div>
              <div className="countdown-label">
                {remainingMs > 0 ? 'Expected to arrive in' : 'Expected arrival time passed'}
              </div>
            </div>
          )}

          <div className="info-grid">
            <div className="info-row">
              <span className="label">Emergency contact</span>
              <span className="value">{journey.contactName}</span>
            </div>
            <div className="info-row">
              <span className="label">Last check-in</span>
              <span className="value">{formatTime(lastCheckIn)}</span>
            </div>
            <div className="info-row">
              <span className="label">Started at</span>
              <span className="value">{formatTime(startedAt)}</span>
            </div>
          </div>

          {journey.status === 'safe' && (
            <div className="status-banner safe">✓ {journey.name} has arrived safely.</div>
          )}
          {journey.status === 'overdue' && (
            <div className="status-banner overdue">
              ⚠ {journey.name} hasn't checked in past their expected arrival time.
              {journey.contactName} has been notified.
            </div>
          )}
          {journey.status === 'sos' && (
            <div className="status-banner sos">
              🚨 SOS triggered by {journey.name}. {journey.contactName} has been notified
              immediately.
            </div>
          )}

          {isActive && (
            <div className="action-row">
              <button className="btn btn-ghost" onClick={handleCheckIn} disabled={actionPending}>
                Check In
              </button>
              <button className="btn btn-success" onClick={handleSafe} disabled={actionPending}>
                I've Arrived Safely
              </button>
              <button className="btn btn-danger" onClick={handleSOS} disabled={actionPending}>
                🚨 SOS
              </button>
            </div>
          )}
        </div>

        <div className="footer-hint">
          Share this page's link with your emergency contact so they can watch live.
        </div>
      </div>
    </div>
  )
}
