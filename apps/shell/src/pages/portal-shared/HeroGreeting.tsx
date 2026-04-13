/**
 * HeroGreeting — Editorial hero greeting matching the prototype.
 *
 * Layout:
 *   - Eyebrow: "GOOD EVENING" (monospace, plum, with dot indicator)
 *   - Headline: "Hi, Shoaib." in large Fraunces light weight
 *   - Subtext: contextual narrative ("Blessed had a quiet week.")
 *
 * The eyebrow uses time-of-day awareness. The headline scales fluidly.
 */

import { ContentSection, Skeleton } from '@edforge/ui'

export interface HeroGreetingProps {
  /** Name to greet */
  name: string
  /** Optional eyebrow label above headline (e.g., "GOOD EVENING") */
  eyebrow?: string
  /** Optional contextual narrative below headline */
  contextLine?: string
  /** Optional second narrative line, can include italic emphasis */
  contextLineEmphasis?: string
  /** Loading state */
  loading?: boolean
  /** Stagger animation index */
  staggerIndex?: number
}

export function HeroGreeting({
  name,
  eyebrow,
  contextLine,
  contextLineEmphasis,
  loading,
  staggerIndex = 0,
}: HeroGreetingProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-5 w-96" />
      </div>
    )
  }

  return (
    <ContentSection staggerIndex={staggerIndex}>
      {/* Eyebrow with dot indicator — matches prototype's editorial signature */}
      {eyebrow && (
        <div
          className="inline-flex items-center font-mono uppercase mb-4"
          style={{
            fontSize: 11,
            letterSpacing: '0.14em',
            color: 'var(--v2-accent-purple, #6B3A6B)',
            gap: 8,
          }}
        >
          <span
            className="inline-block rounded-full"
            style={{
              width: 7,
              height: 7,
              background: 'var(--v2-accent-purple, #6B3A6B)',
            }}
          />
          {eyebrow}
        </div>
      )}

      {/* Headline — large Fraunces light weight, fluid sizing */}
      <h1
        className="font-display-hero font-light tracking-tight"
        style={{
          color: 'var(--v2-text-primary)',
          fontSize: 'clamp(38px, 5vw, 56px)',
          lineHeight: 0.98,
          letterSpacing: '-0.035em',
          margin: 0,
        }}
      >
        {`Hi, ${name}.`}
      </h1>

      {/* Optional emphasis line — italic Fraunces (e.g., "Blessed had a quiet week.") */}
      {contextLineEmphasis && (
        <p
          className="font-display italic font-light tracking-tight"
          style={{
            color: 'var(--v2-text-secondary)',
            fontSize: 'clamp(20px, 2.4vw, 28px)',
            lineHeight: 1.2,
            marginTop: 8,
            maxWidth: '32ch',
          }}
        >
          {contextLineEmphasis}
        </p>
      )}

      {/* Body narrative — sans body font, medium muted */}
      {contextLine && (
        <p
          style={{
            color: 'var(--v2-text-muted)',
            fontSize: 15,
            lineHeight: 1.55,
            marginTop: 14,
            maxWidth: '56ch',
          }}
        >
          {contextLine}
        </p>
      )}
    </ContentSection>
  )
}
