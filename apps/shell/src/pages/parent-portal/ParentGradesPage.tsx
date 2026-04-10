/**
 * Parent Portal — Child's Grades Page (v2)
 *
 * Same structure as Student Grades but scoped to activeChild from
 * ParentPortalContext. Header shows "{firstName}'s Progress".
 *
 * Inline apiGet migration: removes the inline
 * apiGet('/academics/students/${studentId}/grades') (previously line ~28).
 * Replaces with usePortalStudentGrades. Also removes inline StatCard,
 * StatusBadge, getLetterGradeClass sub-components.
 */

import { useState, useMemo } from 'react'
import { useTranslation } from '@edforge/i18n'
import { WidgetErrorBoundaryV2, CourseCard, type CourseCardCategory } from '@edforge/ui'
import { useAppStore } from '../../stores/app.store'
import { useShell } from '../../lib/shell-context'
import { useParentPortal } from './ParentPortalLayout'
import { usePortalStudentGrades } from '../../hooks/usePortalStudentGrades'
import { usePortalCurrentAcademicYear, usePortalGradingPeriods } from '../../hooks/usePortalCurrentAcademicYear'
import { usePortalGradingPolicy } from '../../hooks/usePortalGradingPolicy'
import { ContentSection } from '@edforge/ui'
import { NoActiveChild } from '../portal-shared/NoActiveChild'
import { TermSwitcher } from '../portal-shared/TermSwitcher'
import { GpaHeroSection } from '../portal-shared/GpaHeroSection'
import { SignalBanner, type SignalLevel } from '../portal-shared/SignalBanner'
import { GradedItemTimeline } from '../portal-shared/GradedItemTimeline'

// ============================================================================
// COMPONENT
// ============================================================================

export default function ParentGradesPage() {
  const { t } = useTranslation('portal')
  const { activeChild } = useParentPortal()
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const { activeSchoolYear } = useShell()

  const [activeTerm, setActiveTerm] = useState<string | null>(null)

  // Derive params with optional chaining — hooks below have `enabled` guards
  // that prevent API calls when these are empty strings.
  const studentId = activeChild?.studentId ?? ''
  const schoolId = activeSchoolId ?? activeChild?.schoolId ?? ''

  // Data hooks — ALL called before any conditional return (React hooks rules)
  // Each hook's enabled guard: usePortalCurrentAcademicYear → !!schoolId,
  // usePortalGradingPeriods → !!schoolId && !!yearId,
  // usePortalStudentGrades → !!studentId && !!schoolId,
  // usePortalGradingPolicy → !!schoolId
  const { data: yearData } = usePortalCurrentAcademicYear(schoolId)
  const yearId = activeSchoolYear?.id ?? yearData?.id ?? ''
  const { data: periods } = usePortalGradingPeriods(schoolId, yearId)
  const { data: gradesData, isLoading: gradesLoading } = usePortalStudentGrades(
    studentId,
    schoolId,
    { academicYearId: yearId, termId: activeTerm ?? undefined }
  )
  const { data: policies } = usePortalGradingPolicy(schoolId)

  // Signal level
  const signalLevel = useMemo((): SignalLevel | null => {
    if (!gradesData?.grades || gradesData.grades.length === 0) return null
    const hasF = gradesData.grades.some((g) => g.letterGrade?.startsWith('F'))
    const hasD = gradesData.grades.some((g) => g.letterGrade?.startsWith('D'))
    if (hasF) return 'concern'
    if (hasD) return 'attention'
    return 'good'
  }, [gradesData])

  // Category map
  const categoryMap = useMemo(() => {
    const defaultPolicy = policies?.find((p) => p.isDefault) ?? policies?.[0]
    if (!defaultPolicy?.categoryWeights) return null
    const map = new Map<string, { name: string; weight: number }>()
    for (const cw of defaultPolicy.categoryWeights) {
      map.set(cw.categoryId, { name: cw.categoryName, weight: cw.weight })
    }
    return map
  }, [policies])

  // Guard: show placeholder when no child is selected.
  // Placed AFTER all hooks to satisfy React's rules of hooks.
  if (!activeChild) return <NoActiveChild />

  return (
    <div className="p-6 space-y-6" data-v2>
      {/* Page header */}
      <ContentSection
        heading={t('pages.childGrades', { name: activeChild.firstName })}
        staggerIndex={0}
      >
        <div className="mt-3">
          <TermSwitcher
            periods={periods}
            activePeriodId={activeTerm}
            onChange={setActiveTerm}
          />
        </div>
      </ContentSection>

      <WidgetErrorBoundaryV2>
        <GpaHeroSection
          data={gradesData}
          loading={gradesLoading}
          staggerIndex={1}
        />
      </WidgetErrorBoundaryV2>

      <SignalBanner level={signalLevel} staggerIndex={2} />

      <WidgetErrorBoundaryV2>
        <CourseGridSection
          grades={gradesData?.grades}
          loading={gradesLoading}
          categoryMap={categoryMap}
        />
      </WidgetErrorBoundaryV2>

      <WidgetErrorBoundaryV2>
        <GradedItemTimeline
          grades={gradesData?.grades}
          loading={gradesLoading}
          staggerIndex={4}
        />
      </WidgetErrorBoundaryV2>
    </div>
  )
}

// ============================================================================
// COURSE GRID (identical to student version — shared component logic)
// ============================================================================

function CourseGridSection({
  grades,
  loading,
  categoryMap,
}: {
  grades?: Array<{
    gradeId: string
    courseName?: string
    courseId: string
    letterGrade?: string
    numericGrade?: number
    gpaPoints?: number
    isFinal: boolean
    teacherId: string
    categoryGrades?: Array<{
      categoryId: string
      categoryName: string
      weight: number
      percentage: number
    }>
  }>
  loading?: boolean
  categoryMap?: Map<string, { name: string; weight: number }> | null
}) {
  const { t } = useTranslation('portal')

  if (loading) {
    return (
      <ContentSection heading={t('grades.courseByourse')} staggerIndex={3}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-xl v2-skeleton-pulse"
              style={{ background: 'var(--v2-bg-elevated)' }}
            />
          ))}
        </div>
      </ContentSection>
    )
  }

  if (!grades || grades.length === 0) {
    return (
      <ContentSection heading={t('grades.courseByourse')} staggerIndex={3}>
        <p className="text-sm py-4" style={{ color: 'var(--v2-text-muted)' }}>
          {t('grades.noGradesYet')}
        </p>
      </ContentSection>
    )
  }

  return (
    <ContentSection heading={t('grades.courseByourse')} staggerIndex={3}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        {grades.map((grade) => {
          const categories: CourseCardCategory[] = (grade.categoryGrades ?? []).map((cg) => ({
            name: cg.categoryName,
            weight: categoryMap?.get(cg.categoryId)?.weight ?? cg.weight,
            percentage: cg.percentage,
          }))

          return (
            <CourseCard
              key={grade.gradeId}
              courseName={grade.courseName ?? ''}
              letterGrade={grade.letterGrade}
              numericGrade={grade.numericGrade}
              gpaPoints={grade.gpaPoints}
              isFinal={grade.isFinal}
              categories={categories.length > 0 ? categories : undefined}
            />
          )
        })}
      </div>
    </ContentSection>
  )
}
