/**
 * OverviewTab Component — Academic Dashboard
 *
 * Clean, chart-driven student overview. No redundancy — each metric once.
 * - Stat cards: attendance rate, classes, term GPA, cumulative GPA (live data)
 * - Attendance trend: minimal area chart with 90% reference line
 * - Course performance: horizontal bar chart, color-coded by grade band
 * - Current classes: read-only table
 *
 * No destructive actions. No redundant data.
 */

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts'
import {
  BookOpen,
  Calendar,
  User,
  TrendingDown,
  TrendingUp,
  GraduationCap,
  ExternalLink,
  BarChart3,
  Target,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import type { StudentProfileResponseDto } from '@aibrains/shared-types'
import { useStudentAttendanceSummary, useStudentAttendance } from '../../../hooks/useAttendance'
import { useStudentGrades, useCurrentAcademicYear } from '../../../hooks'
import { useActiveSchoolId } from '../../../stores/app.store'

// ============================================================================
// TYPES
// ============================================================================

export interface OverviewTabProps {
  student: StudentProfileResponseDto
}

type Classroom = NonNullable<StudentProfileResponseDto['classrooms']>[number]

// ============================================================================
// COLOR HELPERS
// ============================================================================

function getRateTheme(rate: number) {
  if (rate >= 95) return { accent: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', label: 'Excellent' }
  if (rate >= 90) return { accent: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10', label: 'Good' }
  if (rate >= 85) return { accent: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', label: 'At Risk' }
  return { accent: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10', label: 'Critical' }
}

function getGpaTheme(gpa: number) {
  if (gpa >= 3.5) return { accent: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' }
  if (gpa >= 3.0) return { accent: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' }
  if (gpa >= 2.0) return { accent: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' }
  return { accent: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' }
}

function getGradeBarColor(numericGrade: number): string {
  if (numericGrade >= 90) return '#10b981'
  if (numericGrade >= 80) return '#3b82f6'
  if (numericGrade >= 70) return '#f59e0b'
  if (numericGrade >= 60) return '#f97316'
  return '#ef4444'
}

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
// STAT CARD
// ============================================================================

function StatCard({
  icon: Icon,
  label,
  value,
  subLabel,
  accent,
  bg,
}: {
  icon: typeof GraduationCap
  label: string
  value: string | number
  subLabel?: string
  accent: string
  bg: string
}) {
  return (
    <div className="bg-surface-secondary rounded-xl border border-border-secondary p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`w-4 h-4 ${accent}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-text-tertiary uppercase tracking-wide">{label}</p>
          <p className="text-xl font-bold text-text-primary">{value}</p>
          {subLabel && <p className={`text-xs ${accent}`}>{subLabel}</p>}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// CHART TOOLTIPS
// ============================================================================

function TrendTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="bg-surface-primary border border-border-secondary rounded-lg shadow-lg px-3 py-2">
      <p className="text-xs text-text-tertiary">{point.displayDate}</p>
      <p className="text-sm font-semibold text-text-primary">{point.rate.toFixed(1)}%</p>
      <p className="text-xs text-text-tertiary mt-0.5">
        {point.present} of {point.total} present
      </p>
    </div>
  )
}

function GradeTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="bg-surface-primary border border-border-secondary rounded-lg shadow-lg px-3 py-2">
      <p className="text-xs text-text-tertiary">{point.name}</p>
      <p className="text-sm font-semibold text-text-primary">
        {point.grade != null ? `${point.grade.toFixed(1)}%` : '—'}
      </p>
      {point.letterGrade && (
        <p className="text-xs text-text-tertiary mt-0.5">Grade: {point.letterGrade}</p>
      )}
    </div>
  )
}

// ============================================================================
// ATTENDANCE TREND CHART (minimal, no grid)
// ============================================================================

function AttendanceTrendChart({ studentId }: { studentId: string }) {
  const thirtyDaysAgo = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  }, [])
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  const { data: records, isLoading } = useStudentAttendance({
    studentId,
    startDate: thirtyDaysAgo,
    endDate: today,
    enabled: !!studentId,
  })

  const chartData = useMemo(() => {
    if (!records || records.length === 0) return []
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date))
    let totalDays = 0
    let presentDays = 0
    return sorted.map((record) => {
      totalDays++
      if (record.status === 'present' || record.status === 'late' || record.status === 'remote') {
        presentDays++
      }
      const rate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0
      return {
        date: record.date,
        displayDate: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rate: Math.round(rate * 10) / 10,
        present: presentDays,
        total: totalDays,
      }
    })
  }, [records])

  if (isLoading) {
    return <div className="h-[160px] bg-surface-secondary rounded-xl animate-pulse" />
  }

  if (chartData.length === 0) {
    return (
      <div className="h-[120px] flex items-center justify-center rounded-xl border border-border-secondary bg-surface-secondary/30">
        <p className="text-sm text-text-tertiary">No attendance data recorded yet</p>
      </div>
    )
  }

  return (
    <figure role="img" aria-label="Student attendance trend">
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="studentAttGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#005f73" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#005f73" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 10, fill: 'var(--color-text-tertiary, #9ca3af)' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: 'var(--color-text-tertiary, #9ca3af)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}%`}
            ticks={[0, 50, 90, 100]}
          />
          <ReferenceLine
            y={90}
            stroke="#f59e0b"
            strokeDasharray="6 3"
            strokeOpacity={0.5}
            label={{ value: '90%', position: 'right', fontSize: 10, fill: '#f59e0b', opacity: 0.7 }}
          />
          <Tooltip content={<TrendTooltip />} />
          <Area
            type="monotone"
            dataKey="rate"
            stroke="#005f73"
            strokeWidth={2}
            fill="url(#studentAttGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#005f73', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </figure>
  )
}

// ============================================================================
// COURSE PERFORMANCE CHART
// ============================================================================

function CoursePerformanceChart({
  grades,
}: {
  grades: Array<{ gradeId: string; courseName?: string; courseId: string; numericGrade: number; letterGrade: string; isFinal: boolean }>
}) {
  const chartData = useMemo(() => {
    return grades
      .filter((g) => g.numericGrade != null)
      .map((g) => ({
        name: g.courseName || g.courseId.slice(0, 12),
        grade: g.numericGrade,
        letterGrade: g.letterGrade,
      }))
  }, [grades])

  if (chartData.length === 0) {
    return (
      <section>
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-blue-500" />
          Course Performance
        </h3>
        <div className="py-8 text-center rounded-xl border border-border-secondary bg-surface-secondary/30">
          <GraduationCap className="w-8 h-8 mx-auto text-text-tertiary mb-2" />
          <p className="text-sm text-text-secondary">No grades recorded yet</p>
          <p className="text-xs text-text-tertiary mt-1">
            Grades will appear here once recorded by teachers.
          </p>
        </div>
      </section>
    )
  }

  const chartHeight = Math.max(120, chartData.length * 40 + 20)

  return (
    <section>
      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-blue-500" />
        Course Performance
      </h3>
      <div className="rounded-xl border border-border-secondary bg-surface-secondary/30 p-4">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: 'var(--color-text-tertiary, #9ca3af)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: 'var(--color-text-tertiary, #9ca3af)' }}
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <Tooltip content={<GradeTooltip />} />
            <Bar dataKey="grade" radius={[0, 4, 4, 0]} barSize={18}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={getGradeBarColor(entry.grade)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border-secondary">
          {[
            { label: 'A (90+)', color: '#10b981' },
            { label: 'B (80-89)', color: '#3b82f6' },
            { label: 'C (70-79)', color: '#f59e0b' },
            { label: 'D (60-69)', color: '#f97316' },
            { label: 'F (<60)', color: '#ef4444' },
          ].map((item) => (
            <span key={item.label} className="flex items-center gap-1.5 text-[10px] text-text-tertiary">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// CLASSES LIST (read-only)
// ============================================================================

function ClassesList({ classrooms }: { classrooms: Classroom[] }) {
  if (classrooms.length === 0) {
    return (
      <section>
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-indigo-500" />
          Current Classes
        </h3>
        <div className="text-center py-8 rounded-xl border border-border-secondary bg-surface-secondary/30">
          <BookOpen className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
          <p className="text-sm text-text-secondary">No classes scheduled</p>
          <p className="text-xs text-text-tertiary mt-1">
            Classes will appear here once enrolled in sections.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
        <BookOpen className="w-4 h-4 text-indigo-500" />
        Current Classes
        <span className="text-xs text-text-tertiary font-normal ml-1">({classrooms.length})</span>
      </h3>
      <div className="overflow-x-auto rounded-xl border border-border-secondary">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-secondary">
              <th className="text-left py-2.5 px-3 text-xs font-medium text-text-tertiary uppercase tracking-wide w-8">#</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-text-tertiary uppercase tracking-wide">Class</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-text-tertiary uppercase tracking-wide">Subject</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-text-tertiary uppercase tracking-wide">Teacher</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-secondary">
            {classrooms.map((classroom, index) => {
              const subjectColor = getSubjectColor(classroom.subject)
              return (
                <tr key={classroom.classroomId} className="hover:bg-surface-secondary/50 transition-colors">
                  <td className="py-3 px-3">
                    <div className={`w-7 h-7 rounded-lg ${subjectColor.bg} flex items-center justify-center`}>
                      <span className={`text-xs font-semibold ${subjectColor.text}`}>{index + 1}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-medium text-text-primary">{classroom.name}</td>
                  <td className="py-3 px-3 text-text-secondary">{classroom.subject || '—'}</td>
                  <td className="py-3 px-3 text-text-secondary">
                    {classroom.teacherName ? (
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-text-tertiary" />
                        {classroom.teacherName}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OverviewTab({ student }: OverviewTabProps) {
  const classrooms = student.classrooms || []
  const schoolId = useActiveSchoolId() || ''

  const { data: liveAttendance } = useStudentAttendanceSummary({
    studentId: student.studentId,
    enabled: !!student.studentId,
  })

  const { data: currentYear } = useCurrentAcademicYear(schoolId)

  const { data: gradesData, isLoading: gradesLoading } = useStudentGrades(
    student.studentId,
    { academicYearId: currentYear?.yearId },
    !!student.studentId,
  )

  const effectiveSummary = liveAttendance
    ? {
        attendanceRate: liveAttendance.attendanceRate,
        totalDays: liveAttendance.totalDays,
        present: liveAttendance.present,
        absent: liveAttendance.absent,
        late: liveAttendance.late,
        excused: liveAttendance.excused,
      }
    : student.attendanceSummary

  const hasNoData = classrooms.length === 0 && !effectiveSummary

  const attendanceRate = effectiveSummary?.attendanceRate
  const rateTheme = attendanceRate != null ? getRateTheme(attendanceRate) : null

  const gpa = gradesData?.gpa
  const grades = gradesData?.grades ?? []

  const termGpaTheme = gpa?.termGpa != null ? getGpaTheme(gpa.termGpa) : null
  const cumGpaTheme = gpa?.cumulativeGpa != null ? getGpaTheme(gpa.cumulativeGpa) : null

  if (hasNoData) {
    return (
      <div className="text-center py-16">
        <BarChart3 className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
        <p className="text-text-secondary font-medium">No academic data yet</p>
        <p className="text-sm text-text-tertiary mt-1">
          {student.currentEnrollment
            ? 'This student has no class sections or attendance data yet.'
            : 'Enroll this student first, then add to class sections.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards — each metric exactly once */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={Target}
          label="Attendance"
          value={attendanceRate != null ? `${attendanceRate.toFixed(1)}%` : '—'}
          subLabel={rateTheme?.label}
          accent={rateTheme?.accent || 'text-text-tertiary'}
          bg={rateTheme?.bg || 'bg-surface-tertiary'}
        />
        <StatCard
          icon={BookOpen}
          label="Classes"
          value={classrooms.length}
          accent="text-indigo-600 dark:text-indigo-400"
          bg="bg-indigo-500/10"
        />
        <StatCard
          icon={GraduationCap}
          label="Term GPA"
          value={gpa?.termGpa != null ? gpa.termGpa.toFixed(2) : gradesLoading ? '...' : '—'}
          accent={termGpaTheme?.accent || 'text-text-tertiary'}
          bg={termGpaTheme?.bg || 'bg-surface-tertiary'}
        />
        <StatCard
          icon={GraduationCap}
          label="Cum. GPA"
          value={gpa?.cumulativeGpa != null ? gpa.cumulativeGpa.toFixed(2) : gradesLoading ? '...' : '—'}
          accent={cumGpaTheme?.accent || 'text-text-tertiary'}
          bg={cumGpaTheme?.bg || 'bg-surface-tertiary'}
        />
      </div>

      {/* Attendance Trend */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            Attendance Trend
          </h3>
          <Link
            to="/attendance"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 dark:text-teal-400 rounded-lg transition-colors"
          >
            <Calendar className="w-3.5 h-3.5" />
            History
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
        <AttendanceTrendChart studentId={student.studentId} />
        {effectiveSummary && effectiveSummary.attendanceRate < 90 && (
          <div className="mt-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
            <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 flex-shrink-0" />
              Attendance below 90% may affect academic performance. Consider follow-up.
            </p>
          </div>
        )}
        {effectiveSummary && effectiveSummary.attendanceRate >= 98 && (
          <div className="mt-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
            <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 flex-shrink-0" />
              Outstanding attendance record!
            </p>
          </div>
        )}
      </section>

      {/* Course Performance + Classes — side by side on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CoursePerformanceChart grades={grades} />
        <ClassesList classrooms={classrooms} />
      </div>
    </div>
  )
}

// ============================================================================
// SKELETON
// ============================================================================

export function OverviewTabSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-surface-secondary rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-[180px] bg-surface-secondary rounded-xl animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[200px] bg-surface-secondary rounded-xl animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-surface-tertiary rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
