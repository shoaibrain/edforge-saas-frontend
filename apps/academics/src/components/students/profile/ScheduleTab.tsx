/**
 * @deprecated This component has been superseded by the OverviewTab academic dashboard.
 * Schedule and attendance data are now displayed in the Overview tab.
 * Kept for backward compatibility — do not use in new code.
 *
 * ScheduleTab Component
 *
 * Combines class schedule and attendance summary into one tab.
 * Clean table layout for classes, attendance stats at the top.
 * Sprint 8: Added "Add to Section" button and "Remove from Section" action.
 */

import { useState } from 'react'
import {
  BookOpen,
  Calendar,
  User,
  TrendingDown,
  TrendingUp,
  GraduationCap,
  ExternalLink,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@edforge/ui'
import type { StudentProfileResponseDto } from '@aibrains/shared-types'
import { useStudentAttendanceSummary } from '../../../hooks/useAttendance'
import { useRemoveStudent } from '../../../hooks'
import { useActiveSchoolId } from '../../../stores/app.store'
import { useAcademicsI18n } from '../../../lib/i18n'

// ============================================================================
// TYPES
// ============================================================================

export interface ScheduleTabProps {
  student: StudentProfileResponseDto
  onAddToSection?: () => void
}

type AttendanceSummary = NonNullable<StudentProfileResponseDto['attendanceSummary']>
type Classroom = NonNullable<StudentProfileResponseDto['classrooms']>[number]

// ============================================================================
// ATTENDANCE HELPERS
// ============================================================================

function getRateColor(rate: number) {
  if (rate >= 95) return { text: 'text-[rgb(var(--state-success-fg))]', labelKey: 'performance.excellent' }
  if (rate >= 90) return { text: 'text-[rgb(var(--state-warning-fg))]', labelKey: 'performance.good' }
  if (rate >= 85) return { text: 'text-[rgb(var(--state-warning-fg))]', labelKey: 'performance.atRisk' }
  return { text: 'text-[rgb(var(--state-danger-fg))]', labelKey: 'performance.critical' }
}

// ============================================================================
// ATTENDANCE SECTION
// ============================================================================

function AttendanceSection({ summary }: { summary: AttendanceSummary }) {
  const { t, formatNumber } = useAcademicsI18n()
  const rateColor = getRateColor(summary.attendanceRate)

  return (
    <section className="mb-8">
      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-amber-500" />
        {t('studentProfile.schedule.attendanceSummary')}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Rate */}
        <div className="sm:col-span-1 p-4 rounded-xl bg-surface-secondary border border-border-secondary">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">{t('studentProfile.schedule.rate')}</p>
          <p className={`text-2xl font-bold ${rateColor.text}`}>
            {formatNumber(Number(summary.attendanceRate.toFixed(1)))}%
          </p>
          <p className={`text-xs ${rateColor.text}`}>{t(rateColor.labelKey)}</p>
        </div>
        {/* Stats */}
        <StatCard label={t('studentProfile.schedule.totalDays')} value={summary.totalDays} />
        <StatCard label={t('attendance.status.present.label')} value={summary.present} color="text-[rgb(var(--state-success-fg))]" />
        <StatCard label={t('attendance.status.absent.label')} value={summary.absent} color="text-[rgb(var(--state-danger-fg))]" />
        <StatCard label={t('attendance.status.late.label')} value={summary.late} color="text-[rgb(var(--state-warning-fg))]" />
        <StatCard label={t('attendance.status.excused.label')} value={summary.excused} color="text-[rgb(var(--state-info-fg))]" />
      </div>

      {/* Alerts */}
      {summary.attendanceRate < 90 && (
        <div className="mt-4 p-3 rounded-lg bg-[rgb(var(--state-warning-fg))]/5 border border-amber-500/15">
          <p className="text-sm text-[rgb(var(--state-warning-fg))] flex items-center gap-2">
            <TrendingDown className="w-4 h-4 flex-shrink-0" />
            {t('alerts.lowAttendance')}
          </p>
        </div>
      )}
      {summary.attendanceRate >= 98 && (
        <div className="mt-4 p-3 rounded-lg bg-[rgb(var(--state-success-fg)/0.05)] border border-[rgb(var(--state-success-border))]/15">
          <p className="text-sm text-[rgb(var(--state-success-fg))] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 flex-shrink-0" />
            {t('alerts.highAttendance')}
          </p>
        </div>
      )}
    </section>
  )
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color?: string
}) {
  const { formatNumber } = useAcademicsI18n()

  return (
    <div className="p-4 rounded-xl bg-surface-secondary border border-border-secondary">
      <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color || 'text-text-primary'}`}>{formatNumber(value)}</p>
    </div>
  )
}

// ============================================================================
// SUBJECT COLORS
// ============================================================================

function getSubjectColor(subject?: string): { bg: string; text: string } {
  if (!subject) return { bg: 'bg-[rgb(var(--background-tertiary)/0.1)]', text: 'text-[rgb(var(--text-secondary))] dark:text-[rgb(var(--text-tertiary))]' }
  const s = subject.toLowerCase()
  if (s.includes('math') || s.includes('algebra') || s.includes('calculus'))
    return { bg: 'bg-[rgb(var(--state-info-bg)/0.18)]', text: 'text-[rgb(var(--state-info-fg))]' }
  if (s.includes('english') || s.includes('language') || s.includes('literature'))
    return { bg: 'bg-[rgb(var(--state-info-bg)/0.18)]', text: 'text-[rgb(var(--state-info-fg))]' }
  if (s.includes('science') || s.includes('biology') || s.includes('chemistry') || s.includes('physics'))
    return { bg: 'bg-[rgb(var(--state-success-bg)/0.18)]', text: 'text-[rgb(var(--state-success-fg))]' }
  if (s.includes('history') || s.includes('social') || s.includes('geography'))
    return { bg: 'bg-[rgb(var(--state-warning-fg))]/10', text: 'text-[rgb(var(--state-warning-fg))]' }
  if (s.includes('art') || s.includes('music') || s.includes('drama'))
    return { bg: 'bg-[rgb(var(--state-danger-bg)/0.18)]', text: 'text-[rgb(var(--state-danger-fg))] ' }
  if (s.includes('physical') || s.includes('pe') || s.includes('health'))
    return { bg: 'bg-[rgb(var(--state-warning-fg))]/10', text: 'text-[rgb(var(--state-warning-fg))]' }
  if (s.includes('computer') || s.includes('tech') || s.includes('programming'))
    return { bg: 'bg-[rgb(var(--state-info-fg))]/10', text: 'text-[rgb(var(--state-info-fg))] ' }
  return { bg: 'bg-[rgb(var(--background-tertiary)/0.1)]', text: 'text-[rgb(var(--text-secondary))] dark:text-[rgb(var(--text-tertiary))]' }
}

// ============================================================================
// SCHEDULE TABLE
// ============================================================================

function ScheduleTable({
  classrooms,
  student,
  studentId,
}: {
  classrooms: Classroom[]
  student: StudentProfileResponseDto
  studentId: string
}) {
  const { t, formatNumber } = useAcademicsI18n()
  const schoolId = useActiveSchoolId() || ''
  const removeStudentMutation = useRemoveStudent()
  const [removingId, setRemovingId] = useState<string | null>(null)

  const handleRemove = async (classroom: Classroom) => {
    const confirmed = window.confirm(
      t('studentProfile.schedule.removeConfirm', {
        student: student.fullName,
        section: classroom.name,
      })
    )
    if (!confirmed) return

    setRemovingId(classroom.classroomId)
    try {
      await removeStudentMutation.mutateAsync({
        sectionId: classroom.classroomId,
        schoolId,
        studentId,
      })
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[rgb(var(--state-info-fg))]" />
          {t('sections.currentClasses')}
          <span className="text-xs text-text-tertiary font-normal ms-1">
            ({formatNumber(classrooms.length)})
          </span>
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-secondary">
              <th className="text-start py-2.5 px-3 text-xs font-medium text-text-tertiary uppercase tracking-wide w-8">#</th>
              <th className="text-start py-2.5 px-3 text-xs font-medium text-text-tertiary uppercase tracking-wide">{t('studentProfile.schedule.class')}</th>
              <th className="text-start py-2.5 px-3 text-xs font-medium text-text-tertiary uppercase tracking-wide">{t('studentProfile.schedule.subject')}</th>
              <th className="text-start py-2.5 px-3 text-xs font-medium text-text-tertiary uppercase tracking-wide">{t('common.teacher')}</th>
              <th className="text-end py-2.5 px-3 text-xs font-medium text-text-tertiary uppercase tracking-wide w-16"></th>
            </tr>
          </thead>
          <tbody>
            {classrooms.map((classroom, index) => {
              const subjectColor = getSubjectColor(classroom.subject)
              const isRemoving = removingId === classroom.classroomId
              return (
                <tr
                  key={classroom.classroomId}
                  className="border-b border-border-tertiary last:border-0 hover:bg-surface-secondary/50 transition-colors"
                >
                  <td className="py-3 px-3">
                    <div className={`w-7 h-7 rounded-lg ${subjectColor.bg} flex items-center justify-center`}>
                      <span className={`text-xs font-semibold ${subjectColor.text}`}>
                        {index + 1}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-medium text-text-primary">
                    {classroom.name}
                  </td>
                  <td className="py-3 px-3 text-text-secondary">
                    {classroom.subject || '—'}
                  </td>
                  <td className="py-3 px-3 text-text-secondary">
                    {classroom.teacherName ? (
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-text-tertiary" />
                        {classroom.teacherName}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 px-3 text-end">
                    <button
                      type="button"
                      onClick={() => handleRemove(classroom)}
                      disabled={isRemoving}
                      className="p-1.5 text-text-tertiary hover:text-[rgb(var(--state-danger-fg))] hover:bg-[rgb(var(--state-danger-bg)/0.18)] rounded-lg transition-colors disabled:opacity-50"
                      title={t('studentProfile.schedule.removeFromSection')}
                    >
                      {isRemoving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Academic summary */}
      {student.academicSummary && (
        <div className="mt-6 flex items-center gap-6 pt-4 border-t border-border-secondary">
          {student.academicSummary.gpa !== undefined && (
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-text-tertiary" />
              <span className="text-sm text-text-secondary">{t('stats.termGpa')}:</span>
              <span className="text-sm font-semibold text-text-primary">
                {formatNumber(Number(student.academicSummary.gpa.toFixed(2)))}
              </span>
            </div>
          )}
          {student.academicSummary.completedCredits !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">{t('studentProfile.schedule.credits')}:</span>
              <span className="text-sm font-semibold text-text-primary">
                {formatNumber(student.academicSummary.completedCredits)}
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ScheduleTab({ student, onAddToSection }: ScheduleTabProps) {
  const { t } = useAcademicsI18n()
  const classrooms = student.classrooms || []
  const attendanceSummary = student.attendanceSummary

  // Try to fetch live attendance summary from API
  const { data: liveAttendance } = useStudentAttendanceSummary({
    studentId: student.studentId,
    enabled: !!student.studentId,
  })

  // Prefer live data, fall back to profile data
  const effectiveSummary = liveAttendance
    ? {
        attendanceRate: liveAttendance.attendanceRate,
        totalDays: liveAttendance.totalDays,
        present: liveAttendance.present,
        absent: liveAttendance.absent,
        late: liveAttendance.late,
        excused: liveAttendance.excused,
      }
    : attendanceSummary

  const hasNoData = classrooms.length === 0 && !effectiveSummary

  if (hasNoData) {
    return (
      <div className="text-center py-16">
        <BookOpen className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
        <p className="text-text-secondary font-medium">{t('studentProfile.schedule.noScheduleData')}</p>
        <p className="text-sm text-text-tertiary mt-1">
          {student.currentEnrollment
            ? t('studentProfile.schedule.addSectionsHint')
            : t('studentProfile.schedule.enrollSectionsHint')}
        </p>
        {onAddToSection && student.currentEnrollment && (
          <Button variant="outline" size="sm" onClick={onAddToSection} className="mt-4">
            <Plus className="w-4 h-4 me-1.5" />
            {t('actions.addToSection')}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div>
      {effectiveSummary && <AttendanceSection summary={effectiveSummary} />}

      {/* Quick Links + Add to Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/classrooms"
            search={{ tab: 'attendance' }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[rgb(var(--action-secondary-fg))] hover:text-[rgb(var(--text-primary))] bg-[rgb(var(--state-info-bg)/0.18)] hover:bg-[rgb(var(--state-info-bg)/0.26)] dark:bg-[rgb(var(--state-info-bg)/0.18)] dark:hover:bg-[rgb(var(--state-info-fg)/0.2)]  rounded-lg transition-colors"
          >
            <Calendar className="w-3.5 h-3.5" />
            {t('studentProfile.schedule.attendanceHistory')}
            <ExternalLink className="w-3 h-3" />
          </Link>
          <Link
            to="/classrooms"
            search={{ tab: 'gradebook' }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-[rgb(var(--state-warning-bg)/0.18)] dark:bg-[rgb(var(--state-warning-fg))]/10 dark:hover:bg-[rgb(var(--state-warning-fg))]/20 dark:text-amber-400 rounded-lg transition-colors"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            {t('studentProfile.schedule.viewGrades')}
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
        {onAddToSection && student.currentEnrollment && (
          <Button variant="outline" size="sm" onClick={onAddToSection}>
            <Plus className="w-3.5 h-3.5 me-1.5" />
            {t('actions.addToSection')}
          </Button>
        )}
      </div>

      {classrooms.length > 0 ? (
        <ScheduleTable classrooms={classrooms} student={student} studentId={student.studentId} />
      ) : (
        <section>
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-[rgb(var(--state-info-fg))]" />
            {t('sections.currentClasses')}
          </h3>
          <div className="text-center py-8">
            <BookOpen className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
            <p className="text-sm text-text-secondary">{t('empty.noClasses')}</p>
            <p className="text-xs text-text-tertiary mt-1">
              {t('empty.classesWillAppear')}
            </p>
            {onAddToSection && student.currentEnrollment && (
              <Button variant="outline" size="sm" onClick={onAddToSection} className="mt-3">
                <Plus className="w-3.5 h-3.5 me-1.5" />
                {t('actions.addToSection')}
              </Button>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

// ============================================================================
// SKELETON
// ============================================================================

export function ScheduleTabSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 bg-surface-tertiary rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 bg-surface-tertiary rounded animate-pulse" />
        ))}
      </div>
    </div>
  )
}
