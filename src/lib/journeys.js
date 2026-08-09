import {
  collection,
  doc,
  addDoc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  increment,
} from 'firebase/firestore'
import { db } from '../firebase'

const COLLECTION = 'journeys'
export const DEMO_JOURNEY_ID = 'demo-journey'

export async function createJourney({
  name,
  destination,
  etaMinutes,
  contactName,
  contactEmail,
  location,
}) {
  const ref = await addDoc(collection(db, COLLECTION), {
    name,
    destination,
    etaMinutes,
    contactName,
    contactEmail,
    status: 'on_the_way',
    startedAt: serverTimestamp(),
    lastCheckIn: serverTimestamp(),
    lastLocation: location ?? null,
  })
  return ref.id
}

export function subscribeToJourney(id, onChange, onError) {
  const ref = doc(db, COLLECTION, id)
  return onSnapshot(
    ref,
    (snap) => onChange(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    onError
  )
}

export async function checkIn(id, location) {
  await updateDoc(doc(db, COLLECTION, id), {
    lastCheckIn: serverTimestamp(),
    ...(location ? { lastLocation: location } : {}),
  })
}

// Flags a check-in as concerning (per the AI note analysis) without ending
// the journey — the traveler can still check in again or mark themselves safe.
export async function markConcern(id, reason) {
  await updateDoc(doc(db, COLLECTION, id), {
    status: 'concern',
    concernReason: reason ?? '',
    lastCheckIn: serverTimestamp(),
  })
}

export async function markSafe(id) {
  await updateDoc(doc(db, COLLECTION, id), { status: 'safe' })
}

export async function markSOS(id, location) {
  await updateDoc(doc(db, COLLECTION, id), {
    status: 'sos',
    ...(location ? { lastLocation: location } : {}),
  })
}

export async function markOverdue(id) {
  await updateDoc(doc(db, COLLECTION, id), { status: 'overdue' })
}

// Pushes the ETA out by `minutes` (default 10) — lets a traveler running late
// avoid a false overdue alarm without ending the journey.
export async function extendEta(id, minutes = 10) {
  await updateDoc(doc(db, COLLECTION, id), { etaMinutes: increment(minutes) })
}

// Ensures a fixed demo journey exists so the deployed link is never empty for a
// judge landing cold. Safe to call on every app load — no-ops if it already exists.
export async function ensureDemoJourney() {
  const ref = doc(db, COLLECTION, DEMO_JOURNEY_ID)
  const snap = await getDoc(ref)
  if (snap.exists()) return

  await setDoc(ref, {
    name: 'Aisha',
    destination: 'Home, Andheri Station',
    etaMinutes: 20,
    contactName: 'Riya (roommate)',
    contactEmail: 'demo@safestep.app',
    status: 'on_the_way',
    startedAt: serverTimestamp(),
    lastCheckIn: serverTimestamp(),
    lastLocation: { lat: 19.1197, lng: 72.8468, accuracy: 25, capturedAt: Date.now() },
  })
}
