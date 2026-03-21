/**
 * Staff Directory Page — V2
 *
 * Complete employee roster with V2 design system.
 * Features: V2 header, KPI tiles, filter strip with chips,
 * restyled TanStack table, split button, empty states.
 */

import { useState, useRef, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { StatCard, WidgetErrorBoundaryV2 } from '@edforge/ui'
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
    const headers = ['Name', 'Email', 'Role', 'Status', 'Phone', 'Hire Date']
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
      <div data-v2 style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
          <Users style={{ width: 48, height: 48, color: 'var(--v2-text-hint)', marginBottom: 12 }} />
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--v2-text-primary)', marginBottom: 8 }}>
            {t('error.failedToLoad')}
          </h3>
          <p style={{ fontSize: 12, color: 'var(--v2-text-muted)', marginBottom: 16 }}>{message}</p>
          {isRetryable && (
            <button
              type="button"
              onClick={() => refetch()}
              style={{
                height: 34,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 7,
                padding: '0 14px',
                fontSize: 12,
                fontWeight: 500,
                color: '#9aa0b8',
                cursor: 'pointer',
              }}
            >
              {t('error.tryAgain')}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div data-v2 style={{ padding: '24px 28px', overflow: 'auto' }}>
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: 'rgba(216,90,48,0.10)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Users style={{ width: 16, height: 16, color: '#D85A30' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <h1
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  letterSpacing: '-0.3px',
                  color: 'var(--v2-text-primary, #e8eaf0)',
                  margin: 0,
                }}
              >
                Staff Directory
              </h1>
              <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.10)', alignSelf: 'center' }} />
              <span style={{ fontSize: 12, color: 'var(--v2-text-muted, #7a8099)' }}>
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Split button */}
        {canCreate && (
          <div className="relative" ref={dropdownRef}>
            <div style={{ display: 'flex', alignItems: 'center', height: 36 }}>
              <button
                type="button"
                onClick={() => modal.openCreate()}
                style={{
                  height: 36,
                  background: '#1D9E75',
                  border: 'none',
                  borderRadius: '8px 0 0 8px',
                  padding: '0 14px',
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  borderRight: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                <UserPlus style={{ width: 12, height: 12 }} />
                Add Staff Member
              </button>
              <button
                type="button"
                onClick={() => setAddDropdownOpen(!addDropdownOpen)}
                style={{
                  height: 36,
                  width: 32,
                  background: '#1D9E75',
                  border: 'none',
                  borderRadius: '0 8px 8px 0',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="More add options"
              >
                <ChevronDown style={{ width: 11, height: 11 }} />
              </button>
            </div>
            {addDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  marginTop: 4,
                  width: 180,
                  background: 'var(--v2-bg-elevated, #1e2436)',
                  border: '1px solid var(--v2-border-default, rgba(255,255,255,0.06))',
                  borderRadius: 8,
                  padding: '4px 0',
                  zIndex: 30,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setAddDropdownOpen(false)
                    toast.info('Import from CSV coming soon')
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    fontSize: 11,
                    color: 'var(--v2-text-secondary, #c8ccd8)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  Import from CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddDropdownOpen(false)
                    toast.info('Bulk add coming soon')
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    fontSize: 11,
                    color: 'var(--v2-text-secondary, #c8ccd8)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  Bulk add
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CONTEXT BANNER */}
      <p style={{ fontSize: 11, color: 'var(--v2-text-muted, #7a8099)', marginBottom: 18 }}>
        <em style={{ fontStyle: 'normal', fontWeight: 500, color: '#D85A30' }}>
          {totalLoaded} active staff member{totalLoaded !== 1 ? 's' : ''}
        </em>
        {' · '}
        <span style={{ color: '#1D9E75', fontStyle: 'normal', fontWeight: 500 }}>
          {teacherCount} teacher{teacherCount !== 1 ? 's' : ''}
        </span>
        {' · '}
        <span style={{ color: '#7F77DD', fontStyle: 'normal', fontWeight: 500 }}>
          {principalCount} principal{principalCount !== 1 ? 's' : ''}
        </span>
        {' · '}
        <span style={{ color: '#378ADD', fontStyle: 'normal', fontWeight: 500 }}>
          {accessCount} with system access enabled
        </span>
      </p>

      {/* KPI TILES */}
      <WidgetErrorBoundaryV2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginBottom: 18 }}>
          <StatCard
            label="Total Staff"
            value={isLoading ? '—' : totalLoaded.toString()}
            icon={Users}
            accentColor="rgba(216,90,48,0.10)"
            iconColor="#D85A30"
            barColor="#D85A30"
            valueColor="#D85A30"
            tag={{ text: 'all active', color: '#D85A30', bg: 'rgba(216,90,48,0.10)' }}
            loading={isLoading}
          />
          <StatCard
            label="Teachers"
            value={isLoading ? '—' : teacherCount.toString()}
            icon={BookOpen}
            accentColor="rgba(29,158,117,0.10)"
            iconColor="#1D9E75"
            barColor="#1D9E75"
            valueColor="#1D9E75"
            tag={{ text: 'active', color: '#1D9E75', bg: 'rgba(29,158,117,0.10)' }}
            loading={isLoading}
          />
          <StatCard
            label="Support Staff"
            value={isLoading ? '—' : supportCount.toString()}
            icon={Briefcase}
            accentColor={supportCount > 0 ? 'rgba(55,138,221,0.10)' : 'rgba(255,255,255,0.06)'}
            iconColor={supportCount > 0 ? '#378ADD' : 'var(--v2-text-hint, #4a5068)'}
            barColor={supportCount > 0 ? '#378ADD' : 'var(--v2-text-ghost, #2a3045)'}
            valueColor={supportCount > 0 ? '#378ADD' : 'var(--v2-text-hint, #4a5068)'}
            tag={{
              text: supportCount > 0 ? 'active' : 'none yet',
              color: supportCount > 0 ? '#378ADD' : 'var(--v2-text-hint, #4a5068)',
              bg: supportCount > 0 ? 'rgba(55,138,221,0.10)' : 'rgba(255,255,255,0.05)',
            }}
            loading={isLoading}
          />
          <StatCard
            label="System Access"
            value={isLoading ? '—' : accessCount.toString()}
            icon={Lock}
            accentColor="rgba(55,138,221,0.10)"
            iconColor="#378ADD"
            barColor="#378ADD"
            valueColor="#378ADD"
            tag={{ text: `${noAccessCount} no access`, color: '#378ADD', bg: 'rgba(55,138,221,0.10)' }}
            loading={isLoading}
          />
        </div>
      </WidgetErrorBoundaryV2>

      {/* FILTER STRIP */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {(['all', 'teacher', 'principal', 'support'] as QuickFilter[]).map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => handleQuickFilter(chip)}
            style={{
              height: 30,
              padding: '0 10px',
              background: quickFilter === chip ? 'rgba(216,90,48,0.10)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${quickFilter === chip ? 'rgba(216,90,48,0.25)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 7,
              fontSize: 11,
              fontWeight: 500,
              color: quickFilter === chip ? '#D85A30' : 'var(--v2-text-hint, #4a5068)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
              transition: 'all 0.12s',
            }}
          >
            {chip === 'all' ? 'All' : chip === 'teacher' ? 'Teachers' : chip === 'principal' ? 'Principal' : 'Support'}
          </button>
        ))}

        {/* Search input */}
        <div style={{ flex: 1, minWidth: 200, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search style={{ position: 'absolute', left: 10, width: 12, height: 12, color: 'var(--v2-text-hint, #4a5068)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            style={{
              width: '100%',
              height: 32,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: '0 11px 0 32px',
              fontSize: 12,
              color: 'var(--v2-text-primary, #e8eaf0)',
              outline: 'none',
              colorScheme: 'dark',
            }}
          />
        </div>

        {/* Role dropdown */}
        <select
          value={filters.role || ''}
          onChange={(e) => {
            updateFilter('role', (e.target.value as StaffRole) || undefined)
            setQuickFilter('all')
          }}
          style={{
            height: 32,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            padding: '0 10px',
            fontSize: 11,
            color: 'var(--v2-text-muted, #7a8099)',
            outline: 'none',
            cursor: 'pointer',
            colorScheme: 'dark',
          }}
        >
          <option value="">All Roles</option>
          {ROLE_FILTER_VALUES.map((role) => (
            <option key={role} value={role}>
              {t(`roles.${getRoleI18nKey(role)}`, { defaultValue: role })}
            </option>
          ))}
        </select>

        {/* Department dropdown */}
        <select
          style={{
            height: 32,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            padding: '0 10px',
            fontSize: 11,
            color: 'var(--v2-text-muted, #7a8099)',
            outline: 'none',
            cursor: 'pointer',
            colorScheme: 'dark',
          }}
        >
          <option value="">All Departments</option>
        </select>

        {/* Export CSV */}
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={staffMembers.length === 0}
          style={{
            height: 32,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            padding: '0 12px',
            fontSize: 11,
            color: 'var(--v2-text-hint, #4a5068)',
            cursor: staffMembers.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            whiteSpace: 'nowrap',
            marginLeft: 'auto',
            opacity: staffMembers.length === 0 ? 0.5 : 1,
            transition: 'all 0.12s',
          }}
        >
          <Download style={{ width: 12, height: 12 }} />
          Export CSV
        </button>
      </div>

      {/* STAFF TABLE */}
      <StaffTable
        staff={staffMembers}
        isLoading={isLoading}
        onAddStaff={canCreate ? () => modal.openCreate() : undefined}
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
    </div>
  )
}
