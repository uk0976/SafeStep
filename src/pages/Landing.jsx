import { Link } from 'react-router-dom'
import { DEMO_JOURNEY_ID } from '../lib/journeys'

export default function Landing() {
  return (
    <div className="page">
      <div className="page-narrow">
        <div className="brand">
          <span className="brand-mark">🛡️</span>
          SafeStep
        </div>

        <div className="hero">
          <h1>
            Let someone <span>watch over</span> your walk home.
          </h1>
          <p>
            Start a journey in seconds. Share a live link with someone you trust — no
            signup, no app to install. If you go quiet past your ETA, they'll know.
          </p>
        </div>

        <div className="cta-row">
          <Link to="/new" className="btn btn-primary">
            Start a Journey
          </Link>
          <Link to={`/track/${DEMO_JOURNEY_ID}`} className="btn btn-ghost">
            See it in action
          </Link>
        </div>

        <div className="stat-row">
          <div className="stat">
            <span className="stat-icon">📍</span>
            <span className="stat-label">Live status updates</span>
          </div>
          <div className="stat">
            <span className="stat-icon">⏱️</span>
            <span className="stat-label">Auto overdue alerts</span>
          </div>
          <div className="stat">
            <span className="stat-icon">🔓</span>
            <span className="stat-label">No signup needed</span>
          </div>
        </div>

        <div className="how-it-works">
          <h2 className="how-title">How it works</h2>
          <div className="how-steps">
            <div className="how-step">
              <div className="how-number">1</div>
              <div className="how-text">
                <div className="how-heading">Start a journey</div>
                <div className="how-desc">Name, destination, ETA, one emergency contact. Under 15 seconds.</div>
              </div>
            </div>
            <div className="how-step">
              <div className="how-number">2</div>
              <div className="how-text">
                <div className="how-heading">Share the link</div>
                <div className="how-desc">Send it or scan the QR code — your contact needs no account to watch.</div>
              </div>
            </div>
            <div className="how-step">
              <div className="how-number">3</div>
              <div className="how-text">
                <div className="how-heading">They watch, you're covered</div>
                <div className="how-desc">Live status, and an automatic alert if you go quiet past your ETA or hit SOS.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
