/**
 * Countdown against a presigned-URL expiry timestamp.
 *
 * `fraction` is remaining/total where total is measured from `mintedAt`
 * (job completion time) to `expiresAt` — drives the ExpiryRing. The
 * interval only runs while a live expiry is in the future.
 */

import { useEffect, useState } from 'react'

export interface ExpiryCountdown {
  remainingMs: number
  expired: boolean
  /** 0..1 share of the link's lifetime still left (0 when expired/unknown). */
  fraction: number
}

const FALLBACK_LIFETIME_MS = 15 * 60 * 1000

export function useExpiryCountdown(expiresAt?: string, mintedAt?: string): ExpiryCountdown {
  const [now, setNow] = useState(() => Date.now())

  const expiryMs = expiresAt ? Date.parse(expiresAt) : Number.NaN
  const hasExpiry = Number.isFinite(expiryMs)
  const live = hasExpiry && expiryMs > now

  useEffect(() => {
    if (!live) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [live])

  if (!hasExpiry) return { remainingMs: 0, expired: false, fraction: 0 }

  const remainingMs = Math.max(0, expiryMs - now)
  const mintedMs = mintedAt ? Date.parse(mintedAt) : Number.NaN
  const lifetimeMs = Number.isFinite(mintedMs) && expiryMs > mintedMs
    ? expiryMs - mintedMs
    : FALLBACK_LIFETIME_MS

  return {
    remainingMs,
    expired: remainingMs <= 0,
    fraction: Math.max(0, Math.min(1, remainingMs / lifetimeMs)),
  }
}

/** mm:ss for the countdown label. */
export function formatMmSs(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
