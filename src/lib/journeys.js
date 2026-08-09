import {
  collection,
  doc,
  addDoc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

const COLLECTION = 'journeys'
export const DEMO_JOURNEY_ID = 'demo-journey'

export async function createJourney({ name, destination, etaMinutes, contactName, contactEmail }) {
  const ref = await addDoc(collection(db, COLLECTION), {
    name,
    destination,
    etaMinutes,
    contactName,
    contactEmail,
    status: 'on_the_way',
    startedAt: serverTimestamp(),
    lastCheckIn: serverTimestamp(),
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

export async function checkIn(id) {
  await updateDoc(doc(db, COLLECTION, id), { lastCheckIn: serverTimestamp() })
}

export async function markSafe(id) {
  await updateDoc(doc(db, COLLECTION, id), { status: 'safe' })
}

export async function markSOS(id) {
  await updateDoc(doc(db, COLLECTION, id), { status: 'sos' })
}

export async function markOverdue(id) {
  await updateDoc(doc(db, COLLECTION, id), { status: 'overdue' })
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
  })
}
