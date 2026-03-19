/**
 * OverviewTab Component — Academic Dashboard
 *
 * Student overview with:
 * - Stat cards: attendance rate, classes, term GPA, cumulative GPA
 * - Attendance trend chart + daily status strip
 * - Expandable course grade cards with category breakdown + assignments
 * - Current classes table
 */

import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
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
  Lock,
  ChevronDown,
  ChevronRight,
  FileText,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from '@edforge/i18n'
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
// PERMISSION ERROR HELPERS
// ============================================================================

function is403Error(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const axiosError = error as { response?: { status?: number } }
  return axiosError.response?.status === 403
}

function AccessRestricted({ label }: { label: string }) {
  const { t } = useTranslation('academics')
  return (
    <div className="py-6 text-center rounded-xl border border-border-secondary bg-surface-secondary/30">
      <Lock className="w-6 h-6 mx-auto text-text-tertiary mb-2" />
      <p className="text-sm text-text-secondary">{t('empty.noSectionsAvailable', { label })}</p>
    </div>
  )
}

// ============================================================================
// COLOR HELPERS
// ============================================================================

function getRateTheme(rate: number) {
  if (rate >= 95) return { accent: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', labelKey: 'performance.excellent' }
  if (rate >= 90) return { accent: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10', labelKey: 'performance.good' }
  if (rate >= 85) return { accent: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', labelKey: 'performance.atRisk' }
  return { accent: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10', labelKey: 'performance.critical' }
}

function getGpaTheme(gpa: number) {
  if (gpa >= 3.5) return { accent: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' }
  if (gpa >= 3.0) return { accent: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' }
  if (gpa >= 2.0) return { accent: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' }
  return { accent: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' }
}

function getGradeColor(numericGrade: number): string {
  if (numericGrade >= 90) return 'text-emerald-600 dark:text-emerald-400'
  if (numericGrade >= 80) return 'text-blue-600 dark:text-blue-400'
  if (numericGrade >= 70) return 'text-amber-600 dark:text-amber-400'
  if (numericGrade >= 60) return 'text-orange-600 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}

function getGradeBg(numericGrade: number): string {
  if (numericGrade >= 90) return 'bg-emerald-500'
  if (numericGrade >= 80) return 'bg-blue-500'
  if (numericGrade >= 70) return 'bg-amber-500'
  if (numericGrade >= 60) return 'bg-orange-500'
  return 'bg-red-500'
}

function getLetterBadgeClasses(letter: string): string {
  switch (letter) {
    case 'A': return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
    case 'B': return 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
    case 'C': return 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
    case 'D': return 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
    default: return 'bg-red-500/15 text-red-600 dark:text-red-400'
  }
}

function getAttendanceDotColor(status: string): string {
  switch (status) {
    case 'present': return 'bg-emerald-500'
    case 'absent': return 'bg-red-500'
    case 'late': case 'tardy': return 'bg-amber-500'
    case 'excused': return 'bg-blue-500'
    case 'remote': return 'bg-indigo-500'
    default: return 'bg-slate-300 dark:bg-slate-600'
  }
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
    <div className="bg-surface-secondary rounded-xl border border-[rgb(var(--border-primary)/0.6)] shadow-sm p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`w-4 h-4 ${accent}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-semibold text-text-primary">{value}</p>
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

// ============================================================================
// ATTENDANCE TREND CHART
// ============================================================================

function AttendanceTrendChart({ studentId }: { studentId: string }) {
  const { t: tAcad } = useTranslation('academics')
  const thirtyDaysAgo = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  }, [])
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  const { data: records, isLoading, error: trendError } = useStudentAttendance({
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

  if (is403Error(trendError)) {
    return <AccessRestricted label="attendance data" />
  }

  if (chartData.length === 0) {
    return (
      <div className="h-[120px] flex items-center justify-center rounded-xl border border-border-secondary bg-surface-secondary/30">
        <p className="text-sm text-text-tertiary">{tAcad('empty.noAttendance')}</p>
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
// ATTENDANCE DAILY STATUS STRIP
// ============================================================================

function AttendanceDailyStrip({ studentId }: { studentId: string }) {
  const thirtyDaysAgo = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  }, [])
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  const { data: records } = useStudentAttendance({
    studentId,
    startDate: thirtyDaysAgo,
    endDate: today,
    enabled: !!studentId,
  })

  const days = useMemo(() => {
    const statusMap = new Map<string, string>()
    if (records) {
      for (const r of records) {
        statusMap.set(r.date, r.status)
      }
    }
    const result: Array<{ date: string; label: string; status: string | null; isWeekend: boolean }> = []
    const start = new Date(thirtyDaysAgo)
    const end = new Date(today)
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const iso = d.toISOString().split('T')[0]
      const dow = d.getDay()
      result.push({
        date: iso,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        status: statusMap.get(iso) || null,
        isWeekend: dow === 0 || dow === 6,
      })
    }
    return result
  }, [records, thirtyDaysAgo, today])

  if (!records || records.length === 0) return null

  return (
    <div className="mt-3">
      <div className="flex items-center gap-1.5 flex-wrap">
        {days.map((day) => (
          <div
            key={day.date}
            title={`${day.label}: ${day.status || (day.isWeekend ? 'Weekend' : 'No record')}`}
            className={`w-3 h-3 rounded-sm ${
              day.isWeekend
                ? 'bg-surface-secondary'
                : day.status
                  ? getAttendanceDotColor(day.status)
                  : 'bg-slate-200 dark:bg-slate-700'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center gap-3 mt-2">
        {[
          { status: 'present', label: 'Present' },
          { status: 'absent', label: 'Absent' },
          { status: 'late', label: 'Late' },
          { status: 'excused', label: 'Excused' },
        ].map((item) => (
          <span key={item.status} className="flex items-center gap-1 text-[10px] text-text-tertiary">
            <span className={`w-2 h-2 rounded-sm ${getAttendanceDotColor(item.status)}`} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// EXPANDABLE COURSE GRADE CARD
// ============================================================================

function CourseGradeCard({
  grade,
  courseName,
}: {
  grade: any
  courseName: string
}) {
  const [expanded, setExpanded] = useState(false)

  const numericGrade = grade.numericGrade
  const letterGrade = grade.letterGrade || '—'
  const categoryGrades: any[] = grade.categoryGrades || []
  const assignments: any[] = grade.assignments || []

  const gradedAssignments = useMemo(() => {
    return [...assignments]
      .sort((a, b) => new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime())
  }, [assignments])

  const totalWeight = categoryGrades.reduce((sum: number, c: any) => sum + (c.weight || 0), 0)

  return (
    <div className="rounded-xl border border-border-secondary bg-surface-secondary/30 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface-secondary/50 transition-colors"
      >
        {expanded
          ? <ChevronDown className="w-4 h-4 text-text-tertiary shrink-0" />
          : <ChevronRight className="w-4 h-4 text-text-tertiary shrink-0" />
        }
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary truncate">{courseName}</span>
            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${getLetterBadgeClasses(letterGrade)}`}>
              {letterGrade}
            </span>
            {grade.isFinal && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-teal-500/15 text-teal-600 dark:text-teal-400">
                Final
              </span>
            )}
          </div>
          {/* Grade bar */}
          {numericGrade != null && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-2 bg-surface-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getGradeBg(numericGrade)} transition-all`}
                  style={{ width: `${Math.min(numericGrade, 100)}%` }}
                />
              </div>
              <span className={`text-xs font-semibold ${getGradeColor(numericGrade)} tabular-nums`}>
                {numericGrade.toFixed(1)}%
              </span>
            </div>
          )}
          {/* Category weights bar */}
          {categoryGrades.length > 0 && totalWeight > 0 && (
            <div className="flex gap-0.5 mt-1.5 h-1.5 rounded-full overflow-hidden bg-surface-secondary">
              {categoryGrades.map((cat: any, i: number) => {
                const pct = (cat.weight / totalWeight) * 100
                const catPct = cat.percentage ?? 0
                return (
                  <div
                    key={cat.categoryId || i}
                    title={`${cat.categoryName}: ${catPct.toFixed(0)}% (${cat.weight}% weight)`}
                    className="h-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: catPct >= 90 ? '#10b981' : catPct >= 80 ? '#3b82f6' : catPct >= 70 ? '#f59e0b' : catPct >= 60 ? '#f97316' : catPct > 0 ? '#ef4444' : '#94a3b8',
                      opacity: catPct > 0 ? 1 : 0.3,
                    }}
                  />
                )
              })}
            </div>
          )}
        </div>
      </button>

      {/* Expanded: Category breakdown + Assignments */}
      {expanded && (
        <div className="border-t border-border-secondary">
          {/* Category breakdown */}
          {categoryGrades.length > 0 && (
            <div className="px-4 pt-3 pb-2">
              <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wide mb-2">Category Breakdown</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categoryGrades.map((cat: any, i: number) => (
                  <div key={cat.categoryId || i} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-surface-secondary">
                    <div className="min-w-0">
                      <p className="text-xs text-text-secondary truncate">{cat.categoryName}</p>
                      <p className="text-[10px] text-text-tertiary">{cat.weight}% weight</p>
                    </div>
                    <span className={`text-xs font-bold tabular-nums ${cat.percentage > 0 ? getGradeColor(cat.percentage) : 'text-text-tertiary'}`}>
                      {cat.percentage > 0 ? `${cat.percentage.toFixed(0)}%` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assignments list */}
          {gradedAssignments.length > 0 && (
            <div className="px-4 pt-2 pb-3">
              <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wide mb-2">
                Assignments ({gradedAssignments.length})
              </p>
              <div className="space-y-1">
                {gradedAssignments.map((a: any) => (
                  <div key={a.assignmentId} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-secondary transition-colors">
                    <FileText className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                    <span className="text-xs text-text-primary truncate flex-1">{a.assignmentName}</span>
                    <span className="text-[10px] text-text-tertiary shrink-0">{a.assignmentType}</span>
                    {a.earnedPoints != null ? (
                      <span className={`text-xs font-medium tabular-nums shrink-0 ${getGradeColor(a.percentage ?? (a.earnedPoints / a.possiblePoints) * 100)}`}>
                        {a.earnedPoints}/{a.possiblePoints}
                      </span>
                    ) : (
                      <span className="text-xs text-text-tertiary shrink-0">—/{a.possiblePoints}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {gradedAssignments.length === 0 && categoryGrades.length === 0 && (
            <div className="px-4 py-4 text-center text-xs text-text-tertiary">
              No detailed grade data available
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// COURSE GRADES SECTION
// ============================================================================

function CourseGradeCards({
  grades,
  courseNameMap,
}: {
  grades: any[]
  courseNameMap: Map<string, string>
}) {
  const { t: tAcad } = useTranslation('academics')

  const validGrades = grades.filter((g) => g.numericGrade != null)

  if (validGrades.length === 0) {
    return (
      <section>
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-blue-500" />
          {tAcad('sections.coursePerformance')}
        </h3>
        <div className="py-8 text-center rounded-xl border border-border-secondary bg-surface-secondary/30">
          <GraduationCap className="w-8 h-8 mx-auto text-text-tertiary mb-2" />
          <p className="text-sm text-text-secondary">{tAcad('empty.noGrades')}</p>
          <p className="text-xs text-text-tertiary mt-1">
            {tAcad('empty.gradesWillAppear')}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-blue-500" />
        {tAcad('sections.coursePerformance')}
        <span className="text-xs text-text-tertiary font-normal ml-1">({validGrades.length})</span>
      </h3>
      <div className="space-y-2">
        {validGrades.map((g) => (
          <CourseGradeCard
            key={g.gradeId}
            grade={g}
            courseName={g.courseName || courseNameMap.get(g.courseId) || g.courseId.slice(0, 12)}
          />
        ))}
      </div>
    </section>
  )
}

// ============================================================================
// CLASSES LIST (read-only)
// ============================================================================

function ClassesList({ classrooms }: { classrooms: Classroom[] }) {
  const { t: tAcad } = useTranslation('academics')
  if (classrooms.length === 0) {
    return (
      <section>
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-indigo-500" />
          {tAcad('sections.currentClasses')}
        </h3>
        <div className="text-center py-8 rounded-xl border border-border-secondary bg-surface-secondary/30">
          <BookOpen className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
          <p className="text-sm text-text-secondary">{tAcad('empty.noClasses')}</p>
          <p className="text-xs text-text-tertiary mt-1">
            {tAcad('empty.classesWillAppear')}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
        <BookOpen className="w-4 h-4 text-indigo-500" />
        {tAcad('sections.currentClasses')}
        <span className="text-xs text-text-tertiary font-normal ml-1">({classrooms.length})</span>
      </h3>
      <div className="overflow-x-auto rounded-xl shadow-sm border border-[rgb(var(--border-primary)/0.6)] bg-surface-secondary">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[rgb(var(--surface-tertiary)/0.5)]">
              <th className="text-left py-3 px-6 text-xs font-semibold text-text-tertiary uppercase tracking-wider w-12">{tAcad('tableHeaders.number')}</th>
              <th className="text-left py-3 px-6 text-xs font-semibold text-text-tertiary uppercase tracking-wider">{tAcad('tableHeaders.class')}</th>
              <th className="text-left py-3 px-6 text-xs font-semibold text-text-tertiary uppercase tracking-wider">{tAcad('tableHeaders.subject')}</th>
              <th className="text-left py-3 px-6 text-xs font-semibold text-text-tertiary uppercase tracking-wider">{tAcad('tableHeaders.teacher')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-secondary">
            {classrooms.map((classroom, index) => {
              const subjectColor = getSubjectColor(classroom.subject)
              return (
                <tr key={classroom.classroomId} className="hover:bg-[rgb(var(--surface-tertiary)/0.5)] transition-colors">
                  <td className="py-4 px-6">
                    <div className={`w-7 h-7 rounded-lg ${subjectColor.bg} flex items-center justify-center`}>
                      <span className={`text-xs font-semibold ${subjectColor.text}`}>{index + 1}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-medium text-text-primary">{classroom.name}</td>
                  <td className="py-4 px-6 text-text-secondary">{classroom.subject || '—'}</td>
                  <td className="py-4 px-6 text-text-secondary">
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
  const { t: tAcad } = useTranslation('academics')
  const classrooms = student.classrooms || []
  const schoolId = useActiveSchoolId() || ''

  const { data: liveAttendance, error: attendanceError } = useStudentAttendanceSummary({
    studentId: student.studentId,
    schoolId,
    enabled: !!student.studentId,
  })

  const { data: currentYear } = useCurrentAcademicYear(schoolId)

  const { data: gradesData, isLoading: gradesLoading, error: gradesError } = useStudentGrades(
    student.studentId,
    { schoolId, academicYearId: currentYear?.yearId },
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

  const hasPermissionError = is403Error(attendanceError) || is403Error(gradesError)
  const hasNoData = classrooms.length === 0 && !effectiveSummary && !hasPermissionError

  const attendanceRate = effectiveSummary?.attendanceRate
  const rateTheme = attendanceRate != null ? getRateTheme(attendanceRate) : null

  const gpa = gradesData?.gpa
  const grades = gradesData?.grades ?? []

  // Client-side GPA computation when backend returns null (same pattern as report-card.tsx:81-83)
  const computedGpa = useMemo(() => {
    if (gpa?.cumulativeGpa != null) return gpa
    const withGpa = grades.filter((g: any) => g.gpaPoints != null && g.numericGrade != null)
    if (withGpa.length === 0) return null
    const avg = withGpa.reduce((sum: number, g: any) => sum + g.gpaPoints, 0) / withGpa.length
    return { termGpa: avg, cumulativeGpa: avg, weightedGpa: avg }
  }, [gpa, grades])

  // Course name lookup from classrooms when grade record is missing courseName
  const courseNameMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of classrooms) {
      if ((c as any).courseId) map.set((c as any).courseId, c.subject || c.name)
    }
    return map
  }, [classrooms])

  const termGpaTheme = computedGpa?.termGpa != null ? getGpaTheme(computedGpa.termGpa) : null
  const cumGpaTheme = computedGpa?.cumulativeGpa != null ? getGpaTheme(computedGpa.cumulativeGpa) : null

  if (hasNoData) {
    return (
      <div className="text-center py-16">
        <BarChart3 className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
        <p className="text-text-secondary font-medium">{tAcad('empty.noAcademicData')}</p>
        <p className="text-sm text-text-tertiary mt-1">
          {student.currentEnrollment
            ? tAcad('empty.noDataDescription')
            : tAcad('empty.enrollFirst')}
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
          label={tAcad('stats.attendance')}
          value={attendanceRate != null ? `${attendanceRate.toFixed(1)}%` : '—'}
          subLabel={rateTheme?.labelKey ? tAcad(rateTheme.labelKey) : undefined}
          accent={rateTheme?.accent || 'text-text-tertiary'}
          bg={rateTheme?.bg || 'bg-surface-tertiary'}
        />
        <StatCard
          icon={BookOpen}
          label={tAcad('stats.classes')}
          value={classrooms.length}
          accent="text-indigo-600 dark:text-indigo-400"
          bg="bg-indigo-500/10"
        />
        <StatCard
          icon={GraduationCap}
          label={tAcad('stats.termGpa')}
          value={computedGpa?.termGpa != null ? computedGpa.termGpa.toFixed(2) : gradesLoading ? '...' : '—'}
          accent={termGpaTheme?.accent || 'text-text-tertiary'}
          bg={termGpaTheme?.bg || 'bg-surface-tertiary'}
        />
        <StatCard
          icon={GraduationCap}
          label={tAcad('stats.cumGpa')}
          value={computedGpa?.cumulativeGpa != null ? computedGpa.cumulativeGpa.toFixed(2) : gradesLoading ? '...' : '—'}
          accent={cumGpaTheme?.accent || 'text-text-tertiary'}
          bg={cumGpaTheme?.bg || 'bg-surface-tertiary'}
        />
      </div>

      {/* Attendance Trend + Daily Strip */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            {tAcad('sections.attendanceTrend')}
          </h3>
          <Link
            to="/classrooms"
            search={{ tab: 'attendance' }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 dark:bg-teal-500/10 dark:hover:bg-teal-500/20 dark:text-teal-400 rounded-lg transition-colors"
          >
            <Calendar className="w-3.5 h-3.5" />
            {tAcad('sections.history')}
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
        <AttendanceTrendChart studentId={student.studentId} />
        <AttendanceDailyStrip studentId={student.studentId} />
        {effectiveSummary && effectiveSummary.attendanceRate < 90 && (
          <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20">
            <p className="text-sm text-amber-800 dark:text-amber-400 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 flex-shrink-0" />
              {tAcad('alerts.lowAttendance')}
            </p>
          </div>
        )}
        {effectiveSummary && effectiveSummary.attendanceRate >= 98 && (
          <div className="mt-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-500/20">
            <p className="text-sm text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 flex-shrink-0" />
              {tAcad('alerts.highAttendance')}
            </p>
          </div>
        )}
      </section>

      {/* Course Performance + Classes — side by side on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {is403Error(gradesError) ? (
          <section>
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              {tAcad('sections.coursePerformance')}
            </h3>
            <AccessRestricted label="grade data" />
          </section>
        ) : (
          <CourseGradeCards grades={grades} courseNameMap={courseNameMap} />
        )}
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
