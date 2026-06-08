import {
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
} from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn, focusRing } from '../utils'

/**
 * Tag — compact pill used for eyebrows, section tags, status markers.
 *
 * Variants map to landing design tokens (`--lp-*`). When rendered outside
 * the landing surface, falls back to the shared teal/golden brand hues so
 * authed apps can still use it.
 */
const tagVariants = cva(
  'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide',
  {
    variants: {
      variant: {
        primary:
          'bg-[color:var(--lp-primary-soft,#FBE3E5)] text-[color:var(--lp-primary-ink,#7A1C26)]',
        teal:
          'bg-[color:var(--lp-teal-soft,#A8DADC)] text-[color:var(--lp-teal-ink,#1D3557)]',
        green:
          'bg-[color:var(--lp-green-soft,#DCE9E2)] text-[color:var(--lp-green-ink,#1D3557)]',
        blue:
          'bg-[color:var(--lp-blue-soft,#CDDDE8)] text-[color:var(--lp-blue-ink,#1D3557)]',
        ink:
          'bg-[rgba(29,53,87,0.08)] text-[color:var(--lp-ink-2,#2A4169)]',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  }
)

export interface TagProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof tagVariants> {
  /** Render a leading status dot. */
  dot?: boolean
}

export const Tag = forwardRef<HTMLSpanElement, TagProps>(
  ({ className, variant, dot = false, children, onClick, onKeyDown, tabIndex, role, ...props }, ref) => {
    const isInteractive = typeof onClick === 'function' || role === 'button'

    const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
      onKeyDown?.(event)
      if (event.defaultPrevented || !isInteractive) return
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        event.currentTarget.click()
      }
    }

    return (
      <span
        ref={ref}
        className={cn(tagVariants({ variant }), isInteractive && focusRing, className)}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        role={role}
        tabIndex={isInteractive ? (tabIndex ?? 0) : tabIndex}
        {...props}
      >
        {dot ? (
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full bg-current"
          />
        ) : null}
        {children}
      </span>
    )
  }
)
Tag.displayName = 'Tag'

export { tagVariants }
