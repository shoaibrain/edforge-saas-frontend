/**
 * ExamTable — list of exams for a school + academic year.
 *
 * Built on the shared `<DataTable />` from `@edforge/ui`, this wrapper just
 * declares the columns / facets / bulk actions specific to exams; everything
 * else (search, sort, density, persistence, floating bulk bar, export, etc.)
 * lives in the shared component.
 */

import { useMemo } from 'react'
import { ClipboardList, CheckCircle2, Clock } from 'lucide-react'
import type { ExamResponseDto, ExamStatus } from '@aibrains/shared-types'
import {
  DataTable,
  createSelectColumn,
  type BulkAction,
  type ColumnDef,
  type FacetedFilterConfig,
} from '@edforge/ui'
import { getExamStatusMeta, humanizeExamType } from '../../schemas/exam.form'

interface ExamTableProps {
  exams: ExamResponseDto[]
  termNameById: Record<string, string>
  isLoading: boolean
  onSelectExam?: (exam: ExamResponseDto) => void
  /** Optional bulk actions wired from the page (status drawer, generate, etc). */
  bulkActions?: BulkAction<ExamResponseDto>[]
}

type ExamWithResults = ExamResponseDto & {
  resultsBucket: 'generated' | 'pending' | 'none'
}

const STATUS_ORDER: ExamStatus[] = [
  'draft',
  'scheduled',
  'in_progress',
  'closed',
  'published',
]

const RESULT_OPTIONS = [
  { value: 'generated', label: 'Generated' },
  { value: 'pending', label: 'Pending' },
  { value: 'none', label: '—' },
] as const

