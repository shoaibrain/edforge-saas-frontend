/**
 * Student Portal — My Grades Page
 *
 * Displays the authenticated student's grades and GPA summary.
 * Data: GET /academics/students/:studentId/grades?schoolId=...&academicYearId=...
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../../lib/api'
import { useAppStore } from '../../stores/app.store'
import { useShell } from '../../lib/shell-context'
import { useStudentPortal } from './StudentPortalLayout'
import { Card, CardContent, CardHeader, Skeleton } from '@edforge/ui'
import { GraduationCap, TrendingUp, BookOpen, Award } from 'lucide-react'

// ============================================================================
// TYPES
// Note: These match backend DTOs. Once @aibrains/shared-types is linked as a
// local workspace dependency (not npm), replace with shared type imports.
// ============================================================================

interface GradeResponseDto {
  gradeId: string
  studentId: string
  courseId: string
  courseName: string
  sectionId?: string
  teacherId?: string
  academicYearId: string
  termId?: string
  numericGrade?: number
  letterGrade?: string
  gpaPoints?: number
  credits?: number
  isFinal?: boolean
}

interface GpaResult {
  studentId: string
  academicYearId: string
  cumulativeGpa: number | null
  weightedGpa?: number | null
  totalCredits: number
  termGpas?: Array<{
    termId: string
    termName?: string
    gpa: number
    credits: number
  }>
}

interface StudentGradesResponse {
  studentId: string
  academicYearId: string
  grades: GradeResponseDto[]
  gpa: GpaResult | null
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function StudentGradesPage() {
  const { studentId } = useStudentPortal()
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const { activeSchoolYear } = useShell()

  const { data, isLoading, error } = useQuery({
    queryKey: ['student-grades', studentId, activeSchoolId, activeSchoolYear?.id],
    queryFn: () =>
      apiGet<StudentGradesResponse>(
        `/academics/students/${studentId}/grades`,
        {
          schoolId: activeSchoolId,
          ...(activeSchoolYear?.id && { academicYearId: activeSchoolYear.id }),
        }
      ),
    enabled: !!studentId && !!activeSchoolId,
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <EmptyState
          title="Unable to Load Grades"
          description="There was an error loading your grades. Please try again later."
        />
      </div>
    )
  }

  const grades = data?.grades ?? []
  const gpa = data?.gpa

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
        My Grades
      </h1>

      {/* GPA Summary Cards */}
      {gpa && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Cumulative GPA"
            value={gpa.cumulativeGpa != null ? gpa.cumulativeGpa.toFixed(2) : '-'}
            color="teal"
          />
          {gpa.weightedGpa != null && (
            <StatCard
              icon={<Award className="w-5 h-5" />}
              label="Weighted GPA"
              value={gpa.weightedGpa.toFixed(2)}
              color="blue"
            />
          )}
          <StatCard
            icon={<BookOpen className="w-5 h-5" />}
            label="Total Credits"
            value={(gpa.totalCredits ?? 0).toString()}
            color="purple"
          />
          <StatCard
            icon={<GraduationCap className="w-5 h-5" />}
            label="Courses"
            value={grades.length.toString()}
            color="amber"
          />
        </div>
      )}

      {/* Grades Table */}
      {grades.length > 0 ? (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
              Course Grades
              {activeSchoolYear && (
                <span className="text-sm font-normal text-[rgb(var(--text-secondary))] ml-2">
                  {activeSchoolYear.name}
                </span>
              )}
            </h2>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgb(var(--border-primary))]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                      Course
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                      Numeric
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                      GPA Points
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgb(var(--border-primary))]">
                  {grades.map((grade) => (
                    <tr key={grade.gradeId} className="hover:bg-[rgb(var(--surface-secondary))]">
                      <td className="px-4 py-3 text-sm font-medium text-[rgb(var(--text-primary))]">
                        {grade.courseName}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className={getLetterGradeClass(grade.letterGrade)}>
                          {grade.letterGrade ?? '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-[rgb(var(--text-secondary))]">
                        {grade.numericGrade != null ? grade.numericGrade.toFixed(1) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-[rgb(var(--text-secondary))]">
                        {grade.gpaPoints != null ? grade.gpaPoints.toFixed(2) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-[rgb(var(--text-secondary))]">
                        {grade.credits ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <StatusBadge status={grade.isFinal ? 'Final' : 'In Progress'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          title="No Grades Yet"
          description="Your grades will appear here once they are recorded by your teachers."
        />
      )}

      {/* Term GPA Breakdown */}
      {gpa?.termGpas && gpa.termGpas.length > 1 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
              GPA by Term
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gpa.termGpas.map((term) => (
                <div
                  key={term.termId}
                  className="p-4 rounded-lg bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))]"
                >
                  <p className="text-sm text-[rgb(var(--text-secondary))]">
                    {term.termName ?? term.termId}
                  </p>
                  <p className="text-2xl font-bold text-[rgb(var(--text-primary))] mt-1">
                    {(term.gpa ?? 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
                    {term.credits} credits
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: 'teal' | 'blue' | 'purple' | 'amber'
}) {
  const colorMap = {
    teal: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
            {icon}
          </div>
          <div>
            <p className="text-xs text-[rgb(var(--text-secondary))]">{label}</p>
            <p className="text-xl font-bold text-[rgb(var(--text-primary))]">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">-</span>
  const normalized = status.toLowerCase()
  let className = 'inline-flex px-2 py-0.5 rounded-full text-xs font-medium '

  if (normalized === 'final' || normalized === 'completed') {
    className += 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  } else if (normalized === 'in_progress' || normalized === 'active') {
    className += 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
  } else if (normalized === 'incomplete' || normalized === 'missing') {
    className += 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  } else {
    className += 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }

  return <span className={className}>{status}</span>
}

function getLetterGradeClass(grade?: string | null): string {
  if (!grade) return 'text-[rgb(var(--text-secondary))]'
  const base = 'inline-flex px-2 py-0.5 rounded text-sm font-semibold '
  if (grade.startsWith('A')) return base + 'text-green-700 dark:text-green-400'
  if (grade.startsWith('B')) return base + 'text-blue-700 dark:text-blue-400'
  if (grade.startsWith('C')) return base + 'text-amber-700 dark:text-amber-400'
  if (grade.startsWith('D')) return base + 'text-orange-700 dark:text-orange-400'
  if (grade.startsWith('F')) return base + 'text-red-700 dark:text-red-400'
  return base + 'text-[rgb(var(--text-primary))]'
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardContent className="py-16 text-center">
        <GraduationCap className="w-12 h-12 text-[rgb(var(--text-tertiary))] mx-auto mb-4" />
        <h3 className="text-lg font-medium text-[rgb(var(--text-primary))] mb-2">{title}</h3>
        <p className="text-sm text-[rgb(var(--text-secondary))] max-w-sm mx-auto">{description}</p>
      </CardContent>
    </Card>
  )
}
