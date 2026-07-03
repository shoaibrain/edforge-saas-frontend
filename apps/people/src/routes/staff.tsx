/**
 * Staff Directory Page — canonical list recipe (T5.2)
 *
 * PageHeader (pagebar, ⑧ AttentionCorner pill in the attention slot) →
 * StatBand → shared DataTable with the unified toolbar (search · role
 * presets · Role facet · Export CSV) and ⑨ SelectionContextBar
 * (Export selected · Delete selected).
 *
 * Corner signals + StatBand derive from an UNFILTERED staff query (the same
 * hook the People Overview uses, so the ids/acks mean the same thing on both
 * pages and the KPIs don't churn while searching/filtering); the table runs
 * on the filtered, cursor-paginated query.
 */

import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Download, Trash2, UserPlus } from 'lucide-react'
import { useTranslation } from '@edforge/i18n'
import {
  AttentionCorner,
  AttentionCornerPill,
  AttentionCornerShade,
  Button,
  Container,
  ErrorState,
  focusRing,
  PageHeader,
  Select,
  SelectionContextBar,
  StatBand,
  useSignalAcks,
  type SelectionAction,
  type SelectOption,
  type Signal,
  type StatMetric,
} from '@edforge/ui'
import type { RowSelectionState } from '@tanstack/react-table'
import type { StaffResponseDto } from '@aibrains/shared-types'
import type { StaffRole, EmploymentStatus } from '@aibrains/shared-types'
import { usePermission } from '@edforge/abac'
import { getRoleI18nKey } from '../components/staff/StaffRoleBadge'

import { usePaginatedQuery, useDebounce, useModalState, useStaffList } from '../hooks'
import { useActiveSchoolId } from '../stores/app.store'
import { getStaffAvatar } from '../lib/avatar'
import {
  BulkDeleteStaffModal,
  CreateUserModal,
  EditStaffModal,
  DeleteConfirmDialog,
  StaffTable,
  StaffDrawer,
} from '../components/staff'
import { staffService } from '../services/staff.service'
import { parseApiError } from '../services/people.service'

// ============================================================================
// CONSTANTS
// ============================================================================

const ROLE_FILTER_VALUES: StaffRole[] = [
  'teacher', 'principal', 'vice_principal', 'counselor', 'librarian',
  'nurse', 'admin_staff', 'support_staff', 'it_staff', 'substitute', 'contractor',
]

type QuickFilter = 'all' | 'teacher' | 'principal' | 'support'

// ============================================================================
// FILTER STATE
// ============================================================================

interface StaffFilters {
  role?: StaffRole
  employmentStatus?: EmploymentStatus
}

// ============================================================================
// CSV EXPORT (shared by the toolbar button and the selection-bar action)
// ============================================================================

type Translate = ReturnType<typeof useTranslation>['t']

