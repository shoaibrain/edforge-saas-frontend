/**
 * Grade Dashboard
 *
 * School-wide grade analytics showing:
 * - Summary stat cards (avg GPA, pass rate, at-risk count, total graded)
 * - Grade distribution bar chart (Recharts)
 * - Course performance table with averages
 * - At-risk students table (below 60%)
 * - CSV export for at-risk data
 *
 * All data is client-side aggregated from section grades.
 */

import { useMemo, useCallback } from 'react'
import { useQueries } from '@tanstack/react-query'
import {
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Download,
  Users,
  Award,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'
import { gradeKeys } from '../../hooks/useGrades'
import { getSectionGrades } from '../../services/academics.service'
import type { SectionGradebookResponse } from '../../services/academics.service'
import type { SectionResponseDto } from '@aibrains/shared-types'

// ============================================================================
// TYPES
// ============================================================================

interface GradeDashboardProps {
  schoolId: string
  academicYearId: string
  sections: SectionResponseDto[]
}

interface CoursePerformance {
  courseId: string
  courseName: string
  sectionCount: number
  studentCount: number
  avgGrade: number
  avgGpa: number
  passRate: number
}

interface AtRiskStudent {
  studentId: string
  studentName: string
  courseId: string
  courseName: string
  numericGrade: number
  letterGrade: string
}

// ============================================================================
// STAT CARD
// ============================================================================

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  accent,
  bg,
}: {
  icon: typeof GraduationCap
  label: string
  value: string | number
  subValue?: string
  accent: string
  bg: string
}) {
  return (
    <div className="bg-surface-primary rounded-xl border border-border-secondary p-5">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${bg}`}>
          <Icon className={`w-5 h-5 ${accent}`} />
        </div>
        <div>
          <p className="text-xs text-text-tertiary uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
          {subValue && <p className="text-xs text-text-secondary mt-0.5">{subValue}</p>}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SKELETON LOADERS
// ============================================================================

function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-surface-primary rounded-xl border border-border-secondary p-5 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-hover rounded-lg" />
            <div className="space-y-2">
              <div className="h-3 w-16 bg-surface-hover rounded" />
              <div className="h-6 w-12 bg-surface-hover rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}


// ============================================================================
// GRADE COLOR HELPERS
// ============================================================================

function getGradeColor(percentage: number): string {
  if (percentage >= 90) return 'text-emerald-600 dark:text-emerald-400'
  if (percentage >= 80) return 'text-blue-600 dark:text-blue-400'
  if (percentage >= 70) return 'text-amber-600 dark:text-amber-400'
  if (percentage >= 60) return 'text-orange-600 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}

const DISTRIBUTION_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444']

// ============================================================================
// CHART TOOLTIP
// ============================================================================

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-primary border border-border-secondary rounded-lg shadow-lg px-3 py-2">
      <p className="text-xs text-text-tertiary mb-1">{label}</p>
      <p className="text-sm font-semibold text-text-primary">
        {payload[0].value} student{payload[0].value !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

// ============================================================================
// CSV EXPORT
// ============================================================================

function exportAtRiskCsv(students: AtRiskStudent[], schoolId: string) {
  const header = 'Student Name,Course,Numeric Grade,Letter Grade\n'
  const rows = students
    .map(
      (s) =>
        `"${s.studentName}","${s.courseName}",${s.numericGrade.toFixed(1)},${s.letterGrade}`
    )
    .join('\n')

  const csv = header + rows
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `at-risk-students-${schoolId}-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ============================================================================
// AGGREGATE HOOK — queries all section grades and combines
// ============================================================================

function useAggregatedGrades(schoolId: string, sections: SectionResponseDto[]) {
  // Query the first 20 active sections (reasonable dashboard scope)
  const sectionIds = useMemo(
    () => sections.slice(0, 20).map((s) => s.sectionId),
    [sections]
  )

  // Use useQueries for dynamic parallel queries (avoids hooks-in-loop)
  const gradeQueries = useQueries({
    queries: sectionIds.map((sid) => ({
      queryKey: gradeKeys.sectionGrade(sid, { schoolId }),
      queryFn: () => getSectionGrades(sid, { schoolId }),
      enabled: !!sid && !!schoolId,
      staleTime: 60 * 1000,
    })),
  })

  const isLoading = gradeQueries.some((q) => q.isLoading)
  const hasError = gradeQueries.some((q) => q.isError)

  const aggregated = useMemo(() => {
    if (isLoading) return null

    const allGrades = gradeQueries
      .flatMap((q) => (q.data as SectionGradebookResponse | undefined)?.grades ?? [])

    if (allGrades.length === 0) return null

    // Grade distribution buckets
    const distribution = [
      { range: 'A (90-100)', count: 0 },
      { range: 'B (80-89)', count: 0 },
      { range: 'C (70-79)', count: 0 },
      { range: 'D (60-69)', count: 0 },
      { range: 'F (0-59)', count: 0 },
    ]
    let totalGrade = 0
    let totalGpa = 0
    let passCount = 0
    const atRisk: AtRiskStudent[] = []
    const courseMap = new Map<string, {
      courseId: string
      courseName: string
      sectionIds: Set<string>
      grades: number[]
      gpas: number[]
      passCount: number
    }>()

    for (const grade of allGrades) {
      const pct = grade.numericGrade
      totalGrade += pct
      totalGpa += grade.gpaPoints
      if (pct >= 60) passCount++

      // Distribution
      if (pct >= 90) distribution[0].count++
      else if (pct >= 80) distribution[1].count++
      else if (pct >= 70) distribution[2].count++
      else if (pct >= 60) distribution[3].count++
      else distribution[4].count++

      // At-risk (below 60%)
      if (pct < 60) {
        const section = sections.find((s) => s.sectionId === grade.sectionId)
        atRisk.push({
          studentId: grade.studentId,
          studentName: grade.studentName || grade.studentId.slice(0, 8),
          courseId: grade.courseId,
          courseName: section?.courseName || grade.courseId.slice(0, 12),
          numericGrade: pct,
          letterGrade: grade.letterGrade,
        })
      }

      // Course aggregation
      const existing = courseMap.get(grade.courseId)
      if (existing) {
        existing.grades.push(pct)
        existing.gpas.push(grade.gpaPoints)
        if (pct >= 60) existing.passCount++
        if (grade.sectionId) existing.sectionIds.add(grade.sectionId)
      } else {
        const section = sections.find((s) => s.sectionId === grade.sectionId)
        courseMap.set(grade.courseId, {
          courseId: grade.courseId,
          courseName: section?.courseName || grade.courseId.slice(0, 12),
          sectionIds: new Set(grade.sectionId ? [grade.sectionId] : []),
          grades: [pct],
          gpas: [grade.gpaPoints],
          passCount: pct >= 60 ? 1 : 0,
        })
      }
    }

    const coursePerformance: CoursePerformance[] = Array.from(courseMap.values())
      .map((c) => ({
        courseId: c.courseId,
        courseName: c.courseName,
        sectionCount: c.sectionIds.size,
        studentCount: c.grades.length,
        avgGrade: c.grades.reduce((a, b) => a + b, 0) / c.grades.length,
        avgGpa: c.gpas.reduce((a, b) => a + b, 0) / c.gpas.length,
        passRate: (c.passCount / c.grades.length) * 100,
      }))
      .sort((a, b) => b.avgGrade - a.avgGrade)

    const sortedAtRisk = [...atRisk].sort((a, b) => a.numericGrade - b.numericGrade)

    return {
      totalStudents: allGrades.length,
      avgGrade: totalGrade / allGrades.length,
      avgGpa: totalGpa / allGrades.length,
      passRate: (passCount / allGrades.length) * 100,
      atRiskCount: atRisk.length,
      distribution,
      coursePerformance,
      atRisk: sortedAtRisk,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, sections])

  return { data: aggregated, isLoading, hasError }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function GradeDashboard({
  schoolId,
  academicYearId: _academicYearId,
  sections,
}: GradeDashboardProps) {
  const { data, isLoading, hasError } = useAggregatedGrades(schoolId, sections)

  const handleExport = useCallback(() => {
    if (data?.atRisk && data.atRisk.length > 0) {
      exportAtRiskCsv(data.atRisk, schoolId)
    }
  }, [data, schoolId])

  if (hasError) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-6 text-sm text-red-700 dark:text-red-400 text-center">
        Failed to load grade data. Please try refreshing.
      </div>
    )
  }

  if (!sections.length) {
    return (
      <div className="py-16 text-center">
        <GraduationCap className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
        <h4 className="text-lg font-medium text-text-primary mb-2">
          No Active Sections
        </h4>
        <p className="text-text-secondary max-w-md mx-auto">
          Grade analytics will appear here once sections have been created and grades recorded.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleExport}
          disabled={!data?.atRisk?.length}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-surface-secondary border border-border-secondary text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Export At-Risk CSV
        </button>
      </div>

      {/* Summary Stat Cards */}
      {isLoading ? (
        <SkeletonCards />
      ) : !data ? (
        <div className="py-12 text-center">
          <GraduationCap className="w-10 h-10 mx-auto text-text-tertiary mb-3" />
          <p className="text-sm text-text-secondary">No grades recorded yet across sections.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Users}
              label="Students Graded"
              value={data.totalStudents}
              subValue={`Across ${sections.length} section${sections.length !== 1 ? 's' : ''}`}
              accent="text-blue-600 dark:text-blue-400"
              bg="bg-blue-500/10"
            />
            <StatCard
              icon={Award}
              label="Average GPA"
              value={data.avgGpa.toFixed(2)}
              subValue={`Avg grade: ${data.avgGrade.toFixed(1)}%`}
              accent="text-emerald-600 dark:text-emerald-400"
              bg="bg-emerald-500/10"
            />
            <StatCard
              icon={TrendingUp}
              label="Pass Rate"
              value={`${data.passRate.toFixed(1)}%`}
              subValue="Students scoring 60%+"
              accent="text-teal-600 dark:text-teal-400"
              bg="bg-teal-500/10"
            />
            <StatCard
              icon={AlertTriangle}
              label="At Risk"
              value={data.atRiskCount}
              subValue="Below 60% threshold"
              accent="text-red-600 dark:text-red-400"
              bg="bg-red-500/10"
            />
          </div>

          {/* Grade Distribution Chart */}
          <div className="bg-surface-primary rounded-xl border border-border-secondary p-5">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-4 h-4 text-teal-500" />
              <h3 className="text-sm font-semibold text-text-primary">
                Grade Distribution
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={data.distribution}
                margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border-secondary, #e5e7eb)"
                  vertical={false}
                />
                <XAxis
                  dataKey="range"
                  tick={{ fontSize: 11, fill: 'var(--color-text-tertiary, #9ca3af)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--color-text-tertiary, #9ca3af)' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {data.distribution.map((_, index) => (
                    <Cell key={index} fill={DISTRIBUTION_COLORS[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Course Performance Table */}
          {data.coursePerformance.length > 0 && (
            <div className="bg-surface-primary rounded-xl border border-border-secondary p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3">
                Course Performance
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-secondary">
                      <th className="text-left py-2 pr-4 text-text-tertiary font-medium">Course</th>
                      <th className="text-right py-2 px-4 text-text-tertiary font-medium">Sections</th>
                      <th className="text-right py-2 px-4 text-text-tertiary font-medium">Students</th>
                      <th className="text-right py-2 px-4 text-text-tertiary font-medium">Avg Grade</th>
                      <th className="text-right py-2 px-4 text-text-tertiary font-medium">Avg GPA</th>
                      <th className="text-right py-2 pl-4 text-text-tertiary font-medium">Pass Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.coursePerformance.map((course) => (
                      <tr key={course.courseId} className="border-b border-border-secondary last:border-b-0">
                        <td className="py-2.5 pr-4 text-text-primary font-medium">
                          {course.courseName}
                        </td>
                        <td className="py-2.5 px-4 text-right text-text-secondary">
                          {course.sectionCount}
                        </td>
                        <td className="py-2.5 px-4 text-right text-text-secondary">
                          {course.studentCount}
                        </td>
                        <td className={`py-2.5 px-4 text-right font-medium ${getGradeColor(course.avgGrade)}`}>
                          {course.avgGrade.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-4 text-right text-text-secondary">
                          {course.avgGpa.toFixed(2)}
                        </td>
                        <td className={`py-2.5 pl-4 text-right font-medium ${getGradeColor(course.passRate)}`}>
                          {course.passRate.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* At-Risk Students */}
          <div className="bg-surface-primary rounded-xl border border-border-secondary p-5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-text-primary">
                  At-Risk Students
                </h3>
              </div>
              {data.atRisk.length > 0 && (
                <span className="text-xs text-text-tertiary">
                  {data.atRisk.length} student{data.atRisk.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-xs text-text-tertiary mb-4">
              Students scoring below 60% in any course
            </p>

            {data.atRisk.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle className="w-10 h-10 mx-auto text-emerald-500 mb-3" />
                <p className="text-sm text-text-secondary">
                  No students below the grade threshold
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-secondary">
                      <th className="text-left py-2 pr-4 text-text-tertiary font-medium">Student</th>
                      <th className="text-left py-2 px-4 text-text-tertiary font-medium">Course</th>
                      <th className="text-right py-2 px-4 text-text-tertiary font-medium">Grade</th>
                      <th className="text-right py-2 pl-4 text-text-tertiary font-medium">Letter</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.atRisk.map((student, i) => (
                      <tr key={`${student.studentId}-${student.courseId}-${i}`} className="border-b border-border-secondary last:border-b-0">
                        <td className="py-2.5 pr-4 text-text-primary font-medium">
                          {student.studentName}
                        </td>
                        <td className="py-2.5 px-4 text-text-secondary">
                          {student.courseName}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
                            {student.numericGrade.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2.5 pl-4 text-right font-bold text-red-600 dark:text-red-400">
                          {student.letterGrade}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default GradeDashboard
