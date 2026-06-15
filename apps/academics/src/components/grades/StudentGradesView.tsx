/**
 * @deprecated This component has been superseded by the OverviewTab academic dashboard
 * which includes grade summary inline. Kept for standalone route use if needed.
 *
 * StudentGradesView Component
 *
 * Displays a student's grades across all courses with GPA summary.
 * Can be embedded in student profile or used as a standalone route.
 */

import {
  GraduationCap,
  BookOpen,
  Lock,
} from 'lucide-react'
import { UuidBadge } from '@edforge/archetype'
import { useStudentGrades } from '../../hooks/useGrades'

// ============================================================================
// TYPES
// ============================================================================

interface StudentGradesViewProps {
  studentId: string
  academicYearId?: string
  termId?: string
}

// ============================================================================
// HELPERS
// ============================================================================

function getLetterGradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'text-[rgb(var(--state-success-fg))]'
  if (grade.startsWith('B')) return 'text-[rgb(var(--state-info-fg))]'
  if (grade.startsWith('C')) return 'text-[rgb(var(--state-warning-fg))]'
  if (grade.startsWith('D')) return 'text-[rgb(var(--state-warning-fg))]'
  return 'text-[rgb(var(--state-danger-fg))]'
}

function getGpaBadge(gpa: number): { bg: string; text: string } {
  if (gpa >= 3.5) return { bg: 'bg-[rgb(var(--state-success-bg)/0.18)] dark:bg-[rgb(var(--state-success-fg)/0.2)]', text: 'text-[rgb(var(--state-success-fg))] ' }
  if (gpa >= 3.0) return { bg: 'bg-[rgb(var(--state-info-bg)/0.18)] dark:bg-[rgb(var(--state-info-fg))]/20', text: 'text-[rgb(var(--state-info-fg))]' }
  if (gpa >= 2.0) return { bg: 'bg-[rgb(var(--state-warning-bg)/0.18)] dark:bg-[rgb(var(--state-warning-fg))]/20', text: 'text-[rgb(var(--state-warning-fg))]' }
  return { bg: 'bg-[rgb(var(--state-danger-bg)/0.18)] dark:bg-[rgb(var(--state-danger-fg)/0.2)]', text: 'text-[rgb(var(--state-danger-fg))] ' }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function StudentGradesView({
  studentId,
  academicYearId,
  termId,
}: StudentGradesViewProps) {
  const { data, isLoading } = useStudentGrades(
    studentId,
    { academicYearId, termId },
    !!studentId
  )

  const grades = data?.grades ?? []
  const gpa = data?.gpa

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-surface-secondary rounded-xl animate-pulse" />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-surface-secondary rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (grades.length === 0) {
    return (
      <div className="py-12 text-center">
        <GraduationCap className="w-10 h-10 mx-auto text-text-tertiary mb-3" />
        <h4 className="text-sm font-medium text-text-primary mb-1">
          No grades recorded
        </h4>
        <p className="text-xs text-text-tertiary max-w-xs mx-auto">
          Grades will appear here once they are recorded by teachers.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* GPA Summary */}
      {gpa && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface-secondary rounded-xl border border-border-secondary p-4 text-center">
            <p className="text-xs text-text-tertiary mb-1">Term GPA</p>
            <p className={`text-2xl font-bold ${gpa.termGpa != null ? getGpaBadge(gpa.termGpa).text : 'text-text-tertiary'}`}>
              {gpa.termGpa != null ? gpa.termGpa.toFixed(2) : '—'}
            </p>
          </div>
          <div className="bg-surface-secondary rounded-xl border border-border-secondary p-4 text-center">
            <p className="text-xs text-text-tertiary mb-1">Cumulative GPA</p>
            <p className={`text-2xl font-bold ${gpa.cumulativeGpa != null ? getGpaBadge(gpa.cumulativeGpa).text : 'text-text-tertiary'}`}>
              {gpa.cumulativeGpa != null ? gpa.cumulativeGpa.toFixed(2) : '—'}
            </p>
          </div>
          <div className="bg-surface-secondary rounded-xl border border-border-secondary p-4 text-center">
            <p className="text-xs text-text-tertiary mb-1">Weighted GPA</p>
            <p className={`text-2xl font-bold ${gpa.weightedGpa != null ? getGpaBadge(gpa.weightedGpa).text : 'text-text-tertiary'}`}>
              {gpa.weightedGpa != null ? gpa.weightedGpa.toFixed(2) : '—'}
            </p>
          </div>
        </div>
      )}

      {/* Course Grades List */}
      <div className="rounded-xl border border-border-secondary overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-secondary">
              <th className="px-4 py-3 text-left font-semibold text-text-primary">Course</th>
              <th className="px-4 py-3 text-center font-medium text-text-secondary">Numeric</th>
              <th className="px-4 py-3 text-center font-medium text-text-secondary">Letter</th>
              <th className="px-4 py-3 text-center font-medium text-text-secondary">GPA Points</th>
              <th className="px-4 py-3 text-center font-medium text-text-secondary">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-secondary">
            {grades.map((grade) => (
              <tr key={grade.gradeId} className="hover:bg-surface-secondary/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-text-tertiary" />
                    <span className="font-medium text-text-primary">
                      {grade.courseName || <UuidBadge value={grade.courseId} />}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="font-semibold text-text-primary">
                    {grade.numericGrade != null ? `${grade.numericGrade.toFixed(1)}%` : '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {grade.letterGrade ? (
                    <span className={`font-bold text-lg ${getLetterGradeColor(grade.letterGrade)}`}>
                      {grade.letterGrade}
                    </span>
                  ) : (
                    <span className="text-text-tertiary">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center text-text-secondary">
                  {grade.gpaPoints != null ? grade.gpaPoints.toFixed(1) : '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  {grade.isFinal ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-[rgb(var(--state-success-fg))] bg-[rgb(var(--state-success-bg)/0.18)] dark:bg-[rgb(var(--state-success-fg)/0.2)]  rounded-full">
                      <Lock className="w-3 h-3" />
                      Final
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs font-medium text-amber-700 bg-[rgb(var(--state-warning-bg)/0.18)] dark:bg-[rgb(var(--state-warning-fg))]/20 dark:text-amber-400 rounded-full">
                      In Progress
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
