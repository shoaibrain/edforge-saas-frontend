/**
 * User Account Management Page
 *
 * Full-featured user management with DataTable, stat cards,
 * role/status filters, and action modals (change role, enable/disable, delete).
 */

import { useState, useMemo, useCallback } from 'react'
import { Navigate } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  ShieldX,
  Search,
  Shield,
  ShieldCheck,
  UserCog,
  Trash2,
  MoreHorizontal,
  UserCheck,
  UserX,
  AlertTriangle,
  X,
  Loader2,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from 'lucide-react'
import { Button, TanstackDataTable, createActionsColumn, type ColumnDef } from '@edforge/ui'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { can } from '@edforge/abac'
import { useUsers, useChangeGlobalRole, useUpdateUserStatus, useDeleteUser } from '@/hooks/useUsers'
import type { UserResponseDto, ListUsersParams } from '@/services/users.service'
import type { GlobalRole } from '@edforge/types'
import {
  SettingsPageHeader,
  fadeInUp,
  staggerChildren,
} from '@/components/settings/SettingsShared'

// ============================================================================
// CONSTANTS
// ============================================================================

const ROLE_OPTIONS: { value: GlobalRole; label: string }[] = [
  { value: 'TenantAdmin', label: 'Tenant Admin' },
  { value: 'StandardUser', label: 'Standard User' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'pending', label: 'Pending' },
]

// ============================================================================
// HELPERS
// ============================================================================

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return { bg: 'bg-[rgb(var(--state-success-bg)/0.18)] ', text: 'text-[rgb(var(--state-success-fg))] ', icon: CheckCircle2 }
    case 'inactive':
      return { bg: 'bg-[rgb(var(--background-tertiary))] dark:bg-[rgb(var(--background-tertiary))]0/20', text: 'text-[rgb(var(--text-secondary))] ', icon: UserX }
    case 'suspended':
      return { bg: 'bg-[rgb(var(--state-danger-bg)/0.18)] dark:bg-[rgb(var(--state-danger-bg)/0.18)]0/20', text: 'text-[rgb(var(--state-danger-fg))] dark:text-[rgb(var(--state-danger-fg))]', icon: ShieldAlert }
    case 'pending':
      return { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-400', icon: Clock }
    default:
      return { bg: 'bg-[rgb(var(--background-tertiary))] dark:bg-[rgb(var(--background-tertiary))]0/20', text: 'text-[rgb(var(--text-secondary))] ', icon: Clock }
  }
}

function getRoleBadge(role: string) {
  if (role === 'TenantAdmin') {
    return { bg: 'bg-violet-100 dark:bg-violet-500/20', text: 'text-violet-700 dark:text-violet-400' }
  }
  return { bg: 'bg-[rgb(var(--state-info-bg)/0.18)] dark:bg-[rgb(var(--state-info-bg)/0.18)]0/20', text: 'text-[rgb(var(--state-info-fg))] dark:text-[rgb(var(--state-info-fg))]' }
}

// ============================================================================
// STAT CARD
// ============================================================================

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  icon: typeof Users
  color: string
}) {
  return (
    <motion.div
      variants={fadeInUp}
      className="bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-primary))] rounded-xl p-4"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-[rgb(var(--text-tertiary))]">{label}</p>
          <p className="text-xl font-bold text-[rgb(var(--text-primary))]">{value}</p>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// CHANGE ROLE MODAL
// ============================================================================

function ChangeRoleModal({
  user,
  onClose,
}: {
  user: UserResponseDto
  onClose: () => void
}) {
  const [newRole, setNewRole] = useState<GlobalRole>(user.globalRole)
  const mutation = useChangeGlobalRole()

  const handleSubmit = async () => {
    if (newRole === user.globalRole) return
    await mutation.mutateAsync({ userId: user.userId, newRole })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(var(--background-overlay)/0.50)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[rgb(var(--background-primary))] rounded-xl border border-[rgb(var(--border-primary))] shadow-xl w-full max-w-md mx-4 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Change Role</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-hover))] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-[rgb(var(--text-secondary))] mb-4">
          Change role for <strong>{user.firstName} {user.lastName}</strong>
        </p>

        <select
          value={newRole}
          onChange={(e) => setNewRole(e.target.value as GlobalRole)}
          className="w-full px-3 py-2.5 bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-secondary))] rounded-lg text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] mb-6"
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending || newRole === user.globalRole}
            isLoading={mutation.isPending}
          >
            <ShieldCheck className="w-4 h-4 mr-1.5" />
            Update Role
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

