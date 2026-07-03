/**
 * IemisExportPanel — IEMiS monthly attendance export (Attendance realignment, S5).
 *
 * Picks a year-month, triggers POST /academics/attendance/iemis-export (which
 * recomputes + persists the monthly aggregate server-side), previews the returned
 * IEMiS Flash II rows, and offers a client-side CSV download. The response IS the
 * data — no presigned URL in V1; the canonical CEHRD file generation is a deferred
 * backend track.
 */

import { useMemo, useState } from 'react'
import { Button, Input, TanstackDataTable, type ColumnDef } from '@edforge/ui'
import { Download, FileSpreadsheet, Loader2, AlertTriangle } from 'lucide-react'
import { gregorianToBs } from '@edforge/date-utils'
import { useExportIemisAttendance } from '../../hooks/useAttendance'
import type { IemisAttendanceExportResponseDto } from '@aibrains/shared-types'
import { IdentityCell } from './roster/IdentityCell'
import { useAcademicsI18n } from '../../lib/i18n'

type IemisExportRow = IemisAttendanceExportResponseDto['rows'][number]

const YEAR_MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/

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
function bsSpanLabel(
  yearMonth: string,
  t: ReturnType<typeof useAcademicsI18n>['t'],
): string | null {
  if (!YEAR_MONTH_RE.test(yearMonth)) return null
  try {
    const [y, m] = yearMonth.split('-').map(Number)
    const lastDay = new Date(y, m, 0).getDate()
    const start = gregorianToBs(`${yearMonth}-01T12:00:00`)
    const end = gregorianToBs(`${yearMonth}-${String(lastDay).padStart(2, '0')}T12:00:00`)
    const fmt = (d: { year: number; month: number }) =>
      `${t(`iemisExport.bsMonths.${d.month}`)} ${d.year}`
    const a = fmt(start)
    const b = fmt(end)
    return a === b
      ? t('iemisExport.bs', { label: a })
      : t('iemisExport.bsRange', { start: a, end: b })
  } catch {
    return null
  }
}

