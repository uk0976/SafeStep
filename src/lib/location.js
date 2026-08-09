// Best-effort single-point location capture. Never rejects and never blocks
// for long — if permission is denied, unsupported, or slow, resolves to null
// so the journey flow (creation, check-in) is never held up by it.
export function captureLocation({ timeoutMs = 4000 } = {}) {
  if (!('geolocation' in navigator)) return Promise.resolve(null)

  return new Promise((resolve) => {
    let settled = false
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true
        resolve(null)
      }
    }, timeoutMs)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          capturedAt: Date.now(),
        })
      },
      () => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        resolve(null)
      },
      { timeout: timeoutMs, maximumAge: 60000 }
    )
  })
}

export function mapUrl(location) {
  if (!location) return null
  return `https://www.google.com/maps?q=${location.lat},${location.lng}`
}
