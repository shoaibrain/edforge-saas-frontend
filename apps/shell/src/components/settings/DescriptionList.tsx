/**
 * DescriptionList — read-only label/value rows for settings metadata.
 *
 * Replaces the three hand-rolled `flex justify-between … border-b` blocks that
 * previously lived inline in the Account Details strip, the workspace Tenant
 * Info card, and the Governance Profile card. Each carried its own copy of the
 * same row, divider, label, and copy-button markup.
 *
 * Two layouts:
 *   - `rows` (default): label left, value right, hairline dividers between.
 *     Used inside the wider context cards (Tenant Info, Governance).
 *   - `stacked`: label above value. Used in the narrow account rail where a
 *     long value (a UUID) needs the full column width.
 */

import { useState, type ReactNode } from 'react'
import { Copy, Check, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DescriptionListItem {
  label: ReactNode
  value: ReactNode
  /** When set, render a copy-to-clipboard button after the value. */
  copyable?: string
  /** Render a small lock glyph before the value (governance / read-only fields). */
  locked?: boolean
  lockLabel?: string
  /** Render the value in a monospaced face (ids, codes). */
  mono?: boolean
}

export interface DescriptionListProps {
  items: DescriptionListItem[]
  layout?: 'rows' | 'stacked'
  className?: string
}

function CopyValueButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 rounded p-1 text-[rgb(var(--text-tertiary))] transition-colors hover:bg-[rgb(var(--background-tertiary))] hover:text-[rgb(var(--text-secondary))]"
      title="Copy to clipboard"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-[rgb(var(--state-success-fg))]" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  )
}

function LockGlyph({ label }: { label?: string }) {
  return <Lock className="h-3 w-3 shrink-0 text-[rgb(var(--text-tertiary))]" aria-label={label ?? 'Locked'} />
}

export function DescriptionList({ items, layout = 'rows', className }: DescriptionListProps) {
  if (layout === 'stacked') {
    return (
      <dl className={cn('space-y-3', className)}>
        {items.map((item, i) => (
          <div key={i} className="min-w-0 space-y-1">
            <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[rgb(var(--text-tertiary))]">
              {item.label}
            </dt>
            <dd className="flex min-w-0 items-center gap-1.5 text-sm text-[rgb(var(--text-primary))]">
              {item.locked && <LockGlyph label={item.lockLabel} />}
              <span
                className={cn('min-w-0 truncate', item.mono && 'font-mono text-xs')}
                title={typeof item.value === 'string' ? item.value : undefined}
              >
                {item.value}
              </span>
              {item.copyable && <CopyValueButton text={item.copyable} />}
            </dd>
          </div>
        ))}
      </dl>
    )
  }

  return (
    <dl className={cn('divide-y divide-[rgb(var(--border-tertiary))]', className)}>
      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
          <dt className="text-xs font-medium uppercase tracking-wide text-[rgb(var(--text-tertiary))]">
            {item.label}
          </dt>
          <dd className="flex min-w-0 items-center justify-end gap-1.5 text-sm font-semibold text-[rgb(var(--text-primary))]">
            {item.locked && <LockGlyph label={item.lockLabel} />}
            <span
              className={cn('min-w-0 truncate', item.mono && 'font-mono text-xs font-normal')}
              title={typeof item.value === 'string' ? item.value : undefined}
            >
              {item.value}
            </span>
            {item.copyable && <CopyValueButton text={item.copyable} />}
          </dd>
        </div>
      ))}
    </dl>
  )
}
