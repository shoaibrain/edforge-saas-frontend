/**
 * Parent Portal — Child's Grades Page
 *
 * Displays grades for the currently selected child.
 * Reuses same API as student portal, scoped to activeChild from ParentPortalContext.
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../../lib/api'
import { useAppStore } from '../../stores/app.store'
import { useShell } from '../../lib/shell-context'
import { useParentPortal } from './ParentPortalLayout'
import { Card, CardContent, CardHeader, Skeleton } from '@edforge/ui'
import { GraduationCap, TrendingUp, BookOpen, Award } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface GradeResponseDto {
  gradeId: string
  courseId: string
  courseName: string
  termId?: string
  numericGrade?: number
  letterGrade?: string
  gpaPoints?: number
  credits?: number
  isFinal?: boolean
}

interface GpaResult {
  cumulativeGpa: number | null
  weightedGpa?: number | null
  totalCredits: number
  termGpas?: Array<{ termId: string; termName?: string; gpa: number; credits: number }>
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

export default function ParentGradesPage() {
  const { activeChild } = useParentPortal()
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const { activeSchoolYear } = useShell()

  const studentId = activeChild?.studentId

  const { data, isLoading } = useQuery({
    queryKey: ['parent-child-grades-detail', studentId, activeSchoolId, activeSchoolYear?.id],
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

  if (!activeChild) {
    return (
      <div className="p-6">
        <p className="text-sm text-[rgb(var(--text-secondary))]">Please select a child to view grades.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  const grades = data?.grades ?? []
  const gpa = data?.gpa

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
        {activeChild.firstName}'s Grades
      </h1>

      {/* GPA Summary */}
      {gpa && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Cumulative GPA" value={gpa.cumulativeGpa != null ? gpa.cumulativeGpa.toFixed(2) : '-'} color="teal" />
          {gpa.weightedGpa != null && (
            <StatCard icon={<Award className="w-5 h-5" />} label="Weighted GPA" value={gpa.weightedGpa.toFixed(2)} color="blue" />
          )}
          <StatCard icon={<BookOpen className="w-5 h-5" />} label="Total Credits" value={(gpa.totalCredits ?? 0).toString()} color="purple" />
          <StatCard icon={<GraduationCap className="w-5 h-5" />} label="Courses" value={grades.length.toString()} color="amber" />
        </div>
      )}

      {/* Grades Table */}
      {grades.length > 0 ? (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
              Course Grades
              {activeSchoolYear && (
                <span className="text-sm font-normal text-[rgb(var(--text-secondary))] ml-2">{activeSchoolYear.name}</span>
              )}
            </h2>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgb(var(--border-primary))]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">Course</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">Grade</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">Numeric</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">GPA Pts</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">Credits</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgb(var(--border-primary))]">
                  {grades.map((grade) => (
                    <tr key={grade.gradeId} className="hover:bg-[rgb(var(--surface-secondary))]">
                      <td className="px-4 py-3 text-sm font-medium text-[rgb(var(--text-primary))]">{grade.courseName}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className={getLetterGradeClass(grade.letterGrade)}>{grade.letterGrade ?? '-'}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-[rgb(var(--text-secondary))]">{grade.numericGrade?.toFixed(1) ?? '-'}</td>
                      <td className="px-4 py-3 text-sm text-center text-[rgb(var(--text-secondary))]">{grade.gpaPoints?.toFixed(2) ?? '-'}</td>
                      <td className="px-4 py-3 text-sm text-center text-[rgb(var(--text-secondary))]">{grade.credits ?? '-'}</td>
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
        <Card>
          <CardContent className="py-16 text-center">
            <GraduationCap className="w-12 h-12 text-[rgb(var(--text-tertiary))] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[rgb(var(--text-primary))] mb-2">No Grades Yet</h3>
            <p className="text-sm text-[rgb(var(--text-secondary))]">Grades will appear here once they are recorded.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: 'teal' | 'blue' | 'purple' | 'amber' }) {
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
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>{icon}</div>
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
  const n = status.toLowerCase()
  let cls = 'inline-flex px-2 py-0.5 rounded-full text-xs font-medium '
  if (n === 'final' || n === 'completed') cls += 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  else if (n === 'in_progress' || n === 'active') cls += 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
  else cls += 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  return <span className={cls}>{status}</span>
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
