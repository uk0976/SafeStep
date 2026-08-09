import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  subscribeToJourney,
  checkIn,
  markSafe,
  markSOS,
  markOverdue,
  markConcern,
  extendEta,
} from '../lib/journeys'
import { sendAlertEmail } from '../lib/alerts'
import { captureLocation, mapUrl } from '../lib/location'
import { analyzeCheckIn } from '../lib/ai'
import StatusBadge from '../components/StatusBadge'
import CountdownRing from '../components/CountdownRing'
import ShareQr from '../components/ShareQr'

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

function formatRelative(date, now) {
  if (!date) return '—'
  const diffSec = Math.floor((now - date.getTime()) / 1000)
  if (diffSec < 10) return 'just now'
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} min ago`
  return formatTime(date)
}

export default function TrackJourney() {
  const { id } = useParams()
  const [journey, setJourney] = useState(undefined) // undefined = loading, null = not found
  const [now, setNow] = useState(Date.now())
  const [actionPending, setActionPending] = useState(false)
  const [shareState, setShareState] = useState('idle') // idle | copied
  const [checkInNote, setCheckInNote] = useState('')
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
    if (!journey || (journey.status !== 'on_the_way' && journey.status !== 'concern')) return
    if (remainingMs === null || remainingMs > 0) return
    if (overdueAlertSent.current) return

    overdueAlertSent.current = true
    markOverdue(id).catch((err) => console.error('[SafeStep] Failed to mark overdue', err))
    sendAlertEmail(journey, 'overdue')
  }, [journey, remainingMs, id])

  async function handleCheckIn() {
    setActionPending(true)
    try {
      const location = await captureLocation()
      const note = checkInNote.trim()
      await checkIn(id, location)

      if (note) {
        const analysis = await analyzeCheckIn(note)
        if (analysis.concern && (analysis.severity === 'medium' || analysis.severity === 'high')) {
          await markConcern(id, analysis.reason)
          if (journey) await sendAlertEmail(journey, `check-in flagged: ${analysis.reason}`)
        }
      }
      setCheckInNote('')
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
      const location = await captureLocation()
      await markSOS(id, location)
      if (journey) await sendAlertEmail(journey, 'sos')
    } finally {
      setActionPending(false)
    }
  }

  async function handleExtend() {
    setActionPending(true)
    try {
      await extendEta(id, 10)
    } finally {
      setActionPending(false)
    }
  }

  async function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: `SafeStep — ${journey.name}'s journey`,
          text: `Track ${journey.name}'s journey to ${journey.destination} live.`,
          url,
        })
        return
      } catch (err) {
        if (err?.name === 'AbortError') return
        // fall through to clipboard fallback
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setShareState('copied')
      setTimeout(() => setShareState('idle'), 2000)
    } catch (err) {
      console.error('[SafeStep] Failed to copy link', err)
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
  const isActive = journey.status === 'on_the_way' || journey.status === 'concern'

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
              <CountdownRing
                progress={remainingMs / (journey.etaMinutes * 60000)}
                urgent={remainingMs <= journey.etaMinutes * 60000 * 0.2}
              >
                <div className="countdown-value">
                  {remainingMs > 0 ? formatCountdown(remainingMs) : '0:00'}
                </div>
              </CountdownRing>
              <div className="countdown-label">
                {remainingMs > 0 ? 'Expected to arrive in' : 'Expected arrival time passed'}
              </div>
              <button className="text-btn" onClick={handleExtend} disabled={actionPending}>
                Running late? +10 min
              </button>
            </div>
          )}

          <div className="info-grid">
            <div className="info-row">
              <span className="label">Emergency contact</span>
              <span className="value">{journey.contactName}</span>
            </div>
            <div className="info-row">
              <span className="label">Last check-in</span>
              <span className="value">{formatRelative(lastCheckIn, now)}</span>
            </div>
            <div className="info-row">
              <span className="label">Started at</span>
              <span className="value">{formatTime(startedAt)}</span>
            </div>
            {journey.lastLocation && (
              <div className="info-row">
                <span className="label">Last known location</span>
                <a
                  className="value map-link"
                  href={mapUrl(journey.lastLocation)}
                  target="_blank"
                  rel="noreferrer"
                >
                  View on map ↗
                </a>
              </div>
            )}
          </div>

          {journey.status === 'safe' && (
            <div className="status-banner safe">
              <span className="check-icon">✓</span> {journey.name} has arrived safely.
            </div>
          )}
          {journey.status === 'overdue' && (
            <div className="status-banner overdue">
              ⚠ {journey.name} hasn't checked in past their expected arrival time.{' '}
              {journey.contactName} has been notified.
            </div>
          )}
          {journey.status === 'sos' && (
            <div className="status-banner sos">
              🚨 SOS triggered by {journey.name}. {journey.contactName} has been notified
              immediately.
            </div>
          )}
          {journey.status === 'concern' && (
            <div className="status-banner concern">
              ⚠ A check-in note from {journey.name} was flagged: "{journey.concernReason}".{' '}
              {journey.contactName} has been notified.
            </div>
          )}

          {isActive && (
            <div className="action-row">
              <input
                type="text"
                className="checkin-note"
                placeholder="Optional: how are you doing? (e.g. 'all good, almost there')"
                value={checkInNote}
                onChange={(e) => setCheckInNote(e.target.value)}
                disabled={actionPending}
              />
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

          <div className="share-section">
            <ShareQr value={typeof window !== 'undefined' ? window.location.href : ''} />
            <p className="qr-hint">Scan to open this tracking link on another device</p>
            <button className="btn btn-ghost" onClick={handleShare}>
              {shareState === 'copied' ? '✓ Link copied' : '🔗 Share Tracking Link'}
            </button>
          </div>
        </div>

        <div className="footer-hint">
          Share this page's link with your emergency contact so they can watch live.
        </div>
      </div>
    </div>
  )
}