function buildCsv(res: IemisAttendanceExportResponseDto, header: string[]): string {
  const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [
    header.map(escape).join(','),
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
  /**
   * When rendered inside the export dialog (Modal), the dialog already supplies
   * the title/description chrome — drop the panel's own heading to avoid the
   * duplicate. Default (false) keeps the standalone heading.
   */
  embedded?: boolean
}

export function IemisExportPanel({ schoolId, academicYearId, embedded = false }: IemisExportPanelProps) {
  const { t, dataTableLabels, formatDateTime, formatNumber } = useAcademicsI18n()
  const [yearMonth, setYearMonth] = useState<string>(currentYearMonth())
  const exportMutation = useExportIemisAttendance()
  const result = exportMutation.data

  const isValid = YEAR_MONTH_RE.test(yearMonth)
  const canGenerate = isValid && !!schoolId && !!academicYearId && !exportMutation.isPending
  const bsSpan = bsSpanLabel(yearMonth, t)

  const csvHeader = useMemo(
    () => [
      t('iemisExport.columns.studentId'),
      t('iemisExport.columns.studentName'),
      t('iemisExport.columns.grade'),
      t('iemisExport.columns.presentDays'),
      t('iemisExport.columns.absentDays'),
      t('iemisExport.columns.excusedDays'),
      t('iemisExport.columns.totalSchoolDays'),
    ],
    [t],
  )

  const columns: ColumnDef<IemisExportRow, unknown>[] = useMemo(
    () => {
      const numericCell = (value: number) => (
        <div className="text-right tabular-nums text-text-secondary">{formatNumber(value)}</div>
      )

      return [
        {
          accessorKey: 'studentName',
          header: t('iemisExport.columns.student'),
          size: 260,
          cell: ({ row }) => (
            <IdentityCell
              studentId={row.original.studentId}
              studentName={row.original.studentName ?? row.original.studentId}
            />
          ),
        },
        {
          accessorKey: 'gradeLevel',
          header: t('iemisExport.columns.grade'),
          size: 100,
          cell: ({ row }) => <span className="text-sm text-text-secondary">{row.original.gradeLevel ?? '—'}</span>,
        },
        { accessorKey: 'presentDays', header: t('iemisExport.columns.present'), size: 90, cell: ({ row }) => numericCell(row.original.presentDays) },
        { accessorKey: 'absentDays', header: t('iemisExport.columns.absent'), size: 90, cell: ({ row }) => numericCell(row.original.absentDays) },
        { accessorKey: 'excusedDays', header: t('iemisExport.columns.excused'), size: 90, cell: ({ row }) => numericCell(row.original.excusedDays) },
        { accessorKey: 'totalSchoolDays', header: t('iemisExport.columns.schoolDays'), size: 110, cell: ({ row }) => numericCell(row.original.totalSchoolDays) },
      ]
    },
    [formatNumber, t],
  )

  const handleGenerate = () => {
    if (!canGenerate) return
    exportMutation.mutate({ schoolId, yearMonth, academicYearId })
  }

  const handleDownload = () => {
    if (!result) return
    downloadCsv(`iemis-attendance-${result.yearMonth}.csv`, buildCsv(result, csvHeader))
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-surface-secondary border border-border-secondary rounded-xl p-4">
        {!embedded && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <FileSpreadsheet className="w-4 h-4 text-[rgb(var(--accent-attendance-text))]" />
              <h4 className="text-sm font-semibold text-text-primary">{t('iemisExport.title')}</h4>
            </div>
            <p className="text-xs text-text-tertiary mb-4 max-w-2xl">
              {t('iemisExport.description')}
            </p>
          </>
        )}
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="iemis-year-month" className="block text-xs font-medium text-text-secondary mb-1">
              {t('iemisExport.month')}
            </label>
            <Input
              id="iemis-year-month"
              type="month"
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
              className="w-44"
              aria-label={t('iemisExport.monthAria')}
            />
            {bsSpan && (
              <p className="mt-1 text-3xs text-text-tertiary" data-testid="iemis-bs-span">{bsSpan}</p>
            )}
          </div>
          <Button onClick={handleGenerate} disabled={!canGenerate}>
            {exportMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> {t('iemisExport.generating')}
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4" /> {t('iemisExport.generate')}
              </>
            )}
          </Button>
          {result && (
            <Button variant="secondary" onClick={handleDownload} disabled={result.rowCount === 0}>
              <Download className="w-4 h-4" /> {t('iemisExport.downloadCsv')}
            </Button>
          )}
        </div>
        {!isValid && (
          <p className="mt-2 text-xs text-[rgb(var(--state-danger-fg))]">{t('iemisExport.invalidMonth')}</p>
        )}
      </div>

      {/* Error */}
      {exportMutation.isError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgb(var(--state-danger-bg)/0.12)] border border-[rgb(var(--state-danger-fg)/0.25)] text-xs text-[rgb(var(--state-danger-fg))]">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {t('iemisExport.failed')}
        </div>
      )}

      {/* Result preview */}
      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="text-xs text-text-secondary">
              {t('iemisExport.summary', {
                students: t('common.students', { count: result.rowCount }),
                yearMonth: result.yearMonth,
              })}
            </div>
            <div className="text-3xs text-text-tertiary">
              {t('iemisExport.generated', { dateTime: formatDateTime(result.generatedAt) })}
            </div>
          </div>
          {result.rowCount === 0 ? (
            <div className="rounded-xl border border-border-secondary bg-surface-secondary py-10 text-center text-sm text-text-tertiary">
              {t('iemisExport.empty')}
            </div>
          ) : (
            <TanstackDataTable
              columns={columns}
              data={result.rows}
              getRowId={(r) => r.studentId}
              tableId="academics.iemis-export"
              enableSorting
              searchPlaceholder={t('iemisExport.search')}
              pagination={{ pageSize: 25 }}
              labels={dataTableLabels}
              maxHeight="60vh"
            />
          )}
        </div>
      )}
    </div>
  )
}

export default IemisExportPanel
