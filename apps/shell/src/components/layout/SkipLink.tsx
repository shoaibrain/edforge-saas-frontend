/**
 * Skip Link Component
 * 
 * Provides keyboard-accessible skip navigation for screen reader users.
 * Allows users to bypass repetitive navigation and jump directly to main content.
 * 
 * The link is visually hidden until focused, then appears at the top of the screen.
 */

import { cn } from '../../lib/utils'

interface SkipLinkProps {
  /** Target element ID to skip to (without #) */
  targetId?: string
  /** Link text for screen readers */
  children?: string
  className?: string
}

export function SkipLink({
  targetId = 'main-content',
  children = 'Skip to main content',
  className,
}: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        // Visually hidden by default
        'sr-only',
        // Show on focus
        'focus:not-sr-only',
        'focus:fixed focus:top-4 focus:left-4 focus:z-[100]',
        'focus:px-4 focus:py-2',
        'focus:bg-[rgb(var(--action-primary-bg))] dark:focus:bg-cyan-500',
        'focus:text-[rgb(var(--action-primary-fg))] focus:font-medium focus:text-sm',
        'focus:rounded-lg focus:shadow-lg',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500',
        'transition-all duration-200',
        className
      )}
    >
      {children}
    </a>
  )
}

