/**
 * GpaHeroSection — Split layout with GPA ring + narrative + mini stats
 *
 * Shared between Student Grades and Parent Grades.
 */

import { useTranslation } from '@edforge/i18n'
import { ContentSection, GpaRing, Skeleton } from '@edforge/ui'
import type { StudentGradesResponseDto } from '@aibrains/shared-types'

export interface GpaHeroSectionProps {
  data?: StudentGradesResponseDto | null
  loading?: boolean
  staggerIndex?: number
}

export function GpaHeroSection({ data, loading, staggerIndex = 1 }: GpaHeroSectionProps) {
  const { t } = useTranslation('portal')

  if (loading) {
    return (
      <ContentSection staggerIndex={staggerIndex}>
        <div className="flex gap-6 items-center">
          <Skeleton className="w-[120px] h-[120px] rounded-full shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-4 w-48" />
            <div className="flex gap-4 mt-3">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
        </div>
      </ContentSection>
    )
  }

  const gpa = data?.gpa
  const grades = data?.grades ?? []
  const courseCount = grades.length
  const gradedCount = grades.filter((g) => g.letterGrade != null).length
  const totalCredits = gpa?.totalCredits ?? 0

  // Build narrative
  let narrative: string
  if (courseCount === 0) {
    narrative = t('grades.noGradesYet')
  } else if (gradedCount === 0) {
    narrative = `${courseCount} course${courseCount > 1 ? 's' : ''} underway. Awaiting first grades.`
  } else {
    narrative = `${courseCount} course${courseCount > 1 ? 's' : ''} underway. ${gradedCount} graded so far.`
  }

  return (
    <ContentSection staggerIndex={staggerIndex}>
      <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        {/* GPA Ring */}
        <GpaRing
          value={gpa?.cumulativeGpa}
          max={4}
          size="lg"
        />

        {/* Narrative + stats */}
        <div className="flex-1 text-center sm:text-left">
          <p
            className="text-sm leading-relaxed mb-4"
            style={{ color: 'var(--v2-text-secondary)' }}
          >
            {narrative}
          </p>

          <div className="flex gap-6 justify-center sm:justify-start">
            <MiniStat label={t('grades.credits')} value={totalCredits.toString()} />
            <MiniStat label={t('grades.courses')} value={courseCount.toString()} />
            <MiniStat label={t('grades.gradedItems')} value={gradedCount.toString()} />
          </div>
        </div>
      </div>
    </ContentSection>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        className="text-lg font-semibold tabular-nums"
        style={{ color: 'var(--v2-text-primary)' }}
      >
        {value}
      </p>
      <p
        className="text-[10px] uppercase tracking-[0.04em]"
        style={{ color: 'var(--v2-text-muted)' }}
      >
        {label}
      </p>
    </div>
  )
}
