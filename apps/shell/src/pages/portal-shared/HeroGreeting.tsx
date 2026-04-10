/**
 * HeroGreeting — Shared greeting section for portal home pages
 *
 * Parent: "Hi, {{parentName}}." with child context.
 * Student: "Hi, {{firstName}}." with personal context.
 */

import { useTranslation } from '@edforge/i18n'
import { ContentSection, Skeleton } from '@edforge/ui'

export interface HeroGreetingProps {
  /** Name to greet (parent's name or student's first name) */
  name: string
  /** Optional contextual one-liner derived from data */
  contextLine?: string
  /** Loading state */
  loading?: boolean
  /** Stagger animation index */
  staggerIndex?: number
}

export function HeroGreeting({
  name,
  contextLine,
  loading,
  staggerIndex = 0,
}: HeroGreetingProps) {
  const { t } = useTranslation('portal')

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-72" />
      </div>
    )
  }

  return (
    <ContentSection staggerIndex={staggerIndex}>
      <h1
        className="text-2xl font-semibold tracking-tight"
        style={{ color: 'var(--v2-text-primary)' }}
      >
        {t('home.greeting', { name })}
      </h1>
      {contextLine && (
        <p
          className="text-sm mt-1"
          style={{ color: 'var(--v2-text-secondary)' }}
        >
          {contextLine}
        </p>
      )}
    </ContentSection>
  )
}
