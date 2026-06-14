/**
 * EnrollmentTab Component
 *
 * Displays enrollment history in a clean table/list format.
 * Current enrollment highlighted, historical entries below.
 */

import {
  GraduationCap,
  Calendar,
  Clock,
  Building2,
  CheckCircle2,
  Plus,
  BookOpen,
} from 'lucide-react'
import { Button, DateDisplay } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import type { StudentProfileResponseDto } from '@aibrains/shared-types'

// ============================================================================
// TYPES
// ============================================================================

export interface EnrollmentTabProps {
  student: StudentProfileResponseDto
  onEnroll?: () => void
  onAddToSection?: () => void
}

type CurrentEnrollment = NonNullable<StudentProfileResponseDto['currentEnrollment']>
type EnrollmentHistory = NonNullable<StudentProfileResponseDto['enrollmentHistory']>[number]

// ============================================================================
// HELPERS
// ============================================================================

const statusStyles: Record<string, { bg: string; text: string }> = {
  active: { bg: 'bg-[rgb(var(--state-success-bg)/0.18)]', text: 'text-[rgb(var(--state-success-fg))]' },
  enrolled: { bg: 'bg-[rgb(var(--state-success-bg)/0.18)]', text: 'text-[rgb(var(--state-success-fg))]' },
  pending: { bg: 'bg-[rgb(var(--state-warning-fg))]/10', text: 'text-[rgb(var(--state-warning-fg))]' },
  withdrawn: { bg: 'bg-[rgb(var(--state-danger-bg)/0.18)]', text: 'text-[rgb(var(--state-danger-fg))]' },
  transferred: { bg: 'bg-[rgb(var(--state-warning-fg))]/10', text: 'text-[rgb(var(--state-warning-fg))]' },
  graduated: { bg: 'bg-[rgb(var(--state-info-bg)/0.18)]', text: 'text-[rgb(var(--state-info-fg))]' },
  completed: { bg: 'bg-[rgb(var(--background-tertiary)/0.1)]', text: 'text-[rgb(var(--text-secondary))] dark:text-[rgb(var(--text-tertiary))]' },
}

function getStatusStyle(status: string) {
  return statusStyles[status.toLowerCase()] || statusStyles.completed
}


// ============================================================================
// CURRENT ENROLLMENT
// ============================================================================

