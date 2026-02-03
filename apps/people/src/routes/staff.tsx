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

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Link } from '@tanstack/react-router'
import {
  UsersRound,
  Search,
  Plus,
  Users,
  GraduationCap,
  Briefcase,
  Award,
  Pencil,
  Trash2,
  ChevronRight,
} from 'lucide-react'
import type { UserResponseDto } from '@edforge/shared-types'
import { usePermission } from '@edforge/abac'

import { usePaginatedQuery, useDebounce, useModalState } from '../hooks'
import { DataTable, Button, type Column } from '../components/ui'
import { CreateUserModal, EditUserModal, DeleteConfirmDialog } from '../components/staff'
import { peopleService, parseApiError } from '../services/people.service'

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

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === 'TenantAdmin'
  return (
    <span
      className={`
        px-2 py-1 rounded-full text-xs font-medium
        ${isAdmin
          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
        }
      `}
    >
      {isAdmin ? 'Admin' : 'User'}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    suspended: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  }
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || styles.inactive}`}>
      {status}
    </span>
  )
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function StaffPage() {
  const queryClient = useQueryClient()

  // ABAC permission checks for staff management
  const canCreate = usePermission('create', 'staff')
  const canEdit = usePermission('edit', 'staff')
  const canDelete = usePermission('delete', 'staff')

  // Search state with debounce
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  // Modal state management
  const modal = useModalState<UserResponseDto>()

  // Paginated data fetching
  const {
    items: users,
    isLoading,
    hasMore,
    loadMore,
    isFetchingNextPage,
    error,
    refetch,
    totalLoaded,
  } = usePaginatedQuery<UserResponseDto>({
    queryKey: ['users', debouncedSearch],
    queryFn: ({ limit, cursor }) =>
      peopleService.listUsers(limit, cursor, debouncedSearch || undefined),
    limit: 20,
  })

  // Optimistic delete mutation
  const deleteMutation = useMutation({
    mutationFn: (userId: string) => peopleService.deleteUser(userId),
    onMutate: async (userId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['users'] })

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['users', debouncedSearch])

      // Optimistically remove the user from the cache
      queryClient.setQueryData(['users', debouncedSearch], (old: any) => {
        if (!old?.pages) return old
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.filter((u: UserResponseDto) => u.userId !== userId),
          })),
        }
      })

      return { previousData }
    },
    onError: (error, _userId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['users', debouncedSearch], context.previousData)
      }
      const { message } = parseApiError(error)
      toast.error(message)
    },
    onSuccess: () => {
      toast.success('User deleted successfully')
      modal.close()
    },
    onSettled: () => {
      // Invalidate to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  // Handle delete confirmation
  const handleDelete = async () => {
    if (!modal.data) return
    await deleteMutation.mutateAsync(modal.data.userId)
  }

  // Column configuration for DataTable
  const columns: Column<UserResponseDto>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent-primary/10 flex items-center justify-center text-sm font-medium text-accent-primary">
            {user.firstName?.[0]}{user.lastName?.[0]}
          </div>
          <div>
            <div className="font-medium text-text-primary">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-sm text-text-secondary">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'globalRole',
      header: 'Role',
      sortable: true,
      width: '120px',
      render: (user) => <RoleBadge role={user.globalRole} />,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '120px',
      render: (user) => <StatusBadge status={user.status} />,
    },
    {
      key: 'createdAt',
      header: 'Joined',
      sortable: true,
      width: '120px',
      render: (user) => (
        <span className="text-text-secondary text-sm">
          {new Date(user.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ]

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
              <Button onClick={modal.openCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Add Staff
              </Button>
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
            value="-"
            accent="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-500/10"
          />
          <StatCard
            icon={Briefcase}
            label="Support Staff"
            value="-"
            accent="text-purple-600 dark:text-purple-400"
            bg="bg-purple-500/10"
          />
          <StatCard
            icon={Award}
            label="Administrators"
            value="-"
            accent="text-amber-600 dark:text-amber-400"
            bg="bg-amber-500/10"
          />
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-4">
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
        </div>

        {/* Staff Data Table */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-secondary">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-text-secondary" />
              <h3 className="text-lg font-semibold text-text-primary">
                Staff Roster {!isLoading && `(${totalLoaded})`}
              </h3>
            </div>
          </div>

          <DataTable<UserResponseDto>
            columns={columns}
            data={users}
            keyExtractor={(user) => user.userId}
            isLoading={isLoading}
            skeletonRows={5}
            emptyState={{
              icon: <UsersRound className="w-12 h-12" />,
              title: search ? 'No results found' : 'No staff members yet',
              description: search
                ? `No staff members match "${search}"`
                : 'Get started by adding your first staff member to your organization.',
              action: canCreate && !search
                ? {
                    label: 'Add Staff Member',
                    onClick: modal.openCreate,
                  }
                : undefined,
            }}
            hasMore={hasMore}
            isFetchingMore={isFetchingNextPage}
            onLoadMore={loadMore}
            rowActions={(user) => (
              <>
                {/* View Detail */}
                <Link
                  to="/staff/$userId"
                  params={{ userId: user.userId }}
                  className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-tertiary transition-colors"
                  title="View details"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
                {/* Edit */}
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => modal.openEdit(user)}
                    className="p-2 rounded-lg text-text-tertiary hover:text-accent-primary hover:bg-accent-primary/10 transition-colors"
                    title="Edit user"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                {/* Delete */}
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => modal.openDelete(user)}
                    className="p-2 rounded-lg text-text-tertiary hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    title="Delete user"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          />
        </div>
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        open={modal.mode === 'create'}
        onClose={modal.close}
      />

      {/* Edit User Modal */}
      <EditUserModal
        open={modal.mode === 'edit'}
        onClose={modal.close}
        user={modal.data}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={modal.mode === 'delete'}
        onClose={modal.close}
        user={modal.data}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  )
}
