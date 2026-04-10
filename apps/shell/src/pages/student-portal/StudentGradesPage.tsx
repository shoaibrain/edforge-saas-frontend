/**
 * Student Portal — My Grades Page (v2)
 *
 * Redesigned content pane: term switcher → GPA hero → signal banner →
 * course grid → graded items timeline.
 *
 * Inline apiGet migration: removes the inline apiGet('/academics/students/${studentId}/grades')
 * (previously line ~26). Replaces with usePortalStudentGrades. Also removes inline StatCard,
 * StatusBadge, EmptyState, getLetterGradeClass sub-components — all replaced by @edforge/ui
 * and portal-shared primitives.
 */

import { useState, useMemo } from 'react'
import { useTranslation } from '@edforge/i18n'
import { WidgetErrorBoundaryV2, CourseCard, type CourseCardCategory } from '@edforge/ui'
import { useAppStore } from '../../stores/app.store'
import { useShell } from '../../lib/shell-context'
import { useStudentPortal } from './StudentPortalLayout'
import { usePortalStudentGrades } from '../../hooks/usePortalStudentGrades'
import { usePortalCurrentAcademicYear, usePortalGradingPeriods } from '../../hooks/usePortalCurrentAcademicYear'
import { usePortalGradingPolicy } from '../../hooks/usePortalGradingPolicy'
import { ContentSection } from '@edforge/ui'
import { TermSwitcher } from '../portal-shared/TermSwitcher'
import { GpaHeroSection } from '../portal-shared/GpaHeroSection'
import { SignalBanner, type SignalLevel } from '../portal-shared/SignalBanner'
import { GradedItemTimeline } from '../portal-shared/GradedItemTimeline'

// ============================================================================
// COMPONENT
// ============================================================================

export default function StudentGradesPage() {
  const { t } = useTranslation('portal')
  const { studentId, studentProfile } = useStudentPortal()
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const { activeSchoolYear } = useShell()
  const schoolId = activeSchoolId ?? studentProfile.schoolId

  const [activeTerm, setActiveTerm] = useState<string | null>(null)

  // Data hooks
  const { data: yearData } = usePortalCurrentAcademicYear(schoolId)
  const yearId = activeSchoolYear?.id ?? yearData?.id ?? ''
  const { data: periods } = usePortalGradingPeriods(schoolId, yearId)
  const { data: gradesData, isLoading: gradesLoading } = usePortalStudentGrades(
    studentId,
    schoolId,
    { academicYearId: yearId, termId: activeTerm ?? undefined }
  )
  const { data: policies } = usePortalGradingPolicy(schoolId)

  // Derive signal level from grades
  const signalLevel = useMemo((): SignalLevel | null => {
    if (!gradesData?.grades || gradesData.grades.length === 0) return null
    const hasF = gradesData.grades.some((g) => g.letterGrade?.startsWith('F'))
    const hasD = gradesData.grades.some((g) => g.letterGrade?.startsWith('D'))
    if (hasF) return 'concern'
    if (hasD) return 'attention'
    return 'good'
  }, [gradesData])

  // Build category map from grading policy
  const categoryMap = useMemo(() => {
    const defaultPolicy = policies?.find((p) => p.isDefault) ?? policies?.[0]
    if (!defaultPolicy?.categoryWeights) return null
    const map = new Map<string, { name: string; weight: number }>()
    for (const cw of defaultPolicy.categoryWeights) {
      map.set(cw.categoryId, { name: cw.categoryName, weight: cw.weight })
    }
    return map
  }, [policies])

  return (
    <div className="p-6 space-y-6" data-v2>
      {/* Page header + term switcher */}
      <ContentSection heading={t('pages.myGrades')} staggerIndex={0}>
        <div className="mt-3">
          <TermSwitcher
            periods={periods}
            activePeriodId={activeTerm}
            onChange={setActiveTerm}
          />
        </div>
      </ContentSection>

      {/* GPA Hero */}
      <WidgetErrorBoundaryV2>
        <GpaHeroSection
          data={gradesData}
          loading={gradesLoading}
          staggerIndex={1}
        />
      </WidgetErrorBoundaryV2>

      {/* Signal Banner */}
      <SignalBanner level={signalLevel} staggerIndex={2} />

      {/* Course Grid */}
      <WidgetErrorBoundaryV2>
        <CourseGridSection
          grades={gradesData?.grades}
          loading={gradesLoading}
          categoryMap={categoryMap}
        />
      </WidgetErrorBoundaryV2>

      {/* Graded Items Timeline */}
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
// COURSE GRID SECTION
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
          // Build category bars from either course data or policy
          const categories: CourseCardCategory[] = (grade.categoryGrades ?? []).map((cg) => {
            const policyWeight = categoryMap?.get(cg.categoryId)?.weight
            return {
              name: cg.categoryName,
              weight: policyWeight ?? cg.weight,
              percentage: cg.percentage,
            }
          })

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
