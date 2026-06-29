/**
 * SectionTable Component
 *
 * Displays a paginated table of class sections with capacity indicators,
 * teacher assignments, and row actions.
 */

import { useMemo, useState } from 'react'
import {
  CalendarDays,
  MoreVertical,
  Eye,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import type { OnChangeFn, RowSelectionState } from '@tanstack/react-table'
import {
  TanstackDataTable,
  createActionsColumn,
  createSelectColumn,
  StatusBadge,
  type BulkAction,
  type ColumnDef,
  type FacetedFilterConfig,
} from '@edforge/ui'
import type { SectionResponseDto } from '@aibrains/shared-types'
import {
  getCapacityColor,
  getCapacityPercent,
  getCapacityLabel,
  getCapacityTextColor,
} from '../../schemas/section.form'
import { useAcademicsI18n } from '../../lib/i18n'

// ============================================================================
// TYPES
// ============================================================================

interface SectionTableProps {
  sections: SectionResponseDto[]
  isLoading?: boolean
  onViewSection?: (section: SectionResponseDto) => void
  onEditSection?: (section: SectionResponseDto) => void
  onToggleActive?: (section: SectionResponseDto) => void
  onViewRoster?: (section: SectionResponseDto) => void
  /** Override the internal toast-placeholder bulk actions. Pass from the route
   *  when wiring real bulk drawers (e.g. BulkSectionStatusModal). */
  bulkActions?: BulkAction<SectionResponseDto>[]
  /** Controlled row selection — lift state into the page when an action
   *  needs to clear selection (e.g. after a bulk activate/deactivate). */
  rowSelection?: RowSelectionState
  onRowSelectionChange?: OnChangeFn<RowSelectionState>
}

// ============================================================================
// ROW ACTIONS
// ============================================================================

interface RowActionsProps {
  section: SectionResponseDto
  onView: () => void
  onEdit: () => void
  onToggleActive: () => void
  onViewRoster: () => void
}

function RowActions({ section, onView, onEdit, onToggleActive, onViewRoster }: RowActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useAcademicsI18n()

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
        aria-label={t('tables.sections.actions.sectionActions')}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(false)
            }}
          />
          <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg bg-surface-primary border border-border-primary shadow-lg py-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
                onView()
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <Eye className="w-4 h-4" />
              {t('tables.sections.actions.viewDetails')}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
                onViewRoster()
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <Users className="w-4 h-4" />
              {t('tables.sections.actions.viewRoster')}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
                onEdit()
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <Pencil className="w-4 h-4" />
              {t('tables.sections.actions.editSection')}
            </button>
            <div className="border-t border-border-secondary my-1" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
                onToggleActive()
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              {section.isActive ? (
                <>
                  <ToggleLeft className="w-4 h-4" />
                  {t('tables.sections.actions.deactivate')}
                </>
              ) : (
                <>
                  <ToggleRight className="w-4 h-4" />
                  {t('tables.sections.actions.activate')}
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// CAPACITY BAR
// ============================================================================

function CapacityBar({ current, max }: { current: number; max: number }) {
  const percent = getCapacityPercent(current, max)
  const barColor = getCapacityColor(current, max)
  const textColor = getCapacityTextColor(current, max)

  return (
    <div className="flex items-center gap-2 min-w-32">
      <div className="flex-1 h-2 bg-[rgb(var(--background-tertiary))] rounded-full overflow-hidden">
        <div
          // allow-presentation-style: capacity fill width is data-driven
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className={`text-xs font-medium tabular-nums ${textColor}`}>
        {getCapacityLabel(current, max)}
      </span>
    </div>
  )
}

// ============================================================================
// SECTION TABLE
// ============================================================================

export function SectionTable({
  sections,
  isLoading,
  onViewSection,
  onEditSection,
  onToggleActive,
  onViewRoster,
  bulkActions: bulkActionsProp,
  rowSelection,
  onRowSelectionChange,
}: SectionTableProps) {
  const { t, dataTableLabels } = useAcademicsI18n()
  const columns: ColumnDef<SectionResponseDto, unknown>[] = useMemo(
    () => [
      createSelectColumn<SectionResponseDto>(),
      {
        accessorKey: 'sectionNumber',
        header: t('tables.sections.columns.section'),
        size: 180,
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-text-primary">
              {row.original.sectionName || `${t('common.section')} ${row.original.sectionNumber}`}
            </div>
            <div className="text-xs text-text-tertiary mt-0.5">
              #{row.original.sectionNumber}
            </div>
          </div>
        ),
      },
      {
        id: 'course',
        accessorFn: (row) => row.courseName,
        header: t('tables.sections.columns.course'),
        size: 200,
        cell: ({ row }) => (
          <div>
            <div className="text-sm text-text-primary">
              {row.original.courseName || '\u2014'}
            </div>
            {row.original.courseCode && (
              <div className="text-xs text-text-tertiary mt-0.5">
                {row.original.courseCode}
              </div>
            )}
          </div>
        ),
      },
      {
        id: 'teacher',
        accessorFn: (row) => row.primaryTeacherName,
        header: t('tables.sections.columns.teacher'),
        size: 180,
        cell: ({ row }) => (
          <span className="text-sm text-text-primary">
            {row.original.primaryTeacherName || '\u2014'}
          </span>
        ),
      },
      {
        id: 'period',
        accessorFn: (row) => row.periodName,
        header: t('tables.sections.columns.period'),
        size: 120,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm text-text-secondary">
            {row.original.periodName || '\u2014'}
          </span>
        ),
      },
      {
        id: 'room',
        accessorFn: (row) => row.locationRoomNumber ?? row.roomNumber,
        header: t('tables.sections.columns.room'),
        size: 100,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm text-text-secondary">
            {row.original.locationRoomNumber || row.original.roomNumber || '\u2014'}
          </span>
        ),
      },
      {
        id: 'enrollment',
        accessorFn: (row) => row.currentEnrollment,
        header: t('tables.sections.columns.enrollment'),
        size: 180,
        enableSorting: false,
        cell: ({ row }) => (
          <CapacityBar
            current={row.original.currentEnrollment}
            max={row.original.maxEnrollment}
          />
        ),
      },
      {
        accessorKey: 'isActive',
        header: t('tables.sections.columns.status'),
        size: 80,
        enableSorting: false,
        // String-keyed facet values so the facet dropdown shows "active" /
        // "inactive" pills; the cell still renders the boolean.
        accessorFn: (row) => (row.isActive ? 'active' : 'inactive'),
        filterFn: 'arrIncludesSome',
        cell: ({ row }) => (
          <StatusBadge tone={row.original.isActive ? 'success' : 'neutral'} dot>
            {row.original.isActive ? t('common.active') : t('common.inactive')}
          </StatusBadge>
        ),
      },
      createActionsColumn<SectionResponseDto>({
        cell: ({ row }) => (
          <RowActions
            section={row.original}
            onView={() => onViewSection?.(row.original)}
            onEdit={() => onEditSection?.(row.original)}
            onToggleActive={() => onToggleActive?.(row.original)}
            onViewRoster={() => onViewRoster?.(row.original)}
          />
        ),
      }),
    ],
    [onViewSection, onEditSection, onToggleActive, onViewRoster, t]
  )

  const courseOptions = useMemo(() => {
    const set = new Set<string>()
    sections.forEach((s) => s.courseCode && set.add(s.courseCode))
    return Array.from(set).sort().map((value) => ({ value, label: value }))
  }, [sections])

  const periodOptions = useMemo(() => {
    const set = new Set<string>()
    sections.forEach((s) => s.periodName && set.add(s.periodName))
    return Array.from(set).sort().map((value) => ({ value, label: value }))
  }, [sections])

  const facets: FacetedFilterConfig[] = useMemo(
    () => [
      {
        columnId: 'isActive',
        title: t('tables.sections.columns.status'),
        options: [
          { value: 'active', label: t('common.active') },
          { value: 'inactive', label: t('common.inactive') },
        ],
      },
      ...(courseOptions.length > 0
        ? [{ columnId: 'course', title: t('tables.sections.columns.course'), options: courseOptions }]
        : []),
      ...(periodOptions.length > 0
        ? [{ columnId: 'period', title: t('tables.sections.columns.period'), options: periodOptions }]
        : []),
    ],
    [courseOptions, periodOptions, t],
  )

  // Fallback bulk actions used when the route doesn't pass `bulkActionsProp`.
  // Activate / Deactivate are upgraded to a real `BulkSectionStatusModal`
  // by the /classrooms route. The earlier `Send notification` entry was
  // dropped — its backend slice (#225) isn't built, and shipping a toast
  // placeholder for an unsupported flow confuses operators.
  const defaultBulkActions = useMemo<BulkAction<SectionResponseDto>[]>(
    () => [
      {
        id: 'activate',
        label: t('tables.sections.actions.activate'),
        icon: <ToggleRight className="w-4 h-4" />,
        onRun: (rows) => toast.info(t('common.comingSoon', {
          action: t('tables.sections.actions.activate'),
          countLabel: t('common.sections', { count: rows.length }),
        })),
      },
      {
        id: 'deactivate',
        label: t('tables.sections.actions.deactivate'),
        icon: <ToggleLeft className="w-4 h-4" />,
        onRun: (rows) => toast.info(t('common.comingSoon', {
          action: t('tables.sections.actions.deactivate'),
          countLabel: t('common.sections', { count: rows.length }),
        })),
      },
    ],
    [t],
  )

  const bulkActions = bulkActionsProp ?? defaultBulkActions

  return (
    <TanstackDataTable
      columns={columns}
      data={sections}
      getRowId={(section) => section.sectionId}
      isLoading={isLoading}
      tableId="academics.sections"
      enableSorting
      enableRowSelection
      enableColumnVisibility
      searchPlaceholder={t('tables.sections.search')}
      facets={facets}
      bulkActions={bulkActions}
      rowSelection={rowSelection}
      onRowSelectionChange={onRowSelectionChange}
      exportOptions={{ filename: 'sections', formats: ['csv'] }}
      defaultSort={[{ id: 'sectionNumber', desc: false }]}
      pagination={{ pageSize: 20 }}
      pageSizes={[10, 20, 50]}
      emptyState={{
        icon: <CalendarDays className="w-12 h-12 text-text-tertiary" />,
        title: t('tables.sections.empty.title'),
        description: t('tables.sections.empty.description'),
      }}
      labels={dataTableLabels}
      onRowClick={onViewSection}
      maxHeight="calc(100vh - 26rem)"
    />
  )
}
