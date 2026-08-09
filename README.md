# 🛡️ SafeStep

**[Live app](https://safe-step-weld.vercel.app/)**
**[See it in action — sample journey, no signup needed](https://safe-step-weld.vercel.app/track/demo-journey)**

## The problem

People walking home alone at night, commuting late, or traveling solo want someone to
know they're safe — but manually texting "reached safe" every few minutes is friction,
and if something actually goes wrong, no one finds out until it's too late. There's no
lightweight way to say "watch over this specific trip" without a phone call, or without
signing up for a heavyweight safety app that needs permissions and setup before it's
useful.

## The solution

SafeStep lets you start a "journey" in seconds: your name, a destination, how long you
expect the trip to take, and one emergency contact. It generates a **shareable live
tracking link** — no login required on either end. Your contact opens the link and sees
your status update in real time. If you don't check in by your expected arrival time,
the status automatically flips to **overdue**. You can also trigger **SOS** at any
point during the trip. Both events are designed to notify your contact immediately.

## Core features

- **Start a journey in under 15 seconds** — name, destination, ETA, and one contact, no account
- **Live shareable tracking link** (`/track/:id`) — updates in real time via Firestore, viewable by anyone with the link
- **One-tap share** — native share sheet (WhatsApp, SMS, etc.) where supported, clipboard copy fallback everywhere else
- **Automatic overdue detection** — a client-side countdown flips the journey to `overdue` the moment the ETA passes without the traveler marking themselves safe
- **"Running late? +10 min"** — extends the ETA without ending the journey, so real-world delays (traffic, signal) don't trigger a false alarm
- **Check In / Arrived Safely / SOS** controls, visible only while the journey is active
- **Best-effort last-known location** — captured on journey start and check-in via the browser Geolocation API; shown to the contact as a "View on map" link when available
- **Color-coded status at a glance** — on the way (blue), safe (green), overdue (amber), SOS (red, pulsing)
- **Demo journey pre-seeded on first load** (`/track/demo-journey`) so the concept is visible immediately, with no setup

## Tech stack

- **Frontend:** React 19 + Vite, React Router
- **Backend/DB:** Firebase Firestore — real-time `onSnapshot` listeners, no custom server
- **Alerts:** EmailJS (client-side email, no backend needed)
- **Styling:** custom CSS, dark/calm theme, mobile-first, no UI framework
- **Hosting:** Vercel

## How the auto-alert logic works

Each journey document stores `startedAt` and `etaMinutes`. On the tracking page, a
1-second interval computes `remaining = startedAt + etaMinutes*60000 - now` and renders
it as a live countdown. The moment `remaining` crosses zero while `status` is still
`on_the_way`, the client:

1. Updates the Firestore doc's `status` to `overdue` (visible instantly to anyone
   watching the link, including the emergency contact, via the real-time listener)
2. Fires an alert email to the emergency contact via EmailJS

The same alert path fires immediately (no countdown wait) if the traveler taps **SOS**.
If EmailJS environment variables aren't configured in a given deployment, the alert
call degrades gracefully to a console log rather than failing — the status-tracking
flow (the core of the concept) still works end to end either way.

This is intentionally client-triggered rather than server-cron-triggered: it keeps the
architecture serverless and buildable in a hackathon window, at the cost of requiring
the tracking page (or the traveler's own tab) to stay open to detect the overdue
transition. A production version would move this check to a scheduled Cloud Function.

## Project structure

```
src/
  firebase.js          # Firebase app + Firestore init (reads VITE_FIREBASE_* env vars)
  lib/
    journeys.js         # Firestore CRUD: create, subscribe, check-in, safe, SOS, overdue, extendEta, demo-seed
    alerts.js            # EmailJS alert sender, degrades to console log if unconfigured
    location.js           # Best-effort single-point geolocation capture (never blocks the flow)
  components/
    StatusBadge.jsx      # Color-coded status pill (on_the_way/safe/overdue/sos)
  pages/
    Landing.jsx           # Pitch + "Start a Journey" / "See it in action" CTAs
    NewJourney.jsx          # Journey creation form -> writes to Firestore -> redirects to /track/:id
    TrackJourney.jsx         # Real-time tracking view: countdown, status, check-in/safe/SOS actions
  App.jsx                    # Routes + seeds the demo journey on first load
  main.jsx                     # Router + app entry
```

## Local setup

```bash
npm install
cp .env.example .env    # fill in your Firebase project config (see below)
npm run dev
```

### Firebase setup

1. Create a project at [Firebase Console](https://console.firebase.google.com/)
2. Add a Web App to the project, copy the config values into `.env`
3. Enable **Firestore Database** in test mode (sufficient for the hackathon window)

### EmailJS setup (optional)

Alerts work without this (they log to console instead). To send real emails, create a
free account at [EmailJS](https://www.emailjs.com/), set up a service + template, and
fill in `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, and
`VITE_EMAILJS_PUBLIC_KEY` in `.env`.

## What's mocked vs real

- **Real:** journey creation, real-time status sync via Firestore, countdown-based
  overdue detection, ETA extension, SOS trigger, shareable links (native share + clipboard),
  best-effort last-known-location capture and map link, demo-journey auto-seed
- **Mocked/out of scope for this MVP:**
  - **Continuous live GPS tracking** — not implemented; location is a single best-effort snapshot captured at journey start and on each check-in, not a moving trail. A real-time location trail (e.g. via `watchPosition`) is the natural next step.
  - **User accounts** — intentionally omitted; each journey is addressable by its own unguessable link instead, to keep the flow frictionless
  - **SMS alerts** — EmailJS stands in for a real SMS/push notification provider (e.g. Twilio) that would be used in production
  - **Native mobile app** — this is a responsive web app; a PWA wrapper or native app is a natural next step for background location and push notifications
