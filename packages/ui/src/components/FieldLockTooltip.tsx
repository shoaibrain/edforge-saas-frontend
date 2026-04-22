import { Lock } from 'lucide-react'
import { Tooltip } from './Tooltip'
import { cn } from '../utils'

export interface FieldLockTooltipProps {
  /** Lock reason shown in the tooltip. Defaults to the generic immutable message. */
  reason?: string
  /** Tooltip placement. */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** Icon size in px. Defaults to 14. */
  size?: number
  /** Extra classes applied to the icon wrapper. */
  className?: string
}

const DEFAULT_REASON = 'Immutable — write-once at provisioning'

/**
 * FieldLockTooltip — small lock icon with a tooltip explaining why a field is locked.
 *
 * Used next to read-only tenant identity fields (archetype, country, tier) and —
 * in later sprints — next to fields that are locked during an active academic year.
 *
 * Accessibility: icon has aria-label composed from the lock reason so screen readers
 * announce the restriction even when the visual tooltip is unavailable.
 */
export function FieldLockTooltip({
  reason = DEFAULT_REASON,
  side = 'top',
  size = 14,
  className,
}: FieldLockTooltipProps) {
  return (
    <Tooltip content={reason} side={side} sideOffset={6}>
      <span
        role="img"
        aria-label={`Locked: ${reason}`}
        className={cn(
          'inline-flex items-center justify-center text-[rgb(var(--text-tertiary))]',
          className,
        )}
        tabIndex={0}
      >
        <Lock width={size} height={size} aria-hidden />
      </span>
    </Tooltip>
  )
}
