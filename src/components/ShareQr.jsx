import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export default function ShareQr({ value, size = 132 }) {
  const [dataUrl, setDataUrl] = useState(null)

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: { dark: '#0b1220', light: '#eef2fb' },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url)
      })
      .catch((err) => console.warn('[SafeStep] QR generation failed', err))
    return () => {
      cancelled = true
    }
  }, [value, size])

  if (!dataUrl) return <div className="qr-placeholder" style={{ width: size, height: size }} />

  return <img src={dataUrl} width={size} height={size} alt="QR code for this tracking link" className="qr-code" />
}
