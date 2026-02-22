/**
 * Grade Overview
 *
 * School-wide grade analytics dashboard showing:
 * - Academic year context bar with 3-dot actions menu
 * - Summary stat cards (avg GPA, pass rate, at-risk count, total graded)
 * - Grading completion donut chart
 * - Assessment type performance with ring indicators
 * - Grade distribution bar chart
 * - Category & course performance tables
 * - At-risk students table (below 60%)
 *
 * Data is fetched from a single backend aggregation endpoint.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Download,
  Users,
  Award,
  BookOpen,
  ClipboardList,
  Layers,
  MoreHorizontal,
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
  PieChart,
  Pie,
} from 'recharts'
import { useGradeOverview } from '../../hooks/useGrades'
import type { GradeOverviewResponse } from '../../services/academics.service'

// ============================================================================
// TYPES
// ============================================================================

interface GradeOverviewProps {
  schoolId: string
  academicYearId: string
}

type AtRiskStudent = GradeOverviewResponse['atRiskStudents'][number]

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
// ACTIONS DROPDOWN (3-dot menu)
// ============================================================================

function ActionsDropdown({
  onExportGradebook,
  onExportAtRisk,
  gradebookDisabled,
  atRiskDisabled,
}: {
  onExportGradebook: () => void
  onExportAtRisk: () => void
  gradebookDisabled: boolean
  atRiskDisabled: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
        aria-label="More actions"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-surface-primary border border-border-secondary rounded-xl shadow-lg z-20 py-1 overflow-hidden">
          <button
            type="button"
            onClick={() => { onExportGradebook(); setOpen(false) }}
            disabled={gradebookDisabled}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export Gradebook CSV
          </button>
          <button
            type="button"
            onClick={() => { onExportAtRisk(); setOpen(false) }}
            disabled={atRiskDisabled}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export At-Risk CSV
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// ASSESSMENT RING (SVG circular progress)
// ============================================================================

function AssessmentRing({
  percentage,
  size = 80,
  strokeWidth = 6,
  color,
}: {
  percentage: number
  size?: number
  strokeWidth?: number
  color: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-border-secondary, #e5e7eb)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
    </svg>
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
        `"${s.studentName}","${s.courseName}",${s.numericGrade.toFixed(1)},${s.letterGrade ?? ''}`
    )
    .join('\n')

  const csv = header + rows
  downloadCsv(csv, `at-risk-students-${schoolId}-${new Date().toISOString().split('T')[0]}.csv`)
}

function exportFullGradebookCsv(data: GradeOverviewResponse, schoolId: string) {
  const header = 'Course,Students,Avg Grade,Avg GPA,Pass Rate\n'
  const rows = data.coursePerformance
    .map(
      (c) =>
        `"${c.courseName}",${c.studentCount},${c.avgGrade.toFixed(1)}%,${c.avgGpa.toFixed(2)},${c.passRate.toFixed(1)}%`
    )
    .join('\n')

  const csv = header + rows
  downloadCsv(csv, `gradebook-overview-${schoolId}-${new Date().toISOString().split('T')[0]}.csv`)
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function GradeOverview({
  schoolId,
  academicYearId,
}: GradeOverviewProps) {
  const { data, isLoading, isError } = useGradeOverview(schoolId, academicYearId)

  const handleExportAtRisk = useCallback(() => {
    if (data?.atRiskStudents && data.atRiskStudents.length > 0) {
      exportAtRiskCsv(data.atRiskStudents, schoolId)
    }
  }, [data, schoolId])

  const handleExportGradebook = useCallback(() => {
    if (data && data.coursePerformance.length > 0) {
      exportFullGradebookCsv(data, schoolId)
    }
  }, [data, schoolId])

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-6 text-sm text-red-700 dark:text-red-400 text-center">
        Failed to load grade data. Please try refreshing.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stat Cards */}
      {isLoading ? (
        <SkeletonCards />
      ) : !data || data.totalStudentsGraded === 0 ? (
        <div className="py-12 text-center">
          <GraduationCap className="w-10 h-10 mx-auto text-text-tertiary mb-3" />
          <p className="text-sm text-text-secondary">No grades recorded yet across sections.</p>
        </div>
      ) : (
        <>
          {/* Actions */}
          <div className="flex justify-end">
            <ActionsDropdown
              onExportGradebook={handleExportGradebook}
              onExportAtRisk={handleExportAtRisk}
              gradebookDisabled={!data.coursePerformance?.length}
              atRiskDisabled={!data.atRiskStudents?.length}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Users}
              label="Students Graded"
              value={data.totalStudentsGraded}
              subValue={`Across ${data.totalSections} section${data.totalSections !== 1 ? 's' : ''}`}
              accent="text-blue-600 dark:text-blue-400"
              bg="bg-blue-500/10"
            />
            <StatCard
              icon={Award}
              label="Average GPA"
              value={data.averageGpa.toFixed(2)}
              subValue={`Avg grade: ${data.averageGrade.toFixed(1)}%`}
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

          {/* Grading Completion + Assessment Performance — side by side on lg */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Grading Completion — Donut Chart */}
            {data.gradingProgress && data.gradingProgress.totalAssignmentEntries > 0 && (
              <div className="bg-surface-primary rounded-xl border border-border-secondary p-5">
                <div className="flex items-center gap-2 mb-1">
                  <ClipboardList className="w-4 h-4 text-violet-500" />
                  <h3 className="text-sm font-semibold text-text-primary">
                    Grading Completion
                  </h3>
                </div>
                <p className="text-xs text-text-tertiary mb-5">
                  Assignment entries graded across all active sections
                </p>

                <div className="flex items-center gap-8">
                  {/* Donut */}
                  <div className="relative flex-shrink-0">
                    <ResponsiveContainer width={150} height={150}>
                      <PieChart>
                        <Pie
                          data={[
                            { value: data.gradingProgress.gradedEntries },
                            { value: data.gradingProgress.ungradedStubs },
                          ]}
                          innerRadius={50}
                          outerRadius={68}
                          paddingAngle={data.gradingProgress.ungradedStubs > 0 ? 3 : 0}
                          dataKey="value"
                          startAngle={90}
                          endAngle={-270}
                          stroke="none"
                        >
                          <Cell fill="#8b5cf6" />
                          <Cell fill="var(--color-surface-hover, #e5e7eb)" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-text-primary">
                        {data.gradingProgress.completionRate.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-violet-500 flex-shrink-0" />
                      <span className="text-sm text-text-secondary">Graded</span>
                      <span className="text-sm font-semibold text-text-primary ml-auto">
                        {data.gradingProgress.gradedEntries}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                      <span className="text-sm text-text-secondary">Remaining</span>
                      <span className="text-sm font-semibold text-text-primary ml-auto">
                        {data.gradingProgress.ungradedStubs}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-border-secondary">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-text-tertiary">Total entries</span>
                        <span className="text-xs font-semibold text-text-primary ml-auto">
                          {data.gradingProgress.totalAssignmentEntries}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Assessment Type Performance — Ring Indicators */}
            {data.assessmentBreakdown && (data.assessmentBreakdown.formative.count > 0 || data.assessmentBreakdown.summative.count > 0) && (
              <div className="bg-surface-primary rounded-xl border border-border-secondary p-5">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-semibold text-text-primary">
                    Assessment Performance
                  </h3>
                </div>
                <p className="text-xs text-text-tertiary mb-5">
                  Average scores by assessment type
                </p>

                <div className="grid grid-cols-2 gap-6">
                  {/* Formative */}
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-3">
                      <AssessmentRing
                        percentage={data.assessmentBreakdown.formative.count > 0 ? data.assessmentBreakdown.formative.avgScore : 0}
                        size={88}
                        strokeWidth={7}
                        color={data.assessmentBreakdown.formative.count > 0 ? '#6366f1' : '#d1d5db'}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-base font-bold ${data.assessmentBreakdown.formative.count > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-text-tertiary'}`}>
                          {data.assessmentBreakdown.formative.count > 0
                            ? `${data.assessmentBreakdown.formative.avgScore.toFixed(0)}%`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <h4 className="text-sm font-semibold text-text-primary">Formative</h4>
                      <span className="px-1.5 py-0.5 text-[10px] font-medium leading-none bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full">
                        {data.assessmentBreakdown.formative.count}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-tertiary leading-tight">
                      Quizzes, homework, participation
                    </p>
                  </div>

                  {/* Summative */}
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-3">
                      <AssessmentRing
                        percentage={data.assessmentBreakdown.summative.count > 0 ? data.assessmentBreakdown.summative.avgScore : 0}
                        size={88}
                        strokeWidth={7}
                        color={data.assessmentBreakdown.summative.count > 0 ? '#0d9488' : '#d1d5db'}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-base font-bold ${data.assessmentBreakdown.summative.count > 0 ? 'text-teal-600 dark:text-teal-400' : 'text-text-tertiary'}`}>
                          {data.assessmentBreakdown.summative.count > 0
                            ? `${data.assessmentBreakdown.summative.avgScore.toFixed(0)}%`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <h4 className="text-sm font-semibold text-text-primary">Summative</h4>
                      <span className="px-1.5 py-0.5 text-[10px] font-medium leading-none bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-full">
                        {data.assessmentBreakdown.summative.count}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-tertiary leading-tight">
                      Tests, exams, projects
                    </p>
                  </div>
                </div>

                {/* Comparison insight */}
                {data.assessmentBreakdown.formative.count > 0 && data.assessmentBreakdown.summative.count > 0 && (
                  <p className="text-xs text-text-secondary mt-4 pt-3 border-t border-border-secondary text-center">
                    {data.assessmentBreakdown.formative.avgScore > data.assessmentBreakdown.summative.avgScore
                      ? `Students score ${(data.assessmentBreakdown.formative.avgScore - data.assessmentBreakdown.summative.avgScore).toFixed(1)}% higher on formative than summative`
                      : data.assessmentBreakdown.summative.avgScore > data.assessmentBreakdown.formative.avgScore
                        ? `Students score ${(data.assessmentBreakdown.summative.avgScore - data.assessmentBreakdown.formative.avgScore).toFixed(1)}% higher on summative than formative`
                        : 'Formative and summative scores are equal'}
                  </p>
                )}
                {data.assessmentBreakdown.unclassified.count > 0 && (
                  <p className="text-[11px] text-text-tertiary mt-2 text-center">
                    +{data.assessmentBreakdown.unclassified.count} unclassified (avg {data.assessmentBreakdown.unclassified.avgScore.toFixed(1)}%)
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Grade Distribution Chart */}
          <div className="bg-surface-primary rounded-xl border border-border-secondary p-5">
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="w-4 h-4 text-teal-500" />
              <h3 className="text-sm font-semibold text-text-primary">
                Grade Distribution
              </h3>
            </div>
            <p className="text-xs text-text-tertiary mb-4">
              Number of students in each grade range based on their overall course averages
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={data.gradeDistribution}
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
                  {data.gradeDistribution.map((_, index) => (
                    <Cell key={index} fill={DISTRIBUTION_COLORS[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Performance */}
          {data.categoryPerformance && data.categoryPerformance.length > 0 && (
            <div className="bg-surface-primary rounded-xl border border-border-secondary p-5">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-text-primary">
                  Category Performance
                </h3>
              </div>
              <p className="text-xs text-text-tertiary mb-3">
                Average scores by grading policy category (e.g. homework, exams, projects)
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-secondary">
                      <th className="text-left py-2 pr-4 text-text-tertiary font-medium">Category</th>
                      <th className="text-right py-2 px-4 text-text-tertiary font-medium">Assignments</th>
                      <th className="text-right py-2 pl-4 text-text-tertiary font-medium">Avg Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.categoryPerformance.map((cat) => (
                      <tr key={cat.categoryId} className="border-b border-border-secondary last:border-b-0">
                        <td className="py-2.5 pr-4 text-text-primary font-medium capitalize">
                          {cat.categoryName}
                        </td>
                        <td className="py-2.5 px-4 text-right text-text-secondary">
                          {cat.assignmentCount}
                        </td>
                        <td className={`py-2.5 pl-4 text-right font-medium ${getGradeColor(cat.avgScore)}`}>
                          {cat.avgScore.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Course Performance Table */}
          {data.coursePerformance.length > 0 && (
            <div className="bg-surface-primary rounded-xl border border-border-secondary p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-1">
                Course Performance
              </h3>
              <p className="text-xs text-text-tertiary mb-3">
                Aggregated grade metrics for each course across all its sections
              </p>
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
              {data.atRiskStudents.length > 0 && (
                <span className="text-xs text-text-tertiary">
                  {data.atRiskStudents.length} student{data.atRiskStudents.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-xs text-text-tertiary mb-4">
              Students scoring below 60% in any course
            </p>

            {data.atRiskStudents.length === 0 ? (
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
                    {data.atRiskStudents.map((student, i) => (
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

export default GradeOverview
