/**
 * Mini countdown ring for the download-link expiry (prototype `ExpiryRing`).
 * Color comes from the parent via `currentColor`.
 */

export interface ExpiryRingProps {
  /** 0..1 share of the link lifetime remaining. */
  fraction: number
}

export function ExpiryRing({ fraction }: ExpiryRingProps) {
  const r = 7
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(1, fraction))
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      className="-rotate-90 shrink-0"
      aria-hidden="true"
    >
      <circle
        cx="9"
        cy="9"
        r={r}
        fill="none"
        stroke="rgb(var(--border-secondary))"
        strokeWidth="2.5"
      />
      <circle
        cx="9"
        cy="9"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - clamped)}
      />
    </svg>
  )
}
