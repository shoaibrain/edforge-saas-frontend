import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const MASK = '••••••••'

/** Truncate a UUID-ish string to `first8…last4`, never showing it raw in full. */
function truncateUuid(value: string): string {
  if (value.length <= 13) return value
  return `${value.slice(0, 8)}…${value.slice(-4)}`
}

export interface UuidBadgeProps {
  /** The full identifier value (copied to clipboard); never rendered un-truncated. */
  value: string
  /** Suppress the value + copy affordance entirely (government PII under mask). */
  masked?: boolean
}

/**
 * Mono, truncated, copyable rendering for UUID-shaped identifiers — the
 * replacement for the raw `id.slice(0, 8)` fragments scattered across the app.
 * Empty value renders an em dash; masked renders dots with no copy/tooltip.
 */
export function UuidBadge({ value, masked = false }: UuidBadgeProps) {
  const { t } = useTranslation('identifiers')
  const [copied, setCopied] = useState(false)

  if (!value) return <span className="text-muted-foreground">—</span>
  if (masked) {
    return (
      <span className="font-mono" aria-label="masked identifier">
        {MASK}
      </span>
    )
  }

  const onCopy = async () => {
    try {
      await navigator.clipboard?.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable (e.g. insecure context) — silently no-op
    }
  }

  return (
    <span className="inline-flex items-center gap-1 font-mono" title={value}>
      {truncateUuid(value)}
      <button type="button" onClick={onCopy} aria-label={copied ? t('copied') : t('copy')}>
        {copied ? '✓' : '⧉'}
      </button>
    </span>
  )
}
