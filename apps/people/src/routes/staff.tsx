/**
 * Staff Directory Page — V2
 *
 * Complete employee roster with V2 design system.
 * Features: V2 header, KPI tiles, filter strip with chips,
 * restyled TanStack table, split button, empty states.
 */

import { useState, useRef, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  Users,
  Search,
  BookOpen,
  Briefcase,
  Lock,
  ChevronDown,
  UserPlus,
  Download,
} from 'lucide-react'
import { useTranslation } from '@edforge/i18n'
import {
  Container,
  ContextBar,
  ErrorState,
  focusRing,
  focusRingInset,
  Inline,
  Input,
  Select,
  StatCard,
  Text,
  WidgetErrorBoundaryV2,
  type SelectOption,
} from '@edforge/ui'
import type { StaffResponseDto } from '@aibrains/shared-types'
import type { StaffRole, EmploymentStatus } from '@aibrains/shared-types'
import { usePermission } from '@edforge/abac'
import { getRoleI18nKey } from '../components/staff/StaffRoleBadge'

import { usePaginatedQuery, useDebounce, useModalState } from '../hooks'
import { useActiveSchoolId } from '../stores/app.store'
import {
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

  // Quick filter chip handler
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

  // Split button dropdown state
  const [addDropdownOpen, setAddDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAddDropdownOpen(false)
      }
    }
    if (addDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [addDropdownOpen])

  // Modal state management
  const modal = useModalState<StaffResponseDto>()

  // Paginated data fetching
  const {
    items: staffMembers,
    isLoading,
    error,
    refetch,
    totalLoaded,
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

  // Optimistic delete mutation
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

  // Quick stats derived from loaded data
  const teacherCount = staffMembers.filter((s) => s.role === 'teacher').length
  const principalCount = staffMembers.filter(
    (s) => s.role === 'principal' || s.role === 'vice_principal',
  ).length
  const supportCount = staffMembers.filter(
    (s) => s.role === 'support_staff' || s.role === 'admin_staff' || s.role === 'it_staff',
  ).length
  const accessCount = staffMembers.filter((s) => !!s.userId).length
  const noAccessCount = staffMembers.length - accessCount

  // CSV export
  const handleExportCsv = () => {
    if (staffMembers.length === 0) return
    const headers = [
      t('export.headers.name'),
      t('export.headers.email'),
      t('export.headers.role'),
      t('export.headers.status'),
      t('export.headers.phone'),
      t('export.headers.hireDate'),
    ]
    const rows = staffMembers.map((s) => [
      `${s.firstName} ${s.lastSurname}`,
      s.email || '',
      s.role || '',
      s.employmentStatus || '',
      s.phone || '',
      s.hireDate ? new Date(s.hireDate).toLocaleDateString() : '',
    ])
    const csvContent = [headers, ...rows]
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

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffResponseDto | null>(null)

  const handleViewStaff = (staff: StaffResponseDto) => {
    setSelectedStaff(staff)
    setDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setSelectedStaff(null)
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

  const pageActions = canCreate ? (
    <div className="relative" ref={dropdownRef}>
      <Inline gap="none" className="h-9">
        <button
          type="button"
          onClick={() => navigate({ to: '/staff/new' })}
          className={`inline-flex h-9 items-center gap-1.5 rounded-l-lg border-r border-[rgb(var(--background-primary)/0.18)] bg-[rgb(var(--action-primary-bg))] px-3.5 text-xs font-medium text-[rgb(var(--text-inverted))] transition-colors hover:bg-[rgb(var(--state-info-fg))] ${focusRing}`}
        >
          <UserPlus className="h-3.5 w-3.5" />
          {t('staffDirectory.addStaff')}
        </button>
        <button
          type="button"
          onClick={() => setAddDropdownOpen(!addDropdownOpen)}
          className={`inline-flex h-9 w-8 items-center justify-center rounded-r-lg bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--text-inverted))] transition-colors hover:bg-[rgb(var(--state-info-fg))] ${focusRing}`}
          aria-label={t('actions.moreAddOptions')}
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </Inline>
      {addDropdownOpen && (
        <div className="absolute right-0 z-30 mt-1 w-44 rounded-lg border border-border-primary bg-surface-primary py-1 shadow-xl">
          <button
            type="button"
            onClick={() => {
              setAddDropdownOpen(false)
              modal.openCreate()
            }}
            className={`w-full px-3 py-2 text-left text-xs text-text-secondary transition-colors hover:bg-surface-secondary ${focusRingInset}`}
          >
            {t('quickAdd.menuLabel')}
          </button>
        </div>
      )}
    </div>
  ) : undefined

  return (
    <Container size="full" padding="lg" className="overflow-auto py-6">
      {/* Context Bar (operating context, not a page title — the shell breadcrumb
          carries "People › Staff") */}
      <h1 className="sr-only">{t('staffDirectory.title')}</h1>
      <ContextBar
        className="mb-2"
        meta={
          <span>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        }
        actions={pageActions}
      />

      {/* CONTEXT BANNER */}
      <Text variant="caption" className="mb-5">
        <em className="font-medium not-italic text-[rgb(var(--accent-coral-text))]">
          {t('staffDirectory.summary.activeStaff', { count: totalLoaded })}
        </em>
        {' · '}
        <span className="font-medium text-[rgb(var(--state-success-fg))]">
          {t('staffDirectory.summary.teachers', { count: teacherCount })}
        </span>
        {' · '}
        <span className="font-medium text-[rgb(var(--state-info-fg))]">
          {t('staffDirectory.summary.principals', { count: principalCount })}
        </span>
        {' · '}
        <span className="font-medium text-[rgb(var(--action-primary-bg))]">
          {t('staffDirectory.summary.systemAccess', { count: accessCount })}
        </span>
      </Text>

      {/* KPI TILES */}
      <WidgetErrorBoundaryV2>
        <div className="grid grid-cols-4 gap-2.5 mb-4">
          <StatCard
            label={t('stats.totalStaff')}
            value={isLoading ? '—' : totalLoaded.toString()}
            icon={Users}
            accentColor="rgba(216,90,48,0.10)"
            iconColor="#D85A30"
            barColor="#D85A30"
            valueColor="#D85A30"
            tag={{ text: t('stats.tags.allActive'), color: '#D85A30', bg: 'rgba(216,90,48,0.10)' }}
            loading={isLoading}
          />
          <StatCard
            label={t('stats.teachers')}
            value={isLoading ? '—' : teacherCount.toString()}
            icon={BookOpen}
            accentColor="rgba(29,158,117,0.10)"
            iconColor="#1D9E75"
            barColor="#1D9E75"
            valueColor="#1D9E75"
            tag={{ text: t('stats.tags.active'), color: '#1D9E75', bg: 'rgba(29,158,117,0.10)' }}
            loading={isLoading}
          />
          <StatCard
            label={t('stats.supportStaff')}
            value={isLoading ? '—' : supportCount.toString()}
            icon={Briefcase}
            accentColor={supportCount > 0 ? 'rgba(55,138,221,0.10)' : 'rgba(255,255,255,0.06)'}
            iconColor={supportCount > 0 ? '#378ADD' : 'rgb(var(--text-tertiary))'}
            barColor={supportCount > 0 ? '#378ADD' : 'rgb(var(--text-disabled))'}
            valueColor={supportCount > 0 ? '#378ADD' : 'rgb(var(--text-tertiary))'}
            tag={{
              text: supportCount > 0 ? t('stats.tags.active') : t('stats.tags.noneYet'),
              color: supportCount > 0 ? '#378ADD' : 'rgb(var(--text-tertiary))',
              bg: supportCount > 0 ? 'rgba(55,138,221,0.10)' : 'rgba(255,255,255,0.05)',
            }}
            loading={isLoading}
          />
          <StatCard
            label={t('stats.systemAccess')}
            value={isLoading ? '—' : accessCount.toString()}
            icon={Lock}
            accentColor="rgba(55,138,221,0.10)"
            iconColor="#378ADD"
            barColor="#378ADD"
            valueColor="#378ADD"
            tag={{ text: t('stats.tags.noAccess', { count: noAccessCount }), color: '#378ADD', bg: 'rgba(55,138,221,0.10)' }}
            loading={isLoading}
          />
        </div>
      </WidgetErrorBoundaryV2>

      {/* FILTER STRIP */}
      <Inline gap="sm" className="mb-3">
        {(['all', 'teacher', 'principal', 'support'] as QuickFilter[]).map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => handleQuickFilter(chip)}
            className={`inline-flex h-8 items-center whitespace-nowrap rounded-lg border px-3 text-xs font-medium transition-colors ${focusRingInset} ${quickFilter === chip ? 'border-[rgb(var(--action-primary-bg)/0.35)] bg-[rgb(var(--action-primary-bg)/0.10)] text-[rgb(var(--action-primary-bg))]' : 'border-border-secondary bg-surface-secondary text-text-tertiary hover:bg-surface-tertiary hover:text-text-primary'}`}
          >
            {t(`quickFilters.${chip}`)}
          </button>
        ))}

        {/* Search input */}
        <div className="flex min-w-52 flex-1 items-center">
          <Input
            size="sm"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('staffDirectory.searchPlaceholder')}
            prefix={<Search className="h-3.5 w-3.5" />}
            aria-label={t('staffDirectory.searchAria')}
          />
        </div>

        {/* Role dropdown */}
        <div className="w-44">
          <Select
            size="sm"
            aria-label={t('filters.roleAria')}
            options={roleOptions}
            value={filters.role ?? null}
            onChange={(value) => {
              updateFilter('role', (value as StaffRole) || undefined)
              setQuickFilter('all')
            }}
            placeholder={t('filters.allRoles')}
            clearable
          />
        </div>

        {/* Department dropdown */}
        <div className="w-44">
          <Select
            size="sm"
            aria-label={t('filters.departmentAria')}
            options={[]}
            value={null}
            onChange={() => {}}
            placeholder={t('filters.allDepartments')}
            disabled
          />
        </div>

        {/* Export CSV */}
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={staffMembers.length === 0}
          className={`ml-auto inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg border border-border-secondary bg-surface-secondary px-3 text-xs text-text-tertiary transition-colors hover:bg-surface-tertiary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50 ${focusRingInset}`}
        >
          <Download className="h-3.5 w-3.5" />
          {t('filters.exportCsv')}
        </button>
      </Inline>

      {/* STAFF TABLE */}
      <StaffTable
        staff={staffMembers}
        isLoading={isLoading}
        onAddStaff={canCreate ? () => navigate({ to: '/staff/new' }) : undefined}
        onViewStaff={handleViewStaff}
      />

      {/* STAFF DRAWER */}
      <StaffDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        staff={selectedStaff}
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

      {/* DELETE CONFIRMATION */}
      <DeleteConfirmDialog
        open={modal.mode === 'delete'}
        onClose={modal.close}
        staff={modal.data}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
      />
    </Container>
  )
}
