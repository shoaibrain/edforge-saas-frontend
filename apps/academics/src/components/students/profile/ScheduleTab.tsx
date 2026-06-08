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
  if (rate >= 95) return { text: 'text-[rgb(var(--state-success-fg))]', label: 'Excellent' }
  if (rate >= 90) return { text: 'text-[rgb(var(--state-warning-fg))]', label: 'Good' }
  if (rate >= 85) return { text: 'text-[rgb(var(--state-warning-fg))]', label: 'At Risk' }
  return { text: 'text-[rgb(var(--state-danger-fg))]', label: 'Critical' }
}

// ============================================================================
// ATTENDANCE SECTION
// ============================================================================

function AttendanceSection({ summary }: { summary: AttendanceSummary }) {
  const rateColor = getRateColor(summary.attendanceRate)

  return (
    <section className="mb-8">
      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-amber-500" />
        Attendance Summary
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Rate */}
        <div className="sm:col-span-1 p-4 rounded-xl bg-surface-secondary border border-border-secondary">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">Rate</p>
          <p className={`text-2xl font-bold ${rateColor.text}`}>
            {summary.attendanceRate.toFixed(1)}%
          </p>
          <p className={`text-xs ${rateColor.text}`}>{rateColor.label}</p>
        </div>
        {/* Stats */}
        <StatCard label="Total Days" value={summary.totalDays} />
        <StatCard label="Present" value={summary.present} color="text-[rgb(var(--state-success-fg))]" />
        <StatCard label="Absent" value={summary.absent} color="text-[rgb(var(--state-danger-fg))]" />
        <StatCard label="Late" value={summary.late} color="text-[rgb(var(--state-warning-fg))]" />
        <StatCard label="Excused" value={summary.excused} color="text-[rgb(var(--state-info-fg))]" />
      </div>

      {/* Alerts */}
      {summary.attendanceRate < 90 && (
        <div className="mt-4 p-3 rounded-lg bg-[rgb(var(--state-warning-fg))]/5 border border-amber-500/15">
          <p className="text-sm text-[rgb(var(--state-warning-fg))] flex items-center gap-2">
            <TrendingDown className="w-4 h-4 flex-shrink-0" />
            Attendance below 90% may affect academic performance. Consider follow-up.
          </p>
        </div>
      )}
      {summary.attendanceRate >= 98 && (
        <div className="mt-4 p-3 rounded-lg bg-[rgb(var(--state-success-bg)/0.18)]0/5 border border-[rgb(var(--state-success-border))]/15">
          <p className="text-sm text-[rgb(var(--state-success-fg))] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 flex-shrink-0" />
            Outstanding attendance record!
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
  return (
    <div className="p-4 rounded-xl bg-surface-secondary border border-border-secondary">
      <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color || 'text-text-primary'}`}>{value}</p>
    </div>
  )
}

// ============================================================================
// SUBJECT COLORS
// ============================================================================

function getSubjectColor(subject?: string): { bg: string; text: string } {
  if (!subject) return { bg: 'bg-[rgb(var(--surface-tertiary))]0/10', text: 'text-slate-600 dark:text-[rgb(var(--text-tertiary))]' }
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
    return { bg: 'bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400' }
  if (s.includes('physical') || s.includes('pe') || s.includes('health'))
    return { bg: 'bg-[rgb(var(--state-warning-fg))]/10', text: 'text-[rgb(var(--state-warning-fg))]' }
  if (s.includes('computer') || s.includes('tech') || s.includes('programming'))
    return { bg: 'bg-[rgb(var(--state-info-fg))]/10', text: 'text-cyan-600 ' }
  return { bg: 'bg-[rgb(var(--surface-tertiary))]0/10', text: 'text-slate-600 dark:text-[rgb(var(--text-tertiary))]' }
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
  const schoolId = useActiveSchoolId() || ''
  const removeStudentMutation = useRemoveStudent()
  const [removingId, setRemovingId] = useState<string | null>(null)

  const handleRemove = async (classroom: Classroom) => {
    const confirmed = window.confirm(
      `Remove ${student.fullName} from ${classroom.name}? This will unlink the student from this section.`
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
          <BookOpen className="w-4 h-4 text-indigo-500" />
          Current Classes
          <span className="text-xs text-text-tertiary font-normal ml-1">
            ({classrooms.length})
          </span>
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-secondary">
              <th className="text-left py-2.5 px-3 text-xs font-medium text-text-tertiary uppercase tracking-wide w-8">#</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-text-tertiary uppercase tracking-wide">Class</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-text-tertiary uppercase tracking-wide">Subject</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-text-tertiary uppercase tracking-wide">Teacher</th>
              <th className="text-right py-2.5 px-3 text-xs font-medium text-text-tertiary uppercase tracking-wide w-16"></th>
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
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemove(classroom)}
                      disabled={isRemoving}
                      className="p-1.5 text-text-tertiary hover:text-[rgb(var(--state-danger-fg))] hover:bg-[rgb(var(--state-danger-bg)/0.18)] rounded-lg transition-colors disabled:opacity-50"
                      title="Remove from section"
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
              <span className="text-sm text-text-secondary">GPA:</span>
              <span className="text-sm font-semibold text-text-primary">
                {student.academicSummary.gpa.toFixed(2)}
              </span>
            </div>
          )}
          {student.academicSummary.completedCredits !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">Credits:</span>
              <span className="text-sm font-semibold text-text-primary">
                {student.academicSummary.completedCredits}
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
        <p className="text-text-secondary font-medium">No schedule data</p>
        <p className="text-sm text-text-tertiary mt-1">
          {student.currentEnrollment
            ? 'Add this student to class sections to begin tracking attendance and grades.'
            : 'Classes and attendance data will appear here once the student is enrolled in sections.'}
        </p>
        {onAddToSection && student.currentEnrollment && (
          <Button variant="outline" size="sm" onClick={onAddToSection} className="mt-4">
            <Plus className="w-4 h-4 mr-1.5" />
            Add to Section
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
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[rgb(var(--action-secondary-fg))] hover:text-[rgb(var(--text-primary))] bg-[rgb(var(--state-info-bg)/0.18)] hover:bg-[rgb(var(--state-info-bg)/0.26)] dark:bg-[rgb(var(--state-info-bg)/0.18)] dark:hover:bg-[rgb(var(--state-info-bg)/0.18)]0/20  rounded-lg transition-colors"
          >
            <Calendar className="w-3.5 h-3.5" />
            Attendance History
            <ExternalLink className="w-3 h-3" />
          </Link>
          <Link
            to="/classrooms"
            search={{ tab: 'gradebook' }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-[rgb(var(--state-warning-bg)/0.18)] dark:bg-[rgb(var(--state-warning-fg))]/10 dark:hover:bg-[rgb(var(--state-warning-fg))]/20 dark:text-amber-400 rounded-lg transition-colors"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            View Grades
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
        {onAddToSection && student.currentEnrollment && (
          <Button variant="outline" size="sm" onClick={onAddToSection}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add to Section
          </Button>
        )}
      </div>

      {classrooms.length > 0 ? (
        <ScheduleTable classrooms={classrooms} student={student} studentId={student.studentId} />
      ) : (
        <section>
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            Current Classes
          </h3>
          <div className="text-center py-8">
            <BookOpen className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
            <p className="text-sm text-text-secondary">No classes scheduled</p>
            <p className="text-xs text-text-tertiary mt-1">
              Classes will appear here once enrolled in sections.
            </p>
            {onAddToSection && student.currentEnrollment && (
              <Button variant="outline" size="sm" onClick={onAddToSection} className="mt-3">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add to Section
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