function CurrentEnrollmentSection({ enrollment }: { enrollment: CurrentEnrollment }) {
  const { t } = useTranslation('academics')

  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
        <CheckCircle2 className="w-4 h-4 text-[rgb(var(--state-success-fg))]" />
        {t('sections.currentEnrollment')}
      </h3>
      <div className="p-5 rounded-xl bg-[rgb(var(--state-success-fg)/0.05)] border border-[rgb(var(--state-success-border))]/15">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div>
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">{t('fields.gradeLevel')}</p>
            <p className="text-lg font-semibold text-text-primary">{t('gradeLabel', { level: enrollment.gradeLevel })}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">{t('tableHeaders.academicYear')}</p>
            <p className="text-sm text-text-primary flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-text-tertiary" />
              {enrollment.academicYearName || '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">{t('tableHeaders.entryDate')}</p>
            <p className="text-sm text-text-primary flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-text-tertiary" />
              <DateDisplay date={enrollment.enrollmentDate} format="long" />
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">{t('fields.homeroom')}</p>
            <p className="text-sm text-text-primary flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-text-tertiary" />
              {enrollment.homeroomName || '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ENROLLMENT HISTORY TABLE
// ============================================================================

function EnrollmentHistoryTable({ history }: { history: EnrollmentHistory[] }) {
  const { t } = useTranslation('academics')

  if (history.length === 0) return null

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-text-tertiary" />
        {t('sections.enrollmentHistory')}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-secondary">
              <th className="text-left py-2.5 px-3 text-xs font-medium text-text-tertiary uppercase tracking-wide">{t('tableHeaders.grade')}</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-text-tertiary uppercase tracking-wide">{t('tableHeaders.school')}</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-text-tertiary uppercase tracking-wide">{t('tableHeaders.academicYear')}</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-text-tertiary uppercase tracking-wide">{t('tableHeaders.entryDate')}</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-text-tertiary uppercase tracking-wide">{t('tableHeaders.exitDate')}</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-text-tertiary uppercase tracking-wide">{t('tableHeaders.status')}</th>
            </tr>
          </thead>
          <tbody>
            {history.map((enrollment) => {
              const style = getStatusStyle(enrollment.status)
              return (
                <tr
                  key={enrollment.enrollmentId}
                  className="border-b border-border-tertiary last:border-0 hover:bg-surface-secondary/50 transition-colors"
                >
                  <td className="py-3 px-3 font-medium text-text-primary">
                    {t('gradeLabel', { level: enrollment.gradeLevel })}
                  </td>
                  <td className="py-3 px-3 text-text-secondary">
                    {enrollment.schoolName || '—'}
                  </td>
                  <td className="py-3 px-3 text-text-secondary">
                    {enrollment.academicYearName || '—'}
                  </td>
                  <td className="py-3 px-3 text-text-secondary">
                    <DateDisplay date={enrollment.enrollmentDate} format="short" />
                  </td>
                  <td className="py-3 px-3 text-text-secondary">
                    {enrollment.withdrawalDate
                      ? <DateDisplay date={enrollment.withdrawalDate} format="short" />
                      : '—'}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${style.bg} ${style.text}`}>
                      {t(`status.${enrollment.status.toLowerCase()}`, { defaultValue: enrollment.status })}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EnrollmentTab({ student, onEnroll, onAddToSection }: EnrollmentTabProps) {
  const { t } = useTranslation('academics')
  const currentEnrollment = student.currentEnrollment
  const enrollmentHistory = (student.enrollmentHistory || [])
    .filter((e) => e.enrollmentId !== currentEnrollment?.enrollmentId)
    .sort((a, b) => new Date(b.enrollmentDate).getTime() - new Date(a.enrollmentDate).getTime())

  const hasNoData = !currentEnrollment && enrollmentHistory.length === 0

  if (hasNoData) {
    return (
      <div className="text-center py-16">
        <GraduationCap className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
        <p className="text-text-secondary font-medium">{t('empty.noEnrollment')}</p>
        <p className="text-sm text-text-tertiary mt-1">
          {t('empty.enrollmentWillAppear')}
        </p>
        {onEnroll && (
          <Button variant="outline" size="sm" onClick={onEnroll} className="mt-4">
            <Plus className="w-4 h-4 mr-1.5" />
            {t('actions.schoolEnrollment')}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Action bar */}
      <div className="flex items-center justify-end gap-2 mb-4">
        {onEnroll && (
          <Button variant="outline" size="sm" onClick={onEnroll}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            {t('actions.newSchoolEnrollment')}
          </Button>
        )}
      </div>

      {currentEnrollment && (
        <>
          <CurrentEnrollmentSection enrollment={currentEnrollment} />
          {/* Success-state CTA: next step is adding to sections */}
          {onAddToSection && (
            <div className="mb-6 p-4 rounded-lg bg-[rgb(var(--state-info-fg)/0.05)] border border-[rgb(var(--border-focus))]/15 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[rgb(var(--action-secondary-fg))]">
                  {t('enrollment.studentIsEnrolled')}
                </p>
                <p className="text-xs text-text-tertiary mt-0.5">
                  {t('enrollment.nextStepAddSection')}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={onAddToSection}>
                <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                {t('actions.addToSection')}
              </Button>
            </div>
          )}
        </>
      )}
      {!currentEnrollment && (
        <div className="mb-6 p-4 rounded-lg bg-[rgb(var(--state-warning-fg))]/5 border border-amber-500/15 flex items-center justify-between">
          <p className="text-sm text-[rgb(var(--state-warning-fg))]">
            {t('enrollment.noActiveEnrollment')}
          </p>
          {onEnroll && (
            <Button variant="outline" size="sm" onClick={onEnroll}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              {t('actions.enrollAtSchool')}
            </Button>
          )}
        </div>
      )}
      <EnrollmentHistoryTable history={enrollmentHistory} />
    </div>
  )
}

// ============================================================================
// SKELETON
// ============================================================================

export function EnrollmentTabSkeleton() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-4 h-4 rounded bg-surface-tertiary animate-pulse" />
        <div className="h-4 w-32 bg-surface-tertiary rounded animate-pulse" />
      </div>
      <div className="h-28 w-full bg-surface-tertiary rounded-xl animate-pulse mb-8" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 w-full bg-surface-tertiary rounded animate-pulse" />
        ))}
      </div>
    </div>
  )
}
