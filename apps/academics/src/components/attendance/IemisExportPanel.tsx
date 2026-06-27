/**
 * IemisExportPanel — IEMiS monthly attendance export (Attendance realignment, S5).
 *
 * Picks a year-month, triggers POST /academics/attendance/iemis-export (which
 * recomputes + persists the monthly aggregate server-side), previews the returned
 * IEMiS Flash II rows, and offers a client-side CSV download. The response IS the
 * data — no presigned URL in V1; the canonical CEHRD file generation is a deferred
 * backend track.
 */

import { useState } from 'react'
import { Button, Input } from '@edforge/ui'
import { Download, FileSpreadsheet, Loader2, AlertTriangle } from 'lucide-react'
import { gregorianToBs } from '@edforge/date-utils'
import { useExportIemisAttendance } from '../../hooks/useAttendance'
import type { IemisAttendanceExportResponseDto } from '@aibrains/shared-types'

const YEAR_MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/

const BS_MONTH_NAMES = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
]

function currentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/**
 * F3.T3 — a Gregorian calendar month spans ~two Bikram Sambat months, so we show
 * the BS span the selected export month covers (first day → last day) for PABSON
 * operators who think in BS. Best-effort: if the converter is out of its
 * supported BS range we just omit the hint.
 */
function bsSpanLabel(yearMonth: string): string | null {
  if (!YEAR_MONTH_RE.test(yearMonth)) return null
  try {
    const [y, m] = yearMonth.split('-').map(Number)
    const lastDay = new Date(y, m, 0).getDate()
    const start = gregorianToBs(`${yearMonth}-01T12:00:00`)
    const end = gregorianToBs(`${yearMonth}-${String(lastDay).padStart(2, '0')}T12:00:00`)
    const fmt = (d: { year: number; month: number }) => `${BS_MONTH_NAMES[d.month - 1]} ${d.year}`
    const a = fmt(start)
    const b = fmt(end)
    return a === b ? `BS ${a}` : `BS ${a} – ${b}`
  } catch {
    return null
  }
}

const CSV_HEADER = [
  'Student ID',
  'Student Name',
  'Grade',
  'Present Days',
  'Absent Days',
  'Excused Days',
  'Total School Days',
]

function buildCsv(res: IemisAttendanceExportResponseDto): string {
  const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [
    CSV_HEADER.map(escape).join(','),
    ...res.rows.map((r) =>
      [r.studentId, r.studentName ?? '', r.gradeLevel ?? '', r.presentDays, r.absentDays, r.excusedDays, r.totalSchoolDays]
        .map(escape)
        .join(','),
    ),
  ]
  return lines.join('\n')
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

interface IemisExportPanelProps {
  schoolId: string
  academicYearId: string
}

export function IemisExportPanel({ schoolId, academicYearId }: IemisExportPanelProps) {
  const [yearMonth, setYearMonth] = useState<string>(currentYearMonth())
  const exportMutation = useExportIemisAttendance()
  const result = exportMutation.data

  const isValid = YEAR_MONTH_RE.test(yearMonth)
  const canGenerate = isValid && !!schoolId && !!academicYearId && !exportMutation.isPending
  const bsSpan = bsSpanLabel(yearMonth)

  const handleGenerate = () => {
    if (!canGenerate) return
    exportMutation.mutate({ schoolId, yearMonth, academicYearId })
  }

  const handleDownload = () => {
    if (!result) return
    downloadCsv(`iemis-attendance-${result.yearMonth}.csv`, buildCsv(result))
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-surface-secondary border border-border-secondary rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileSpreadsheet className="w-4 h-4 text-[rgb(var(--accent-attendance-text))]" />
          <h4 className="text-sm font-semibold text-text-primary">IEMiS Monthly Export</h4>
        </div>
        <p className="text-xs text-text-tertiary mb-4 max-w-2xl">
          Generate the IEMiS Flash II monthly attendance roll-up for a calendar month. The
          export recomputes per-student present / absent / excused day counts and lets you
          download a CSV. Grade is the school-local grade level.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="iemis-year-month" className="block text-xs font-medium text-text-secondary mb-1">
              Month
            </label>
            <Input
              id="iemis-year-month"
              type="month"
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
              className="w-44"
              aria-label="Export month (YYYY-MM)"
            />
            {bsSpan && (
              <p className="mt-1 text-3xs text-text-tertiary" data-testid="iemis-bs-span">{bsSpan}</p>
            )}
          </div>
          <Button onClick={handleGenerate} disabled={!canGenerate}>
            {exportMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating…
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4" /> Generate Export
              </>
            )}
          </Button>
          {result && (
            <Button variant="secondary" onClick={handleDownload} disabled={result.rowCount === 0}>
              <Download className="w-4 h-4" /> Download CSV
            </Button>
          )}
        </div>
        {!isValid && (
          <p className="mt-2 text-xs text-[rgb(var(--state-danger-fg))]">Enter a valid month (YYYY-MM).</p>
        )}
      </div>

      {/* Error */}
      {exportMutation.isError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgb(var(--state-danger-bg)/0.12)] border border-[rgb(var(--state-danger-fg)/0.25)] text-xs text-[rgb(var(--state-danger-fg))]">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Failed to generate the export. Please try again.
        </div>
      )}

      {/* Result preview */}
      {result && (
        <div className="bg-surface-secondary border border-border-secondary rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border-secondary flex items-center justify-between">
            <div className="text-xs text-text-secondary">
              <strong className="text-text-primary">{result.rowCount}</strong> student
              {result.rowCount !== 1 ? 's' : ''} · {result.yearMonth}
            </div>
            <div className="text-3xs text-text-tertiary">
              Generated {new Date(result.generatedAt).toLocaleString()}
            </div>
          </div>
          {result.rowCount === 0 ? (
            <div className="py-10 text-center text-sm text-text-tertiary">
              No attendance recorded for this month.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-text-tertiary border-b border-border-secondary">
                    <th className="font-medium px-4 py-2">Student</th>
                    <th className="font-medium px-4 py-2">Grade</th>
                    <th className="font-medium px-4 py-2 text-right">Present</th>
                    <th className="font-medium px-4 py-2 text-right">Absent</th>
                    <th className="font-medium px-4 py-2 text-right">Excused</th>
                    <th className="font-medium px-4 py-2 text-right">School Days</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((r) => (
                    <tr key={r.studentId} className="border-b border-border-secondary last:border-0">
                      <td className="px-4 py-2 text-text-primary">{r.studentName ?? r.studentId}</td>
                      <td className="px-4 py-2 text-text-secondary">{r.gradeLevel ?? '—'}</td>
                      <td className="px-4 py-2 text-right text-text-secondary">{r.presentDays}</td>
                      <td className="px-4 py-2 text-right text-text-secondary">{r.absentDays}</td>
                      <td className="px-4 py-2 text-right text-text-secondary">{r.excusedDays}</td>
                      <td className="px-4 py-2 text-right text-text-secondary">{r.totalSchoolDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default IemisExportPanel
