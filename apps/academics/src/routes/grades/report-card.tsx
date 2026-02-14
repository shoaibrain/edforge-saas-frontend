/**
 * Student Report Card Page
 *
 * Displays a printable report card for a single student:
 * - Student info header
 * - Grading period selector
 * - Course grades table with letter grades, percentages, GPA points
 * - GPA summary (term, cumulative, weighted)
 * - Print-friendly layout with CSS @media print
 */

import { useState, useRef } from 'react'
import {
  GraduationCap,
  Printer,
  ArrowLeft,
  BookOpen,
  Lock,
} from 'lucide-react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useActiveSchoolId } from '../../stores/app.store'
import { useCurrentAcademicYear, useGradingPeriods } from '../../hooks'
import { useStudentGrades } from '../../hooks/useGrades'

// ============================================================================
// HELPERS
// ============================================================================

function getLetterGradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'text-emerald-600 dark:text-emerald-400'
  if (grade.startsWith('B')) return 'text-blue-600 dark:text-blue-400'
  if (grade.startsWith('C')) return 'text-amber-600 dark:text-amber-400'
  if (grade.startsWith('D')) return 'text-orange-600 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}

function getGpaBadge(gpa: number): { bg: string; text: string } {
  if (gpa >= 3.5) return { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400' }
  if (gpa >= 3.0) return { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-400' }
  if (gpa >= 2.0) return { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-400' }
  return { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-400' }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ReportCardPage() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { studentId?: string; studentName?: string }
  const studentId = search.studentId || ''
  const studentName = search.studentName || 'Student'

  const schoolId = useActiveSchoolId() || ''
  const { data: currentYear } = useCurrentAcademicYear(schoolId)
  const { data: gradingPeriods } = useGradingPeriods(
    schoolId,
    currentYear?.yearId || '',
    !!currentYear?.yearId
  )

  const [selectedTermId, setSelectedTermId] = useState('')
  const printRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useStudentGrades(
    studentId,
    {
      academicYearId: currentYear?.yearId,
      termId: selectedTermId || undefined,
    },
    !!studentId
  )

  const grades = data?.grades ?? []
  const gpa = data?.gpa

  const handlePrint = () => {
    window.print()
  }

  if (!studentId) {
    return (
      <div className="py-16 text-center">
        <GraduationCap className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
        <h4 className="text-lg font-medium text-text-primary mb-2">
          No Student Selected
        </h4>
        <p className="text-text-secondary max-w-md mx-auto mb-4">
          Navigate to a student profile and click "View Report Card" to see their grades.
        </p>
        <button
          type="button"
          onClick={() => navigate({ to: '/students' })}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go to Students
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-full">
      {/* Screen-only Header */}
      <div className="print:hidden border-b border-border-secondary bg-surface-secondary/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate({ to: '/grades' })}
              className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-text-primary">
                Report Card
              </h1>
              <p className="text-sm text-text-secondary">{studentName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {gradingPeriods && gradingPeriods.length > 0 && (
              <select
                value={selectedTermId}
                onChange={(e) => setSelectedTermId(e.target.value)}
                className="px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="">All Terms</option>
                {gradingPeriods.map((gp: { periodId: string; name: string }) => (
                  <option key={gp.periodId} value={gp.periodId}>
                    {gp.name}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Printable Content */}
      <div ref={printRef} className="px-6 py-6 max-w-4xl mx-auto print:px-0 print:py-0 print:max-w-none">
        {/* Print Header (only visible when printing) */}
        <div className="hidden print:block mb-8 border-b-2 border-gray-800 pb-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Student Report Card</h1>
            <p className="text-gray-600 mt-1">
              {currentYear?.name || 'Academic Year'}{selectedTermId ? ` — ${gradingPeriods?.find((gp: { periodId: string }) => gp.periodId === selectedTermId)?.name || 'Term'}` : ''}
            </p>
          </div>
          <div className="mt-4 flex justify-between text-sm text-gray-700">
            <div>
              <strong>Student:</strong> {studentName}
            </div>
            <div>
              <strong>Date:</strong> {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4 print:hidden">
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-surface-secondary rounded-xl animate-pulse" />
              ))}
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-surface-secondary rounded-lg animate-pulse" />
            ))}
          </div>
        ) : grades.length === 0 ? (
          <div className="py-12 text-center">
            <GraduationCap className="w-10 h-10 mx-auto text-text-tertiary mb-3 print:hidden" />
            <h4 className="text-sm font-medium text-text-primary mb-1">
              No grades recorded
            </h4>
            <p className="text-xs text-text-tertiary max-w-xs mx-auto">
              Grades will appear here once they are recorded by teachers.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* GPA Summary */}
            {gpa && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-3">
                <div className="bg-surface-secondary rounded-xl border border-border-secondary p-4 text-center print:border print:border-gray-300 print:rounded print:bg-gray-50">
                  <p className="text-xs text-text-tertiary mb-1 print:text-gray-500">Term GPA</p>
                  <p className={`text-2xl font-bold ${getGpaBadge(gpa.termGpa).text} print:text-gray-900`}>
                    {gpa.termGpa.toFixed(2)}
                  </p>
                </div>
                <div className="bg-surface-secondary rounded-xl border border-border-secondary p-4 text-center print:border print:border-gray-300 print:rounded print:bg-gray-50">
                  <p className="text-xs text-text-tertiary mb-1 print:text-gray-500">Cumulative GPA</p>
                  <p className={`text-2xl font-bold ${getGpaBadge(gpa.cumulativeGpa).text} print:text-gray-900`}>
                    {gpa.cumulativeGpa.toFixed(2)}
                  </p>
                </div>
                <div className="bg-surface-secondary rounded-xl border border-border-secondary p-4 text-center print:border print:border-gray-300 print:rounded print:bg-gray-50">
                  <p className="text-xs text-text-tertiary mb-1 print:text-gray-500">Weighted GPA</p>
                  <p className={`text-2xl font-bold ${getGpaBadge(gpa.weightedGpa).text} print:text-gray-900`}>
                    {gpa.weightedGpa.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {/* Course Grades Table */}
            <div className="rounded-xl border border-border-secondary overflow-hidden print:rounded print:border-gray-300">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-secondary print:bg-gray-100">
                    <th className="px-4 py-3 text-left font-semibold text-text-primary print:text-gray-900">Course</th>
                    <th className="px-4 py-3 text-center font-medium text-text-secondary print:text-gray-700">Assignments</th>
                    <th className="px-4 py-3 text-center font-medium text-text-secondary print:text-gray-700">Numeric</th>
                    <th className="px-4 py-3 text-center font-medium text-text-secondary print:text-gray-700">Letter</th>
                    <th className="px-4 py-3 text-center font-medium text-text-secondary print:text-gray-700">GPA Points</th>
                    <th className="px-4 py-3 text-center font-medium text-text-secondary print:text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-secondary print:divide-gray-200">
                  {grades.map((grade) => (
                    <tr key={grade.gradeId} className="hover:bg-surface-secondary/50 transition-colors print:hover:bg-transparent">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-text-tertiary print:hidden" />
                          <span className="font-medium text-text-primary print:text-gray-900">
                            {grade.courseId.slice(0, 12)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-text-secondary print:text-gray-600">
                        {grade.assignments?.length ?? 0}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-semibold text-text-primary print:text-gray-900">
                          {grade.numericGrade.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold text-lg ${getLetterGradeColor(grade.letterGrade)} print:text-gray-900`}>
                          {grade.letterGrade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-text-secondary print:text-gray-600">
                        {grade.gpaPoints.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {grade.isFinal ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-full print:text-gray-700 print:bg-gray-200">
                            <Lock className="w-3 h-3 print:hidden" />
                            Final
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs font-medium text-amber-700 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-400 rounded-full print:text-gray-600 print:bg-gray-200">
                            In Progress
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Print Footer */}
            <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500 text-center">
              Generated on {new Date().toLocaleString()} — EdForge Student Information System
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReportCardPage
