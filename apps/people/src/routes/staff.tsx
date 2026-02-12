/**
 * Staff Directory Page
 *
 * Complete employee roster for the People domain.
 * Features:
 * - DataTable with skeleton loading, empty state, sorting
 * - Search with debouncing
 * - Full CRUD (Create, Edit, Delete) with modals
 * - Optimistic updates for delete
 * - ABAC permission checks for actions
 * - Cursor-based pagination with "Load More"
 */

import { useState, useRef, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useNavigate } from '@tanstack/react-router'
import {
  UsersRound,
  Search,
  Users,
  GraduationCap,
  Briefcase,
  Award,
  ChevronDown,
  UserPlus,
  Zap,
  Filter,
  X,
} from 'lucide-react'
import type { StaffResponseDto } from '@aibrains/shared-types'
import type { StaffRole, EmploymentStatus } from '@aibrains/shared-types'
import { usePermission } from '@edforge/abac'

import { usePaginatedQuery, useDebounce, useModalState } from '../hooks'
import { Button } from '../components/ui'
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

const ROLE_FILTER_OPTIONS: { value: StaffRole; label: string }[] = [
  { value: 'teacher', label: 'Teacher' },
  { value: 'principal', label: 'Principal' },
  { value: 'vice_principal', label: 'Vice Principal' },
  { value: 'counselor', label: 'Counselor' },
  { value: 'librarian', label: 'Librarian' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'admin_staff', label: 'Admin Staff' },
  { value: 'support_staff', label: 'Support Staff' },
  { value: 'it_staff', label: 'IT Staff' },
  { value: 'substitute', label: 'Substitute' },
  { value: 'contractor', label: 'Contractor' },
]

const STATUS_FILTER_OPTIONS: { value: EmploymentStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'terminated', label: 'Terminated' },
  { value: 'retired', label: 'Retired' },
  { value: 'resigned', label: 'Resigned' },
]

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  bg,
}: {
  icon: typeof Users
  label: string
  value: string
  accent: string
  bg: string
}) {
  return (
    <div className="bg-surface-secondary rounded-xl border border-border-secondary p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`w-4 h-4 ${accent}`} />
        </div>
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="text-xl font-semibold text-text-primary">{value}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// FILTER CHIP
// ============================================================================

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 hover:text-teal-900 dark:hover:text-teal-100 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  )
}

// ============================================================================
// FILTER STATE
// ============================================================================

interface StaffFilters {
  role?: StaffRole
  employmentStatus?: EmploymentStatus
  department?: string
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function StaffPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // ABAC permission checks for staff management
  const canCreate = usePermission('create', 'staff')
  const canEdit = usePermission('edit', 'staff')
  const canDelete = usePermission('delete', 'staff')

  // Search state with debounce
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  // Filter state
  const [filters, setFilters] = useState<StaffFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const activeFilterCount = Object.values(filters).filter(Boolean).length

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

  const clearAllFilters = () => setFilters({})

