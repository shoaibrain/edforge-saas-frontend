import { Lock } from 'lucide-react'
import { Tooltip } from './Tooltip'
import { cn } from '../utils'

export interface FieldLockIconProps {
  /** Lock reason shown in the tooltip. */
  reason: string
  /** Optional detail shown under the reason (e.g. which school+year). */
  detail?: string
  /** Tooltip placement. */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** Icon size in px. Defaults to 13 — sized for inline use next to inputs. */
  size?: number
  /** Extra classes applied to the wrapper. */
  className?: string
}

/**
 * FieldLockIcon — compact lock icon with tooltip, designed to sit inline
 * with a disabled form input. Reuses `Tooltip` for consistent behavior.
 *
 * Distinct from `FieldLockTooltip` (Sprint A) in that A's variant is
 * sized for adjacent labels + uses the generic immutable message, whereas
 * B's variant takes an explicit reason so per-field lock states can speak
 * for themselves ("Locked: Academic year '2083-84' is active at Milos').
 */
export function FieldLockIcon({
  reason,
  detail,
  side = 'top',
  size = 13,
  className,
}: FieldLockIconProps) {
  const tooltip = detail ? `${reason} — ${detail}` : reason
  return (
    <Tooltip content={tooltip} side={side} sideOffset={6}>
      <span
        role="img"
        aria-label={`Locked: ${tooltip}`}
        className={cn(
          'inline-flex items-center justify-center text-amber-600 dark:text-amber-400',
          className,
        )}
        tabIndex={0}
      >
        <Lock width={size} height={size} aria-hidden />
      </span>
    </Tooltip>
  )
}
