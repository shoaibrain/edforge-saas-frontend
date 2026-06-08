import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../utils'

export interface ContentSectionProps extends HTMLAttributes<HTMLElement> {
  /** Monospace uppercase eyebrow label above the heading */
  eyebrow?: string
  /** Section heading text */
  heading?: string
  /** Heading HTML element level */
  headingAs?: 'h2' | 'h3' | 'h4'
  /** Use larger display heading size (for hero-level sections) */
  displayHeading?: boolean
  /** Apply italic to heading (for editorial emphasis, e.g., "Blessed's *Progress*") */
  headingItalic?: boolean
  /** Optional subheading below the heading */
  subheading?: ReactNode
  /** Stagger animation index (0-based). Controls animation delay via --stagger-index. */
  staggerIndex?: number
}

export const ContentSection = forwardRef<HTMLElement, ContentSectionProps>(
  (
    {
      className,
      eyebrow,
      heading,
      headingAs: HeadingTag = 'h2',
      displayHeading = false,
      headingItalic = false,
      subheading,
      staggerIndex,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <section
        ref={ref}
        className={cn(
          'animate-fade-in',
          staggerIndex !== undefined && `stagger-${Math.min(staggerIndex + 1, 5)}`,
          className
        )}
        {...props}
      >
        {eyebrow && (
          <p className="text-xs font-mono uppercase tracking-[0.08em] text-[var(--v2-text-muted)] mb-1.5">
            {eyebrow}
          </p>
        )}
        {heading && (
          <HeadingTag
            className={cn(
              'font-display text-[var(--v2-text-primary)] mb-1 tracking-tight',
              displayHeading ? 'text-2xl font-medium' : 'text-xl font-medium',
              headingItalic && 'italic'
            )}
          >
            {heading}
          </HeadingTag>
        )}
        {subheading && (
          <p className="text-sm text-[var(--v2-text-secondary)] mb-4">
            {subheading}
          </p>
        )}
        {children}
      </section>
    )
  }
)

ContentSection.displayName = 'ContentSection'
