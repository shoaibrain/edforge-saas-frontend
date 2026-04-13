/**
 * Student Portal — My Grades Page (v2)
 *
 * Rewritten securely using prototype DOM scoping (.fp-) to avoid
 * conflicting with generic layouts.
 */

import { useState, useMemo } from 'react'
import { useTranslation } from '@edforge/i18n'
import { WidgetErrorBoundaryV2 } from '@edforge/ui'
import { useAppStore } from '../../stores/app.store'
import { useShell } from '../../lib/shell-context'
import { useStudentPortal } from './StudentPortalLayout'
import { usePortalStudentGrades } from '../../hooks/usePortalStudentGrades'
import { usePortalCurrentAcademicYear, usePortalGradingPeriods } from '../../hooks/usePortalCurrentAcademicYear'
import { usePortalGradingPolicy } from '../../hooks/usePortalGradingPolicy'
import { TermSwitcher } from '../portal-shared/TermSwitcher'
import { GpaHeroSection } from '../portal-shared/GpaHeroSection'
import { SignalBanner, type SignalLevel } from '../portal-shared/SignalBanner'
import { GradedItemTimeline } from '../portal-shared/GradedItemTimeline'
import { PortalCourseCard, type PortalCourseCardCategory } from '../portal-shared/PortalCourseCard'

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

  const signalLevel = useMemo((): SignalLevel | null => {
    if (!gradesData?.grades || gradesData.grades.length === 0) return null
    const hasF = gradesData.grades.some((g) => g.letterGrade?.startsWith('F'))
    const hasD = gradesData.grades.some((g) => g.letterGrade?.startsWith('D'))
    if (hasF) return 'concern'
    if (hasD) return 'attention'
    return 'good'
  }, [gradesData])

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
    <div className="fp-content">
      {/* Page header */}
      <div className="fp-page-head">
        <div>
          <div className="fp-page-eyebrow">Progress report</div>
          <h1 className="fp-page-title">
            Your <em>progress.</em>
          </h1>
          <p className="fp-page-sub">
            A running view of how you're doing this term. We'll fill this in as teachers post grades — nothing is cast in stone until the report card.
          </p>
        </div>
        <TermSwitcher
          periods={periods}
          activePeriodId={activeTerm}
          onChange={setActiveTerm}
        />
      </div>

      <WidgetErrorBoundaryV2>
        <GpaHeroSection
          data={gradesData}
          loading={gradesLoading}
          childName={studentProfile.firstName}
        />
      </WidgetErrorBoundaryV2>

      <SignalBanner level={signalLevel} />

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
      <section className="fp-section">
        <div className="fp-section-head">
          <h2 className="fp-section-title">Course by course</h2>
        </div>
        <div className="fp-course-grid">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="fp-course v2-skeleton-pulse"
              style={{ background: 'var(--fp-paper-2)', minHeight: '200px' }}
            />
          ))}
        </div>
      </section>
    )
  }

  if (!grades || grades.length === 0) {
    return (
      <section className="fp-section">
        <div className="fp-section-head">
          <h2 className="fp-section-title">Course by course</h2>
        </div>
        <p style={{ color: 'var(--fp-ink-3)' }}>
          {t('grades.noGradesYet')}
        </p>
      </section>
    )
  }

  return (
    <section className="fp-section">
      <div className="fp-section-head">
        <h2 className="fp-section-title">Course by course</h2>
        <a className="fp-section-link" href="#">See schedule →</a>
      </div>
      <div className="fp-course-grid">
        {grades.map((grade, idx) => {
          const categories: PortalCourseCardCategory[] = (grade.categoryGrades ?? []).map((cg) => {
            const policyWeight = categoryMap?.get(cg.categoryId)?.weight
            return {
              name: cg.categoryName,
              weight: policyWeight ?? cg.weight,
              percentage: cg.percentage,
            }
          })

          const tColor = idx % 2 === 0 ? 'ind' : 'ter';

          let missedWorkMessage = undefined;
          if (grade.letterGrade?.startsWith('F')) {
             missedWorkMessage = { title: "Early notification", body: `The ${grade.letterGrade} reflects missing coursework so far.` }
          }

          return (
            <PortalCourseCard
              key={grade.gradeId}
              courseName={grade.courseName ?? ''}
              courseCode={`CODE ${idx+1}`}
              letterGrade={grade.letterGrade}
              numericGrade={grade.numericGrade}
              teacherName="Course Teacher"
              teacherColor={tColor}
              categories={categories.length > 0 ? categories : undefined}
              missedWorkMessage={missedWorkMessage}
            />
          )
        })}
      </div>
    </section>
  )
}
