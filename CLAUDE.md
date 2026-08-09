# SafeStep

## What this is
An 8-hour hackathon submission (open innovation track). Submission format is **GitHub
repo + deployed link only — no live demo or presentation**. The deployed app must be
fully self-explanatory to a judge opening it cold, with zero instructions. The README
is the pitch. Git history must show incremental commits made during the build window.

## Problem
People walking home alone at night, commuting late, or traveling solo want someone to
know they're safe — but manually texting "reached safe" every time is friction, and if
something goes wrong, no one finds out until it's too late. There's no lightweight way
to say "watch over this specific trip" without a phone call or a dedicated safety app
requiring signup, permissions, and setup.

## Solution
SafeStep lets a user start a "journey" in seconds: destination, expected arrival time
(minutes), and an emergency contact. It generates a shareable **live tracking link**
(`/track/:id`) the contact can open with no login to see real-time status via a
Firestore `onSnapshot` listener. If the user doesn't check in by ETA, status
auto-flips to `overdue` (and optionally triggers an EmailJS alert). User can hit SOS
at any time.

## Non-goals (explicitly out of scope)
- Real GPS/live location tracking — fake/skip it, ETA countdown only
- User authentication/accounts
- Native mobile app — responsive web only
- Real SMS — EmailJS (optional stretch) or just log/UI banner
- Any fabricated "AI-powered" claims

## Tech stack
- Frontend: React + Vite, React Router
- Backend/DB: Firebase Firestore (real-time listeners, no custom server)
- Alerts: EmailJS (optional stretch — mark "planned" in README if skipped)
- Styling: custom CSS, dark/calm premium theme, mobile-first, no UI framework
- Hosting: Vercel or Firebase Hosting

## Data model — Firestore collection `journeys`
```
{
  name: string,
  destination: string,
  etaMinutes: number,
  contactName: string,
  contactEmail: string,
  status: "on_the_way" | "safe" | "overdue" | "sos",
  startedAt: Timestamp,
  lastCheckIn: Timestamp
}
```
Doc ID is Firestore auto-generated and becomes the `/track/:id` URL, except the
seeded demo journey which uses the fixed ID `demo-journey`.

## Pages
- `/` Landing — headline pitch, "Start a Journey" CTA, "See it in action" → `/track/demo-journey`, qualitative stat row (no fake numbers)
- `/new` New Journey — form (name, destination, ETA minutes, contact name + email) → writes to Firestore with `status: "on_the_way"` → redirects to `/track/:id`
- `/track/:id` Track Journey — real-time status, countdown from `startedAt + etaMinutes`, buttons (Check In / I've Arrived Safely / SOS) visible only while `on_the_way`, client-side timer auto-sets `overdue` on countdown expiry

## Critical requirement: auto-seed demo journey
On app load, check if Firestore doc `journeys/demo-journey` exists; if not, create it
with sample data and `status: "on_the_way"`. Landing page links directly to
`/track/demo-journey` so a judge sees the live-tracking UI with zero setup. This is
the single most important feature — the app must never show an empty/broken state to
a cold judge.

## Design direction
Calm, trustworthy, premium — not "hacky hackathon default." Dark navy background,
soft blue accent `#5b8def`, green for safe states, red for overdue/SOS, generous
spacing, rounded cards (16px radius), big tappable buttons, mobile-first. This is a
safety tool — reassuring, not busy.

## README.md must include
Problem → Solution → live links (deployed link + `/track/demo-journey`) at the very
top → core features (must match what's actually built) → tech stack → how the
auto-alert logic works → project structure → local setup → what's mocked vs real.

## Firebase setup note
Firebase project must be created via the Firebase console (external, user-owned
account) — this repo reads config from `.env` (`VITE_FIREBASE_*` vars, see
`.env.example`). Firestore should be in test mode for the hackathon window.

## Git workflow for this project
Commit incrementally as features land (scaffold → landing → form → tracking page →
seed logic → styling → README → deploy config), not as one final dump — the
hackathon rules require the history to reflect in-event work.
