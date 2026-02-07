/**
 * ScheduleTab Component
 *
 * Combines class schedule and attendance summary into one tab.
 * Clean table layout for classes, attendance stats at the top.
 */

import {
  BookOpen,
  Calendar,
  User,
  TrendingDown,
  TrendingUp,
  GraduationCap,
  ExternalLink,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import type { StudentProfileResponseDto } from '@edforge/shared-types'
import { useStudentAttendanceSummary } from '../../../hooks/useAttendance'

// ============================================================================
// TYPES
// ============================================================================

export interface ScheduleTabProps {
  student: StudentProfileResponseDto
}

type AttendanceSummary = NonNullable<StudentProfileResponseDto['attendanceSummary']>
type Classroom = NonNullable<StudentProfileResponseDto['classrooms']>[number]

// ============================================================================
// ATTENDANCE HELPERS
// ============================================================================

function getRateColor(rate: number) {
  if (rate >= 95) return { text: 'text-emerald-600 dark:text-emerald-400', label: 'Excellent' }
  if (rate >= 90) return { text: 'text-amber-600 dark:text-amber-400', label: 'Good' }
  if (rate >= 85) return { text: 'text-orange-600 dark:text-orange-400', label: 'At Risk' }
  return { text: 'text-red-600 dark:text-red-400', label: 'Critical' }
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
        <StatCard label="Present" value={summary.present} color="text-emerald-600 dark:text-emerald-400" />
        <StatCard label="Absent" value={summary.absent} color="text-red-600 dark:text-red-400" />
        <StatCard label="Late" value={summary.late} color="text-amber-600 dark:text-amber-400" />
        <StatCard label="Excused" value={summary.excused} color="text-blue-600 dark:text-blue-400" />
      </div>

      {/* Alerts */}
      {summary.attendanceRate < 90 && (
        <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
          <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 flex-shrink-0" />
            Attendance below 90% may affect academic performance. Consider follow-up.
          </p>
        </div>
      )}
      {summary.attendanceRate >= 98 && (
        <div className="mt-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
          <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
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
  if (!subject) return { bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400' }
  const s = subject.toLowerCase()
  if (s.includes('math') || s.includes('algebra') || s.includes('calculus'))
    return { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' }
  if (s.includes('english') || s.includes('language') || s.includes('literature'))
    return { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400' }
  if (s.includes('science') || s.includes('biology') || s.includes('chemistry') || s.includes('physics'))
    return { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' }
  if (s.includes('history') || s.includes('social') || s.includes('geography'))
    return { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' }
  if (s.includes('art') || s.includes('music') || s.includes('drama'))
    return { bg: 'bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400' }
  if (s.includes('physical') || s.includes('pe') || s.includes('health'))
    return { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400' }
  if (s.includes('computer') || s.includes('tech') || s.includes('programming'))
    return { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400' }
  return { bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400' }
}

// ============================================================================
// SCHEDULE TABLE
// ============================================================================

function ScheduleTable({ classrooms, student }: { classrooms: Classroom[]; student: StudentProfileResponseDto }) {
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
            </tr>
          </thead>
          <tbody>
            {classrooms.map((classroom, index) => {
              const subjectColor = getSubjectColor(classroom.subject)
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

export function ScheduleTab({ student }: ScheduleTabProps) {
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
          Classes and attendance data will appear here once the student is enrolled in sections.
        </p>
      </div>
    )
  }

  return (
    <div>
      {effectiveSummary && <AttendanceSection summary={effectiveSummary} />}

      {/* Quick Links */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/attendance"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 dark:text-teal-400 rounded-lg transition-colors"
        >
          <Calendar className="w-3.5 h-3.5" />
          Attendance History
          <ExternalLink className="w-3 h-3" />
        </Link>
        <Link
          to="/grades"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 dark:text-amber-400 rounded-lg transition-colors"
        >
          <GraduationCap className="w-3.5 h-3.5" />
          View Grades
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {classrooms.length > 0 ? (
        <ScheduleTable classrooms={classrooms} student={student} />
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
