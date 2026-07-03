/**
 * StaffTable Component
 *
 * Paginated staff roster on the shared DataTable with the unified toolbar
 * (search · role presets · primary facet · export) and ⑨ selection support.
 * Row click opens the quick-info drawer (managed by parent); row-level edit
 * and delete live in that drawer.
 */

import { useMemo, type MouseEvent, type ReactNode } from 'react'
import { UsersRound, Eye } from 'lucide-react'
import { useTranslation } from '@edforge/i18n'
import type { OnChangeFn, RowSelectionState } from '@tanstack/react-table'
import {
  createSelectColumn,
  focusRingInset,
  IdentityCell,
  StatusBadge,
  TanstackDataTable,
  type ColumnDef,
  type DataTableLabels,
  type TablePreset,
} from '@edforge/ui'
import type { StaffResponseDto } from '@aibrains/shared-types'
import { StaffRoleChip } from './StaffRoleChip'
import { getStatusI18nKey } from './StaffStatusBadge'
import { AccessChip } from './AccessChip'
import { getStaffAvatar } from '../../lib/avatar'
import { formatDate } from '../../lib/utils'

// ============================================================================
// TYPES
// ============================================================================

interface StaffTableProps {
  staff: StaffResponseDto[]
  isLoading?: boolean
  onAddStaff?: () => void
  onViewStaff?: (staff: StaffResponseDto) => void
  /** Unified toolbar wiring (search is controlled by the page's debounce). */
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  presets?: TablePreset[]
  activePreset?: string
  onPresetChange?: (value: string) => void
  primaryFilter?: ReactNode
  toolbarExtra?: ReactNode
  /** Cursor pagination (usePaginatedQuery) — staff #21+ are reachable now. */
  hasMore?: boolean
  isFetchingMore?: boolean
  onLoadMore?: () => void
  /** ⑨ Selection Context Bar node — morphs the toolbar in place on selection.
   *  Row ids are staffIds, so the page can map its selection state to rows. */
  selectionBar?: ReactNode
  rowSelection?: RowSelectionState
  onRowSelectionChange?: OnChangeFn<RowSelectionState>
}

// ============================================================================
// STAFF TABLE COMPONENT
// ============================================================================