export function ExamTable({
  exams,
  termNameById,
  isLoading,
  onSelectExam,
  bulkActions,
}: ExamTableProps) {
  // Augment every row with a stable "results bucket" so the facet filter and
  // sort don't need to recompute the bucket on every cell render.
  const rows: ExamWithResults[] = useMemo(
    () =>
      exams.map((exam) => ({
        ...exam,
        resultsBucket:
          exam.resultGenerationStatus === 'generated'
            ? 'generated'
            : exam.resultGenerationStatus === 'pending'
              ? 'pending'
              : 'none',
      })),
    [exams]
  )

  const typeOptions = useMemo(() => {
    const set = new Set<string>()
    exams.forEach((e) => e.examType && set.add(e.examType))
    return Array.from(set)
      .sort()
      .map((value) => ({ value, label: humanizeExamType(value) }))
  }, [exams])

  const termOptions = useMemo(() => {
    const set = new Set<string>()
    exams.forEach((e) => e.termId && set.add(e.termId))
    return Array.from(set).map((value) => ({
      value,
      label: termNameById[value] ?? '—',
    }))
  }, [exams, termNameById])

  const statusOptions = useMemo(
    () =>
      STATUS_ORDER.map((s) => ({
        value: s,
        label: getExamStatusMeta(s).label,
      })),
    []
  )

  const columns = useMemo<ColumnDef<ExamWithResults, unknown>[]>(
    () => [
      createSelectColumn<ExamWithResults>(),

      {
        id: 'examName',
        accessorKey: 'examName',
        header: 'Exam',
        size: 280,
        enableSorting: true,
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="font-medium text-[rgb(var(--text-primary))] truncate">
              {row.original.examName}
            </div>
            {row.original.description && (
              <div className="text-xs text-[rgb(var(--text-tertiary))] truncate">
                {row.original.description}
              </div>
            )}
          </div>
        ),
      },

      {
        id: 'examType',
        accessorKey: 'examType',
        header: 'Type',
        size: 160,
        enableSorting: true,
        filterFn: 'arrIncludesSome',
        cell: ({ getValue }) => {
          const value = String(getValue() ?? '')
          return (
            <div className="inline-flex items-center gap-2">
              <span
                className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-[var(--mint-soft)] text-[var(--mint)] text-3xs font-bold tracking-wide"
                aria-hidden
              >
                {typeAbbrev(value)}
              </span>
              <span className="text-[rgb(var(--text-secondary))]">
                {humanizeExamType(value)}
              </span>
            </div>
          )
        },
      },

      {
        id: 'termId',
        accessorKey: 'termId',
        header: 'Term',
        size: 120,
        enableSorting: true,
        filterFn: 'arrIncludesSome',
        cell: ({ getValue }) => (
          <span className="text-[rgb(var(--text-secondary))]">
            {termNameById[String(getValue() ?? '')] ?? '—'}
          </span>
        ),
        meta: {
          facetLabelMap: (value: unknown) =>
            termNameById[String(value)] ?? String(value),
        },
      },

      {
        id: 'gradeLevels',
        accessorKey: 'gradeLevels',
        header: 'Grades',
        size: 140,
        enableSorting: false,
        cell: ({ getValue }) => {
          const grades = (getValue() as string[] | undefined) ?? []
          if (grades.length === 0) {
            return <span className="text-[rgb(var(--text-tertiary))]">—</span>
          }
          return (
            <div className="flex flex-wrap gap-1">
              {grades.slice(0, 3).map((g) => (
                <span
                  key={g}
                  className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-secondary))]"
                >
                  {g}
                </span>
              ))}
              {grades.length > 3 && (
                <span className="text-xs text-[rgb(var(--text-tertiary))]">
                  +{grades.length - 3}
                </span>
              )}
            </div>
          )
        },
      },

      {
        id: 'schedule',
        accessorFn: (row) => row.startDate,
        header: 'Schedule',
        size: 180,
        enableSorting: true,
        sortingFn: (a, b) =>
          (a.original.startDate ?? '').localeCompare(b.original.startDate ?? ''),
        cell: ({ row }) => (
          <div>
            <div className="text-[rgb(var(--text-primary))] tabular-nums">
              {formatShortDate(row.original.startDate)}
              <span className="text-[rgb(var(--text-tertiary))]"> → </span>
              {formatShortDate(row.original.endDate)}
            </div>
            <div className="text-xs text-[rgb(var(--text-tertiary))] tabular-nums">
              {scheduleSubline(row.original.startDate, row.original.endDate)}
            </div>
          </div>
        ),
      },

      {
        id: 'status',
        accessorKey: 'status',
        header: 'Status',
        size: 140,
        enableSorting: true,
        filterFn: 'arrIncludesSome',
        cell: ({ getValue }) => {
          const meta = getExamStatusMeta(getValue() as ExamStatus)
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${meta.className}`}
            >
              <span
                aria-hidden
                className="inline-block w-1.5 h-1.5 rounded-full bg-current"
              />
              {meta.label}
            </span>
          )
        },
      },

      {
        id: 'results',
        accessorKey: 'resultsBucket',
        header: 'Results',
        size: 130,
        enableSorting: true,
        filterFn: 'arrIncludesSome',
        cell: ({ getValue }) => {
          const bucket = getValue() as ExamWithResults['resultsBucket']
          if (bucket === 'generated') {
            return (
              <span className="inline-flex items-center gap-1 text-[rgb(var(--state-success-fg))]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Generated
              </span>
            )
          }
          if (bucket === 'pending') {
            return (
              <span className="inline-flex items-center gap-1 text-[rgb(var(--state-warning-fg))]">
                <Clock className="w-3.5 h-3.5" />
                Pending
              </span>
            )
          }
          return <span className="text-[rgb(var(--text-tertiary))]">—</span>
        },
      },
    ],
    [termNameById]
  )

  const facets: FacetedFilterConfig[] = useMemo(
    () => [
      { columnId: 'examType', title: 'Type', options: typeOptions },
      { columnId: 'termId', title: 'Term', options: termOptions },
      { columnId: 'status', title: 'Status', options: statusOptions },
      {
        columnId: 'results',
        title: 'Results',
        options: RESULT_OPTIONS.map((o) => ({ ...o })),
      },
    ],
    [typeOptions, termOptions, statusOptions]
  )

  return (
    <DataTable<ExamWithResults>
      tableId="academics.exams"
      data={rows}
      columns={columns}
      getRowId={(row) => row.examId}
      isLoading={isLoading}
      enableSorting
      enableRowSelection={!!bulkActions?.length}
      enableColumnVisibility
      facets={facets}
      searchPlaceholder="Search exams…"
      defaultSort={[{ id: 'schedule', desc: true }]}
      pagination={{ pageSize: 8 }}
      pageSizes={[8, 12, 20]}
      density="comfortable"
      onRowClick={onSelectExam}
      bulkActions={bulkActions}
      exportOptions={{ filename: 'exams', formats: ['csv'] }}
      emptyState={{
        icon: <ClipboardList className="w-12 h-12" />,
        title: 'No exams match',
        description:
          'Adjust filters or create the first exam for this academic year to begin scheduling.',
      }}
    />
  )
}

// ============================================================================
// HELPERS
// ============================================================================

function typeAbbrev(examType: string): string {
  if (!examType) return '—'
  return humanizeExamType(examType)
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatShortDate(iso?: string): string {
  if (!iso) return '—'
  // The exam DTO stores YYYY-MM-DD. Render as "MMM D" matching the prototype.
  const [y, m, d] = iso.split('-').map((part) => Number(part))
  if (!y || !m || !d) return iso
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function scheduleSubline(start?: string, end?: string): string {
  if (!start || !end) return ''
  const startMs = Date.parse(start + 'T00:00:00Z')
  const endMs = Date.parse(end + 'T00:00:00Z')
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return ''
  const todayMs = Date.parse(new Date().toISOString().slice(0, 10) + 'T00:00:00Z')
  const daySince = Math.round((todayMs - startMs) / 86_400_000)
  const dayLen = Math.max(0, Math.round((endMs - startMs) / 86_400_000)) + 1
  const sincePart =
    daySince > 0
      ? `${daySince}d ago`
      : daySince === 0
        ? 'today'
        : `in ${Math.abs(daySince)}d`
  return `${sincePart} · ${dayLen}d`
}