// ============================================================================
// CONFIRM ACTION MODAL
// ============================================================================

type ConfirmAction = 'activate' | 'deactivate' | 'suspend' | 'delete'

const ACTION_CONFIG: Record<ConfirmAction, { title: string; description: string; buttonLabel: string; color: string }> = {
  activate: {
    title: 'Activate User',
    description: 'This will restore the user\'s access to the platform.',
    buttonLabel: 'Activate',
    color: 'bg-[rgb(var(--state-success-fg))] hover:bg-[rgb(var(--state-success-fg))]',
  },
  deactivate: {
    title: 'Deactivate User',
    description: 'This will revoke the user\'s access. They can be reactivated later.',
    buttonLabel: 'Deactivate',
    color: 'bg-amber-500 hover:bg-amber-600',
  },
  suspend: {
    title: 'Suspend User',
    description: 'This will immediately revoke all access and active sessions.',
    buttonLabel: 'Suspend',
    color: 'bg-[rgb(var(--state-danger-bg)/0.18)]0 hover:bg-[rgb(var(--action-danger-bg))]',
  },
  delete: {
    title: 'Delete User',
    description: 'This action cannot be easily undone. The user will be permanently removed.',
    buttonLabel: 'Delete',
    color: 'bg-[rgb(var(--action-danger-bg))] hover:brightness-95',
  },
}

