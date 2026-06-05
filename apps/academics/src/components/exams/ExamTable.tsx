/**
 * ExamTable — list of exams for a school + academic year. Rows open the exam's
 * result cards (Ed-Fi ReportCard) via onSelectExam.
 */

import { ClipboardList } from 'lucide-react'
import type { ExamResponseDto } from '@aibrains/shared-types'
import { getExamStatusMeta, humanizeExamType } from '../../schemas/exam.form'

interface ExamTableProps {
  exams: ExamResponseDto[]
  termNameById: Record<string, string>
  isLoading: boolean
  onSelectExam?: (exam: ExamResponseDto) => void
}

function StatusBadge({ status }: { status: ExamResponseDto['status'] }) {
  const meta = getExamStatusMeta(status)
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${meta.className}`}>
      {meta.label}
    </span>
  )
}

export function ExamTable({ exams, termNameById, isLoading, onSelectExam }: ExamTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-surface-secondary rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (exams.length === 0) {
    return (
      <div className="bg-surface-secondary rounded-xl border border-border-secondary p-12 text-center">
        <ClipboardList className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
        <h4 className="text-lg font-medium text-text-primary mb-2">No Exams Yet</h4>
        <p className="text-text-secondary max-w-md mx-auto">
          Create the first exam for this academic year to start scheduling and recording scores.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border-secondary">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-secondary text-left text-text-tertiary">
            <th className="px-4 py-3 font-medium">Exam</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Term</th>
            <th className="px-4 py-3 font-medium">Dates</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-secondary">
          {exams.map((exam) => (
            <tr
              key={exam.examId}
              onClick={() => onSelectExam?.(exam)}
              className={`bg-surface-primary hover:bg-surface-secondary/50 transition-colors ${onSelectExam ? 'cursor-pointer' : ''}`}
            >
              <td className="px-4 py-3 font-medium text-text-primary">{exam.examName}</td>
              <td className="px-4 py-3 text-text-secondary">{humanizeExamType(exam.examType)}</td>
              <td className="px-4 py-3 text-text-secondary">{termNameById[exam.termId] ?? '—'}</td>
              <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                {exam.startDate} → {exam.endDate}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={exam.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