export function StaffTable({
  staff,
  isLoading = false,
  onAddStaff,
  onViewStaff,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  presets,
  activePreset,
  onPresetChange,
  primaryFilter,
  toolbarExtra,
  hasMore,
  isFetchingMore,
  onLoadMore,
  selectionBar,
  rowSelection,
  onRowSelectionChange,
}: StaffTableProps) {
  const { t } = useTranslation('people')

  // People has no i18n lib module (unlike academics' useAcademicsI18n) —
  // this is the namespace's only DataTable consumer, so the label map
  // lives here, built from the shared dataTable.* vocabulary.
  const labels = useMemo<DataTableLabels>(
    () => ({
      errorTitle: t('dataTable.errorTitle'),
      errorDescription: t('dataTable.errorDescription'),
      retry: t('dataTable.retry'),
      clearSearch: t('dataTable.clearSearch'),
      clearFilters: t('dataTable.clearFilters'),
      clearActiveFilters: (count) => t('dataTable.clearActiveFilters', { count }),
      clearSelection: t('dataTable.clearSelection'),
      selectedRows: (count) => t('dataTable.selectedRows', { count }),
      paginationShowing: (start, end, total) =>
        t('dataTable.paginationShowing', { start, end, total }),
      rowsPerPage: (size) => t('dataTable.rowsPerPage', { size }),
      previousPage: t('dataTable.previousPage'),
      nextPage: t('dataTable.nextPage'),
      loadingPage: t('dataTable.loadingPage'),
      rowDensity: t('dataTable.rowDensity'),
      comfortableDensity: t('dataTable.comfortableDensity'),
      comfortableDensityTitle: t('dataTable.comfortableDensityTitle'),
      compactDensity: t('dataTable.compactDensity'),
      compactDensityTitle: t('dataTable.compactDensityTitle'),
      viewOptions: t('dataTable.viewOptions'),
      toggleColumns: t('dataTable.toggleColumns'),
      moreFilters: t('dataTable.moreFilters'),
      export: t('dataTable.export'),
      exportFormat: (format) => t(`dataTable.exportFormats.${format}`),
      xlsxUnavailable: t('dataTable.xlsxUnavailable'),
      filterAriaLabel: (title) => t('dataTable.filterAriaLabel', { title }),
      clearFilter: t('dataTable.clearFilter'),
    }),
    [t],
  )

  const columns: ColumnDef<StaffResponseDto, unknown>[] = useMemo(
    () => [
      createSelectColumn<StaffResponseDto>(),
      {
        id: 'name',
        accessorFn: (row) => `${row.firstName} ${row.lastSurname}`,
        header: t('tableHeaders.staff'),
        size: 280,
        cell: ({ row }) => {
          const s = row.original
          return (
            <IdentityCell
              name={`${s.firstName} ${s.lastSurname}`}
              avatarSrc={getStaffAvatar(s.staffId)}
              secondary={s.email}
            />
          )
        },
      },
      {
        accessorKey: 'role',
        header: t('tableHeaders.role'),
        size: 140,
        cell: ({ row }) => <StaffRoleChip role={row.original.role} />,
      },
      {
        accessorKey: 'employmentStatus',
        header: t('tableHeaders.status'),
        size: 120,
        cell: ({ row }) => {
          const status = row.original.employmentStatus
          const isActive = status === 'active'
          return (
            <StatusBadge tone={isActive ? 'success' : 'neutral'} dot>
              {status ? t(`employmentStatus.${getStatusI18nKey(status)}`, { defaultValue: status.replace('_', ' ') }) : t('common.unknown')}
            </StatusBadge>
          )
        },
      },
      {
        accessorKey: 'hireDate',
        header: t('tableHeaders.hired'),
        size: 120,
        cell: ({ row }) => (
          <span className="text-xs text-[rgb(var(--text-tertiary))] tabular-nums">
            {formatDate(row.original.hireDate)}
          </span>
        ),
      },
      {
        accessorKey: 'departmentName',
        header: t('tableHeaders.department'),
        size: 140,
        enableSorting: false,
        cell: ({ row }) => (
          <span
            className={`text-xs ${row.original.departmentName ? 'text-[rgb(var(--text-tertiary))]' : 'text-[rgb(var(--text-disabled))]'}`}
          >
            {row.original.departmentName || '—'}
          </span>
        ),
      },
      {
        id: 'systemAccess',
        accessorFn: (row) => (row.userId ? 'active' : 'none'),
        header: t('tableHeaders.systemAccess'),
        size: 130,
        enableSorting: false,
        cell: ({ row }) => <AccessChip hasAccess={!!row.original.userId} />,
      },
      {
        id: 'actions',
        header: '',
        size: 56,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end">
            <ActionBtn
              icon={<Eye className="h-3.5 w-3.5" />}
              title={t('actions.view')}
              onClick={(e) => {
                e.stopPropagation()
                onViewStaff?.(row.original)
              }}
            />
          </div>
        ),
      },
    ],
    [t, onViewStaff],
  )

  const serverPagination = onLoadMore
    ? { hasMore: Boolean(hasMore), isFetching: Boolean(isFetchingMore), onLoadMore }
    : undefined

  return (
    <TanstackDataTable
      columns={columns}
      data={staff}
      getRowId={(s) => s.staffId}
      isLoading={isLoading}
      tableId="people.staff"
      enableSorting={true}
      enableRowSelection
      searchPlaceholder={searchPlaceholder}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      presets={presets}
      activePreset={activePreset}
      onPresetChange={onPresetChange}
      primaryFilter={primaryFilter}
      toolbarExtra={toolbarExtra}
      selectionBar={selectionBar}
      rowSelection={rowSelection}
      onRowSelectionChange={onRowSelectionChange}
      pagination={{ pageSize: 20 }}
      serverPagination={serverPagination}
      maxHeight="calc(100vh - 22rem)"
      labels={labels}
      emptyState={{
        icon: <UsersRound className="w-10 h-10" />,
        title: t('empty.noStaff'),
        description: t('empty.getStarted'),
        action: onAddStaff
          ? { label: t('staffDirectory.addStaff'), onClick: onAddStaff }
          : undefined,
      }}
      onRowClick={onViewStaff}
    />
  )
}

// ============================================================================
// ACTION BUTTON
// ============================================================================

function ActionBtn({
  icon,
  title,
  onClick,
}: {
  icon: ReactNode
  title: string
  onClick: (e: MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`ef-motion flex h-7 w-7 items-center justify-center rounded-md text-[rgb(var(--text-tertiary))] transition-colors hover:bg-[rgb(var(--background-tertiary))] hover:text-[rgb(var(--text-secondary))] ${focusRingInset}`}
    >
      {icon}
    </button>
  )
}