function exportStaffCsv(rows: StaffResponseDto[], t: Translate) {
  if (rows.length === 0) return
  const headers = [
    t('export.headers.name'),
    t('export.headers.email'),
    t('export.headers.role'),
    t('export.headers.status'),
    t('export.headers.phone'),
    t('export.headers.hireDate'),
  ]
  const body = rows.map((s) => [
    `${s.firstName} ${s.lastSurname}`,
    s.email || '',
    s.role || '',
    s.employmentStatus || '',
    s.phone || '',
    s.hireDate ? new Date(s.hireDate).toLocaleDateString() : '',
  ])
  const csvContent = [headers, ...body]
    .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `staff-directory-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function StaffPage() {
  const { t } = useTranslation('people')
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const schoolId = useActiveSchoolId()

  // ABAC permission checks
  const canCreate = usePermission('create', 'staff')
  const canEdit = usePermission('edit', 'staff')
  const canDelete = usePermission('delete', 'staff')

  // Search state with debounce
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  // Filter state
  const [filters, setFilters] = useState<StaffFilters>({})
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all')

  const updateFilter = <K extends keyof StaffFilters>(key: K, value: StaffFilters[K]) => {
    setFilters((prev) => {
      const next = { ...prev }
      if (value) {
        next[key] = value
      } else {
        delete next[key]
      }
      return next
    })
  }

  // Quick filter preset handler (unified-toolbar presets)
  const handleQuickFilter = (chip: QuickFilter) => {
    setQuickFilter(chip)
    if (chip === 'all') {
      updateFilter('role', undefined)
    } else if (chip === 'teacher') {
      updateFilter('role', 'teacher')
    } else if (chip === 'principal') {
      updateFilter('role', 'principal')
    } else if (chip === 'support') {
      updateFilter('role', 'support_staff')
    }
  }

  // Modal state management
  const modal = useModalState<StaffResponseDto>()

  // Filtered, cursor-paginated table data
  const {
    items: staffMembers,
    isLoading,
    error,
    refetch,
    hasMore,
    isFetchingNextPage,
    loadMore,
  } = usePaginatedQuery<StaffResponseDto>({
    queryKey: ['staff', schoolId, debouncedSearch, filters],
    queryFn: ({ limit, cursor }) =>
      staffService.listStaff({
        limit,
        cursor,
        search: debouncedSearch || undefined,
        schoolId: schoolId || undefined,
        ...filters,
      }),
    limit: 20,
  })

  const staffQueryKey = ['staff', schoolId, debouncedSearch, filters]

  // Unfiltered roster — feeds the ⑧ corner signals and the StatBand so they
  // stay stable under search/role filters and match the Overview's numbers
  // (same hook + key as overview.tsx → TanStack shares the cache entry).
  const { items: allStaff, isLoading: rosterLoading } = useStaffList(
    schoolId ? { schoolId } : undefined,
  )

  // Optimistic delete mutation (single-row flow via the drawer)
  const deleteMutation = useMutation({
    mutationFn: (staffId: string) => staffService.deleteStaff(staffId),
    onMutate: async (staffId) => {
      await queryClient.cancelQueries({ queryKey: ['staff'] })
      const previousData = queryClient.getQueryData(staffQueryKey)
      queryClient.setQueryData(staffQueryKey, (old: any) => {
        if (!old?.pages) return old
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.filter((s: StaffResponseDto) => s.staffId !== staffId),
          })),
        }
      })
      return { previousData }
    },
    onError: (error, _staffId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(staffQueryKey, context.previousData)
      }
      const { message } = parseApiError(error)
      toast.error(message)
    },
    onSuccess: () => {
      toast.success(t('toast.deleteSuccess'))
      modal.close()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
  })

  const handleDelete = async () => {
    if (!modal.data) return
    await deleteMutation.mutateAsync(modal.data.staffId)
  }

  // Roster stats (unfiltered — StatBand + corner)
  const stats = useMemo(() => {
    const teachers = allStaff.filter((s) => s.role === 'teacher').length
    const support = allStaff.filter(
      (s) => s.role === 'support_staff' || s.role === 'admin_staff' || s.role === 'it_staff',
    ).length
    const withAccess = allStaff.filter((s) => !!s.userId).length
    return {
      total: allStaff.length,
      teachers,
      support,
      withAccess,
      noAccess: allStaff.length - withAccess,
      unassigned: allStaff.filter((s) => !s.departmentName).length,
    }
  }, [allStaff])

  // ── ⑧ Attention Corner signals (spec §7b) — same ids as the Overview so
  // acknowledgements roam between the two pages. No `fix` link: this page IS
  // the fixing surface.
  const { acked, ack, unack } = useSignalAcks()
  const signals: Signal[] = []
  if (!rosterLoading) {
    if (stats.unassigned > 0) {
      signals.push({
        id: 'people.unassignedDepartment',
        severity: 'warn',
        domain: t('headerZone.domains.capacity'),
        title: t('overview.signals.unassignedTitle', { count: stats.unassigned }),
        description: t('overview.signals.unassignedDescription'),
      })
    }
    if (stats.noAccess > 0) {
      signals.push({
        id: 'people.noSystemAccess',
        severity: 'info',
        domain: t('headerZone.domains.dataQuality'),
        title: t('overview.signals.noAccessTitle', { count: stats.noAccess }),
        description: t('overview.signals.noAccessDescription'),
      })
    }
  }

  // ── StatBand metrics (calm; mirror the Overview's signatures) ────────────
  const metrics: StatMetric[] = [
    {
      label: t('stats.totalStaff'),
      value: rosterLoading ? '—' : String(stats.total),
      iconSignature: 'people',
      state: 'normal',
      primary: true,
      sub: t('stats.tags.allActive'),
    },
    {
      label: t('stats.teachers'),
      value: rosterLoading ? '—' : String(stats.teachers),
      iconSignature: 'academics',
      state: 'normal',
      sub: t('stats.tags.active'),
    },
    {
      label: t('stats.supportStaff'),
      value: rosterLoading ? '—' : String(stats.support),
      iconSignature: 'staff',
      state: stats.support > 0 ? 'normal' : 'muted',
      sub: stats.support > 0 ? t('stats.tags.active') : t('stats.tags.noneYet'),
    },
    {
      label: t('stats.systemAccess'),
      value: rosterLoading ? '—' : String(stats.withAccess),
      iconSignature: 'security',
      state: 'normal',
      sub: t('stats.tags.noAccess', { count: stats.noAccess }),
    },
  ]

  // ── ⑨ Selection Context Bar ───────────────────────────────────────────────
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState<StaffResponseDto[] | null>(null)

  const selectedStaff = useMemo(() => {
    const ids = new Set(Object.keys(rowSelection).filter((id) => rowSelection[id]))
    return staffMembers.filter((s) => ids.has(s.staffId))
  }, [rowSelection, staffMembers])

  const selectionActions = useMemo<SelectionAction[]>(() => {
    const byId = new Map(selectedStaff.map((s) => [s.staffId, s]))
    const rowsFor = (ids: string[]) =>
      ids.map((id) => byId.get(id)).filter((s): s is StaffResponseDto => !!s)
    const allIds = selectedStaff.map((s) => s.staffId)
    return [
      {
        id: 'export-selected',
        label: t('staffDirectory.bulk.exportSelected'),
        icon: <Download className="h-3.5 w-3.5" />,
        applicableIds: allIds,
        onAction: (ids) => exportStaffCsv(rowsFor(ids), t),
      },
      {
        id: 'delete',
        label: t('staffDirectory.bulk.deleteSelected'),
        icon: <Trash2 className="h-3.5 w-3.5" />,
        danger: true,
        applicableIds: allIds,
        locked: !canDelete,
        lockedReason: t('staffDirectory.bulk.requiresDelete'),
        onAction: (ids) => setBulkDeleteTarget(rowsFor(ids)),
      },
    ]
  }, [selectedStaff, canDelete, t])

  const singleSelected = selectedStaff.length === 1 ? selectedStaff[0] : null
  const selectionBar = (
    <SelectionContextBar
      selectedCount={selectedStaff.length}
      totalCount={staffMembers.length}
      onClear={() => setRowSelection({})}
      onSelectAll={() =>
        setRowSelection(Object.fromEntries(staffMembers.map((s) => [s.staffId, true])))
      }
      actions={selectionActions}
      aria-label={t('dataTable.selection.aria')}
      labels={{
        selected: (count) => t('dataTable.selection.selected', { count }),
        selectAll: (total) => t('dataTable.selection.selectAll', { count: total }),
        clear: t('dataTable.selection.clear'),
      }}
      peek={
        singleSelected ? (
          <div className="flex min-w-0 items-center gap-2.5">
            <img
              src={getStaffAvatar(singleSelected.staffId)}
              alt=""
              className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[rgb(var(--text-primary))]">
                {singleSelected.firstName} {singleSelected.lastSurname}
              </div>
              <div className="truncate text-2xs text-[rgb(var(--text-tertiary))]">
                {singleSelected.role
                  ? t(`roles.${getRoleI18nKey(singleSelected.role)}`, { defaultValue: singleSelected.role })
                  : t('common.unknown')}
                {singleSelected.email ? ` · ${singleSelected.email}` : ''}
              </div>
            </div>
          </div>
        ) : undefined
      }
    />
  )

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedForDrawer, setSelectedForDrawer] = useState<StaffResponseDto | null>(null)

  const handleViewStaff = (staff: StaffResponseDto) => {
    setSelectedForDrawer(staff)
    setDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setSelectedForDrawer(null)
  }

  // Error state
  if (error && !isLoading) {
    const { message, isRetryable } = parseApiError(error)
    return (
      <Container size="full" padding="lg" className="py-6">
        <ErrorState
          title={t('error.failedToLoad')}
          description={message}
          action={
            isRetryable ? (
              <button
                type="button"
                onClick={() => refetch()}
                className={`inline-flex h-9 items-center rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] px-3.5 text-xs font-medium text-[rgb(var(--text-secondary))] transition-colors hover:bg-[rgb(var(--background-tertiary))] ${focusRing}`}
              >
                {t('error.tryAgain')}
              </button>
            ) : undefined
          }
        />
      </Container>
    )
  }

  const roleOptions: SelectOption[] = ROLE_FILTER_VALUES.map((role) => ({
    value: role,
    label: t(`roles.${getRoleI18nKey(role)}`, { defaultValue: role }),
  }))

  return (
    <Container size="full" padding="lg" className="overflow-auto py-6">
      {/* Screen-reader page heading (breadcrumb names the page visually) */}
      <h1 className="sr-only">{t('staffDirectory.title')}</h1>

      {/* ---- ⑧ Header zone — attention pill left, actions right ---- */}
      <div className="mb-4">
        <AttentionCorner
          signals={signals}
          acked={acked}
          onAck={ack}
          onUnack={unack}
          labels={{
            needAttention: t('headerZone.needAttention'),
            allClear: t('headerZone.allClear'),
            region: t('headerZone.region'),
            minimize: t('headerZone.minimize'),
            acknowledge: t('headerZone.acknowledge'),
            acknowledged: t('headerZone.acknowledged'),
            acknowledgedHint: t('headerZone.acknowledgedHint'),
            dismiss: t('headerZone.dismiss'),
            emptyTitle: t('headerZone.emptyTitle'),
          }}
        >
          <PageHeader
            mode="pagebar"
            attention={<AttentionCornerPill data-testid="attention-pill" />}
            actions={
              canCreate
                ? [
                    {
                      label: t('quickAdd.menuLabel'),
                      icon: <UserPlus className="h-3.5 w-3.5" />,
                      onClick: () => modal.openCreate(),
                    },
                    {
                      label: t('staffDirectory.addStaff'),
                      icon: <UserPlus className="h-3.5 w-3.5" />,
                      primary: true,
                      onClick: () => navigate({ to: '/staff/new' }),
                    },
                  ]
                : []
            }
          />
          <AttentionCornerShade />
        </AttentionCorner>
      </div>

      {/* ---- StatBand — roster KPIs (unfiltered) ---- */}
      <div className="mb-4">
        <StatBand metrics={metrics} ariaLabel={t('overview.kpi.region')} />
      </div>

      {/* ---- Staff table — unified toolbar + ⑨ selection ---- */}
      <StaffTable
        staff={staffMembers}
        isLoading={isLoading}
        onAddStaff={canCreate ? () => navigate({ to: '/staff/new' }) : undefined}
        onViewStaff={handleViewStaff}
        searchPlaceholder={t('staffDirectory.searchPlaceholder')}
        searchValue={search}
        onSearchChange={setSearch}
        presets={(['all', 'teacher', 'principal', 'support'] as QuickFilter[]).map((chip) => ({
          value: chip,
          label: t(`quickFilters.${chip}`),
        }))}
        activePreset={quickFilter}
        onPresetChange={(v) => handleQuickFilter(v as QuickFilter)}
        primaryFilter={
          /* Department facet returns when the people app productizes a
             departments source (useDepartments in the staff wizard). */
          <Select
            size="sm"
            className="w-44"
            aria-label={t('filters.roleAria')}
            options={roleOptions}
            value={filters.role ?? null}
            onChange={(value) => {
              updateFilter('role', (value as StaffRole) || undefined)
              setQuickFilter('all')
            }}
            placeholder={t('filters.allRoles')}
            clearable
            buttonClassName="border-[rgb(var(--border-primary)/0.35)]"
          />
        }
        toolbarExtra={
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportStaffCsv(staffMembers, t)}
            disabled={staffMembers.length === 0}
            className="border-[rgb(var(--border-primary)/0.35)]"
          >
            <Download className="h-3.5 w-3.5" />
            {t('filters.exportCsv')}
          </Button>
        }
        hasMore={hasMore}
        isFetchingMore={isFetchingNextPage}
        onLoadMore={loadMore}
        selectionBar={selectionBar}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />

      {/* STAFF DRAWER */}
      <StaffDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        staff={selectedForDrawer}
        onEdit={canEdit ? (s: StaffResponseDto) => modal.openEdit(s) : undefined}
        onDelete={canDelete ? (s: StaffResponseDto) => modal.openDelete(s) : undefined}
      />

      {/* CREATE USER MODAL */}
      <CreateUserModal
        open={modal.mode === 'create'}
        onClose={modal.close}
      />

      {/* EDIT STAFF MODAL */}
      <EditStaffModal
        open={modal.mode === 'edit'}
        onClose={modal.close}
        staff={modal.data}
      />

      {/* DELETE CONFIRMATION (single-row, via drawer) */}
      <DeleteConfirmDialog
        open={modal.mode === 'delete'}
        onClose={modal.close}
        staff={modal.data}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
      />

      {/* ⑨ BULK DELETE (selection bar) */}
      <BulkDeleteStaffModal
        open={!!bulkDeleteTarget}
        staff={bulkDeleteTarget ?? []}
        onClose={() => setBulkDeleteTarget(null)}
        onComplete={() => setRowSelection({})}
      />
    </Container>
  )
}