  // Split button dropdown state
  const [addDropdownOpen, setAddDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
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

  // Paginated data fetching from Staff API
  const {
    items: staffMembers,
    isLoading,
    hasMore,
    loadMore,
    isFetchingNextPage,
    error,
    refetch,
    totalLoaded,
  } = usePaginatedQuery<StaffResponseDto>({
    queryKey: ['staff', debouncedSearch, filters],
    queryFn: ({ limit, cursor }) =>
      staffService.listStaff({
        limit,
        cursor,
        search: debouncedSearch || undefined,
        ...filters,
      }),
    limit: 20,
  })

  // Query key for cache operations
  const staffQueryKey = ['staff', debouncedSearch, filters]

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
      toast.success('Staff member deleted successfully')
      modal.close()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
  })

  // Handle delete confirmation
  const handleDelete = async () => {
    if (!modal.data) return
    await deleteMutation.mutateAsync(modal.data.staffId)
  }

  // Quick stats derived from loaded data
  const teacherCount = staffMembers.filter((s) => s.role === 'teacher').length
  const supportCount = staffMembers.filter((s) => s.role === 'support_staff').length
  const adminCount = staffMembers.filter((s) =>
    s.role === 'principal' || s.role === 'vice_principal' || s.role === 'admin_staff',
  ).length

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

  // Show error state
  if (error && !isLoading) {
    const { message, isRetryable } = parseApiError(error)
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <UsersRound className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">
            Failed to load staff
          </h3>
          <p className="text-text-secondary mb-4">{message}</p>
          {isRetryable && (
            <Button onClick={() => refetch()}>Try Again</Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full">
      {/* Page Header */}
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
                <UsersRound className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Staff Directory</h1>
                <p className="text-text-secondary mt-1">
                  Manage your organization's staff members and their access
                </p>
              </div>
            </div>
            {canCreate && (
              <div className="relative" ref={dropdownRef}>
                <div className="flex">
                  <Button onClick={() => navigate({ to: '/staff/new' })}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Staff Member
                  </Button>
                  <button
                    type="button"
                    onClick={() => setAddDropdownOpen(!addDropdownOpen)}
                    className="ml-px px-2 rounded-r-lg bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors border-l border-white/20"
                    aria-label="More options"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                {addDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-secondary))] shadow-lg z-30">
                    <button
                      type="button"
                      onClick={() => {
                        setAddDropdownOpen(false)
                        modal.openCreate()
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--interactive-hover))] transition-colors rounded-xl"
                    >
                      <Zap className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                      <div className="text-left">
                        <div className="font-medium">Quick Add User</div>
                        <div className="text-xs text-[rgb(var(--text-tertiary))]">Create user account only</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Total Staff"
            value={isLoading ? '-' : totalLoaded.toString()}
            accent="text-blue-600 dark:text-blue-400"
            bg="bg-blue-500/10"
          />
          <StatCard
            icon={GraduationCap}
            label="Teachers"
            value={isLoading ? '-' : teacherCount.toString()}
            accent="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-500/10"
          />
          <StatCard
            icon={Briefcase}
            label="Support Staff"
            value={isLoading ? '-' : supportCount.toString()}
            accent="text-purple-600 dark:text-purple-400"
            bg="bg-purple-500/10"
          />
          <StatCard
            icon={Award}
            label="Administrators"
            value={isLoading ? '-' : adminCount.toString()}
            accent="text-amber-600 dark:text-amber-400"
            bg="bg-amber-500/10"
          />
        </div>

        {/* Search & Filter Bar */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2.5 bg-surface-secondary border border-border-secondary rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-colors"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors text-sm font-medium ${
                showFilters || activeFilterCount > 0
                  ? 'bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-900/20 dark:border-teal-800 dark:text-teal-300'
                  : 'bg-surface-secondary border-border-secondary text-text-secondary hover:text-text-primary'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-teal-500 text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Collapsible Filter Panel */}
          {showFilters && (
            <div className="bg-surface-secondary border border-border-secondary rounded-xl p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-text-secondary">Role</label>
                  <select
                    value={filters.role || ''}
                    onChange={(e) => updateFilter('role', e.target.value as StaffRole || undefined)}
                    className="w-full px-3 py-2 bg-surface-primary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                  >
                    <option value="">All Roles</option>
                    {ROLE_FILTER_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-text-secondary">Employment Status</label>
                  <select
                    value={filters.employmentStatus || ''}
                    onChange={(e) => updateFilter('employmentStatus', e.target.value as EmploymentStatus || undefined)}
                    className="w-full px-3 py-2 bg-surface-primary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                  >
                    <option value="">All Statuses</option>
                    {STATUS_FILTER_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-text-secondary">Department</label>
                  <input
                    type="text"
                    value={filters.department || ''}
                    onChange={(e) => updateFilter('department', e.target.value || undefined)}
                    placeholder="Filter by department..."
                    className="w-full px-3 py-2 bg-surface-primary border border-border-secondary rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Active Filter Chips */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {filters.role && (
                <FilterChip
                  label={`Role: ${ROLE_FILTER_OPTIONS.find((o) => o.value === filters.role)?.label || filters.role}`}
                  onRemove={() => updateFilter('role', undefined)}
                />
              )}
              {filters.employmentStatus && (
                <FilterChip
                  label={`Status: ${STATUS_FILTER_OPTIONS.find((o) => o.value === filters.employmentStatus)?.label || filters.employmentStatus}`}
                  onRemove={() => updateFilter('employmentStatus', undefined)}
                />
              )}
              {filters.department && (
                <FilterChip
                  label={`Dept: ${filters.department}`}
                  onRemove={() => updateFilter('department', undefined)}
                />
              )}
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs text-text-tertiary hover:text-text-primary transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Staff Table */}
        <StaffTable
          staff={staffMembers}
          isLoading={isLoading}
          hasMore={hasMore}
          isFetchingMore={isFetchingNextPage}
          onLoadMore={loadMore}
          onAddStaff={canCreate ? () => navigate({ to: '/staff/new' }) : undefined}
          onViewStaff={handleViewStaff}
        />
      </div>

      {/* Staff Drawer */}
      <StaffDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        staff={selectedStaff}
        onEdit={canEdit ? (s: StaffResponseDto) => modal.openEdit(s) : undefined}
        onDelete={canDelete ? (s: StaffResponseDto) => modal.openDelete(s) : undefined}
      />

      {/* Create User Modal */}
      <CreateUserModal
        open={modal.mode === 'create'}
        onClose={modal.close}
      />

      {/* Edit Staff Modal */}
      <EditStaffModal
        open={modal.mode === 'edit'}
        onClose={modal.close}
        staff={modal.data}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={modal.mode === 'delete'}
        onClose={modal.close}
        staff={modal.data}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  )
}
