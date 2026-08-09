import { Link } from 'react-router-dom'
import { DEMO_JOURNEY_ID } from '../lib/journeys'
import StatusBadge from '../components/StatusBadge'
import CountdownRing from '../components/CountdownRing'

export default function Landing() {
  return (
    <div className="page landing-page">
      <nav className="nav-bar">
        <div className="brand">
          <span className="brand-mark">🛡️</span>
          SafeStep
        </div>
        <Link to={`/track/${DEMO_JOURNEY_ID}`} className="nav-link">
          Live demo →
        </Link>
      </nav>

      <div className="landing-hero-wrap">
        <div className="hero-split">
          <div className="hero-copy">
            <span className="eyebrow">Safety, simplified</span>
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
                <span className="stat-icon">✨</span>
                <span className="stat-label">AI safety tips</span>
              </div>
              <div className="stat">
                <span className="stat-icon">🔓</span>
                <span className="stat-label">No signup needed</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="glow-blob blob-a" />
            <div className="glow-blob blob-b" />

            <Link to={`/track/${DEMO_JOURNEY_ID}`} className="mock-frame" aria-label="See a live tracking demo">
              <div className="mock-topbar">
                <span />
                <span />
                <span />
              </div>
              <div className="mock-content">
                <div className="mock-traveler">Aisha</div>
                <div className="mock-destination">→ Home, Andheri Station</div>
                <StatusBadge status="on_the_way" />
                <CountdownRing progress={0.62} size={132} strokeWidth={8}>
                  <div className="mock-ring-value">12:45</div>
                </CountdownRing>
                <div className="mock-cta">Tap to see it live →</div>
              </div>
            </Link>

            <div className="floating-chip chip-a">✓ Contact notified live</div>
            <div className="floating-chip chip-b">🔒 No signup needed</div>
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

        <footer className="site-footer">Built for Hack Devengers 1.0 · SafeStep</footer>
      </div>
    </div>
  )
}
