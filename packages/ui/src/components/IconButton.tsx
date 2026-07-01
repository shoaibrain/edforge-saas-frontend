import { forwardRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Button, type ButtonProps } from './Button'
import { AnimatedIcon } from './motion'
import type { IconName } from './motion'

export interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  /** The lucide glyph to render (also the generic-motion fallback). */
  icon: LucideIcon
  /**
   * Accessible name — required, because an icon-only button has no text.
   * Applied as both `aria-label` and `title`.
   */
  label: string
  /**
   * Optional bespoke signature (e.g. `edit`, `remove`, `more`, `refresh`).
   * When omitted the icon animates with the generic nudge (no glyph swap).
   */
  signature?: IconName
  /** Glyph size in px (default 18). */
  iconSize?: number
}

/**
 * IconButton — the central icon-only action button.
 *
 * Wraps `Button` (which already carries the `.ef-motion` hook), so the icon
 * animates on hover / `:focus-visible` with zero per-call-site wiring —
 * bespoke via `signature`, generic otherwise. Reserve accents for navigation:
 * action icons inherit the button's colour (`applyAccent={false}`).
 *
 * Use this instead of a hand-rolled `<button><LucideIcon/></button>` so action
 * icons animate consistently and coverage can't silently regress.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { icon, label, signature, iconSize = 18, size = 'icon', variant = 'ghost', ...props },
    ref,
  ) {
    return (
      <Button ref={ref} size={size} variant={variant} aria-label={label} title={label} {...props}>
        <AnimatedIcon name={signature} icon={icon} size={iconSize} applyAccent={false} />
      </Button>
    )
  },
)

IconButton.displayName = 'IconButton'