function ConfirmActionModal({
  user,
  action,
  onClose,
}: {
  user: UserResponseDto
  action: ConfirmAction
  onClose: () => void
}) {
  const statusMutation = useUpdateUserStatus()
  const deleteMutation = useDeleteUser()
  const config = ACTION_CONFIG[action]

  const isPending = statusMutation.isPending || deleteMutation.isPending

  const handleConfirm = async () => {
    if (action === 'delete') {
      await deleteMutation.mutateAsync(user.userId)
    } else {
      const statusMap: Record<string, 'active' | 'inactive' | 'suspended'> = {
        activate: 'active',
        deactivate: 'inactive',
        suspend: 'suspended',
      }
      await statusMutation.mutateAsync({ userId: user.userId, status: statusMap[action] })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(var(--background-overlay)/0.50)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[rgb(var(--background-primary))] rounded-xl border border-[rgb(var(--border-primary))] shadow-xl w-full max-w-md mx-4 p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-[rgb(var(--state-danger-bg)/0.18)] dark:bg-[rgb(var(--state-danger-bg)/0.18)]0/20">
            <AlertTriangle className="w-5 h-5 text-[rgb(var(--state-danger-fg))] dark:text-[rgb(var(--state-danger-fg))]" />
          </div>
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">{config.title}</h3>
        </div>

        <p className="text-sm text-[rgb(var(--text-secondary))] mb-2">
          User: <strong>{user.firstName} {user.lastName}</strong> ({user.email})
        </p>
        <p className="text-sm text-[rgb(var(--text-tertiary))] mb-6">{config.description}</p>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[rgb(var(--action-primary-fg))] rounded-lg transition-colors disabled:opacity-50 ${config.color}`}
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {config.buttonLabel}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ============================================================================
// ACTIONS DROPDOWN
// ============================================================================

function UserActionsDropdown({
  user,
  currentUserId,
  onChangeRole,
  onAction,
}: {
  user: UserResponseDto
  currentUserId: string
  onChangeRole: (user: UserResponseDto) => void
  onAction: (user: UserResponseDto, action: ConfirmAction) => void
}) {
  const [open, setOpen] = useState(false)
  const isSelf = user.userId === currentUserId

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-hover))] transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute right-0 top-full mt-1 z-50 w-48 bg-[rgb(var(--background-primary))] border border-[rgb(var(--border-primary))] rounded-lg shadow-lg py-1"
            >
              <button
                type="button"
                onClick={() => { onChangeRole(user); setOpen(false) }}
                disabled={isSelf}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-hover))] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <UserCog className="w-4 h-4" />
                Change Role
              </button>

              {user.status !== 'active' && (
                <button
                  type="button"
                  onClick={() => { onAction(user, 'activate'); setOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[rgb(var(--state-success-fg))]  hover:bg-[rgb(var(--surface-hover))] transition-colors"
                >
                  <UserCheck className="w-4 h-4" />
                  Activate
                </button>
              )}

              {user.status === 'active' && !isSelf && (
                <button
                  type="button"
                  onClick={() => { onAction(user, 'deactivate'); setOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-600 dark:text-amber-400 hover:bg-[rgb(var(--surface-hover))] transition-colors"
                >
                  <UserX className="w-4 h-4" />
                  Deactivate
                </button>
              )}

              {user.status !== 'suspended' && !isSelf && (
                <button
                  type="button"
                  onClick={() => { onAction(user, 'suspend'); setOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[rgb(var(--state-danger-fg))] dark:text-[rgb(var(--state-danger-fg))] hover:bg-[rgb(var(--surface-hover))] transition-colors"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Suspend
                </button>
              )}

              <div className="my-1 border-t border-[rgb(var(--border-secondary))]" />

              <button
                type="button"
                onClick={() => { onAction(user, 'delete'); setOpen(false) }}
                disabled={isSelf}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[rgb(var(--state-danger-fg))] dark:text-[rgb(var(--state-danger-fg))] hover:bg-[rgb(var(--state-danger-bg)/0.18)] dark:hover:bg-[rgb(var(--state-danger-bg)/0.18)]0/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete User
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function PeopleSettingsPage() {
  const { user } = useAuthStore.getState()
  const { activeSchoolId } = useAppStore.getState()

  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [roleModalUser, setRoleModalUser] = useState<UserResponseDto | null>(null)
  const [confirmModal, setConfirmModal] = useState<{ user: UserResponseDto; action: ConfirmAction } | null>(null)

  const hasPermission = user
    ? can(user, {
        action: 'view',
        resource: 'staff',
        schoolId: activeSchoolId ?? undefined,
      })
    : false

  // Build query params
  const queryParams: ListUsersParams = useMemo(() => {
    const params: ListUsersParams = { limit: 100 }
    if (searchQuery.trim()) params.search = searchQuery.trim()
    if (roleFilter) params.globalRole = roleFilter
    if (statusFilter) params.status = statusFilter
    return params
  }, [searchQuery, roleFilter, statusFilter])

  const { data, isLoading } = useUsers(queryParams, !!hasPermission)

  const users = data?.items || []

  // Compute stats from data
  const stats = useMemo(() => {
    const all = data?.items || []
    return {
      total: all.length,
      active: all.filter((u) => u.status === 'active').length,
      suspended: all.filter((u) => u.status === 'suspended').length,
      pending: all.filter((u) => u.status === 'pending').length,
    }
  }, [data])

  const handleChangeRole = useCallback((u: UserResponseDto) => setRoleModalUser(u), [])
  const handleAction = useCallback((u: UserResponseDto, action: ConfirmAction) => setConfirmModal({ user: u, action }), [])

  // Table columns
  const columns: ColumnDef<UserResponseDto, unknown>[] = useMemo(() => [
    {
      id: 'name',
      accessorFn: (u) => `${u.firstName} ${u.lastName}`,
      header: 'Name',
      cell: ({ row }) => {
        const u = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[rgb(var(--state-info-bg)/0.18)] dark:bg-[rgb(var(--action-primary-bg))]/20 flex items-center justify-center text-[rgb(var(--action-secondary-fg))]  text-xs font-semibold shrink-0">
              {u.firstName?.[0] || ''}{u.lastName?.[0] || ''}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-[rgb(var(--text-primary))] truncate">{u.firstName} {u.lastName}</p>
              <p className="text-xs text-[rgb(var(--text-tertiary))] truncate">{u.email}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'globalRole',
      header: 'Role',
      size: 140,
      cell: ({ row }) => {
        const u = row.original
        const badge = getRoleBadge(u.globalRole)
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
            <Shield className="w-3 h-3" />
            {u.globalRole === 'TenantAdmin' ? 'Admin' : 'User'}
          </span>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 120,
      cell: ({ row }) => {
        const u = row.original
        const badge = getStatusBadge(u.status)
        const StatusIcon = badge.icon
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
            <StatusIcon className="w-3 h-3" />
            {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
          </span>
        )
      },
    },
    {
      accessorKey: 'lastLoginAt',
      header: 'Last Login',
      size: 140,
      cell: ({ row }) => {
        const u = row.original
        return (
          <span className="text-xs text-[rgb(var(--text-secondary))]">
            {u.lastLoginAt
              ? new Date(u.lastLoginAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Never'}
          </span>
        )
      },
    },
    {
      accessorKey: 'mfaEnabled',
      header: 'MFA',
      size: 60,
      cell: ({ row }) => {
        const u = row.original
        return (
          <span className={`text-xs font-medium ${u.mfaEnabled ? 'text-[rgb(var(--state-success-fg))] ' : 'text-[rgb(var(--text-tertiary))]'}`}>
            {u.mfaEnabled ? 'On' : 'Off'}
          </span>
        )
      },
    },
    createActionsColumn<UserResponseDto>({
      cell: ({ row }) => (
        <UserActionsDropdown
          user={row.original}
          currentUserId={user?.id ?? ''}
          onChangeRole={handleChangeRole}
          onAction={handleAction}
        />
      ),
    }),
  ], [user?.id, handleChangeRole, handleAction])

  if (!user) {
    return <Navigate to="/login" />
  }

  if (!hasPermission) {
    return <AccessDenied message="You don't have permission to view access policy settings." />
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
        className="space-y-6"
      >
        <SettingsPageHeader
          title="User Accounts"
          description="Manage user accounts, roles, and access across your organization"
          icon={Users}
        />

        {/* Stat Cards */}
        <motion.div variants={fadeInUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={stats.total} icon={Users} color="bg-[rgb(var(--state-info-bg)/0.18)] dark:bg-[rgb(var(--action-primary-bg))]/20 text-[rgb(var(--action-secondary-fg))] " />
          <StatCard label="Active" value={stats.active} icon={UserCheck} color="bg-[rgb(var(--state-success-bg)/0.18)]  text-[rgb(var(--state-success-fg))] " />
          <StatCard label="Suspended" value={stats.suspended} icon={ShieldAlert} color="bg-[rgb(var(--state-danger-bg)/0.18)] dark:bg-[rgb(var(--state-danger-bg)/0.18)]0/20 text-[rgb(var(--state-danger-fg))] dark:text-[rgb(var(--state-danger-fg))]" />
          <StatCard label="Pending" value={stats.pending} icon={Clock} color="bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400" />
        </motion.div>

        {/* Filters */}
        <motion.div variants={fadeInUp} className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-52 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[rgb(var(--border-secondary))] bg-[rgb(var(--background-secondary))] text-sm text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2.5 bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-secondary))] rounded-lg text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
          >
            <option value="">All Roles</option>
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-secondary))] rounded-lg text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </motion.div>

        {/* Data Table */}
        <motion.div variants={fadeInUp}>
          <TanstackDataTable
            columns={columns}
            data={users}
            getRowId={(u) => u.userId}
            isLoading={isLoading}
            enableSorting={true}
            pagination={{ pageSize: 20 }}
            maxHeight="calc(100vh - 18rem)"
            emptyState={{
              icon: <Users className="w-10 h-10" />,
              title: 'No users found',
              description: searchQuery || roleFilter || statusFilter
                ? 'Try adjusting your search or filters.'
                : 'Users will appear here once they are added to this workspace.',
            }}
          />
        </motion.div>
      </motion.div>

      {/* Change Role Modal */}
      {roleModalUser && (
        <ChangeRoleModal
          user={roleModalUser}
          onClose={() => setRoleModalUser(null)}
        />
      )}

      {/* Confirm Action Modal */}
      {confirmModal && (
        <ConfirmActionModal
          user={confirmModal.user}
          action={confirmModal.action}
          onClose={() => setConfirmModal(null)}
        />
      )}
    </div>
  )
}

// ============================================================================
// ACCESS DENIED
// ============================================================================

function AccessDenied({ message }: { message: string }) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="p-4 rounded-full bg-[rgb(var(--state-danger-bg)/0.18)]0/10 inline-flex mb-4">
          <ShieldX className="w-8 h-8 text-[rgb(var(--state-danger-fg))]" />
        </div>
        <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-2">Access Denied</h2>
        <p className="text-[rgb(var(--text-tertiary))]">{message}</p>
      </motion.div>
    </div>
  )
}
