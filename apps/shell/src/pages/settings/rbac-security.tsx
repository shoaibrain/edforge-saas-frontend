/**
 * Security Policies (RBAC) — master–detail roles & permissions + user assignments.
 *
 * Two tabs, tab state persisted in the URL (?tab=roles | ?tab=assignments) via
 * the route's `validateSearch`. The page fills the settings pane: header + tabs
 * are fixed and the matrix / user table scroll inside their own panels rather
 * than growing the page.
 *
 * Scope: this surface only renders what the platform supports today. The
 * permission matrix is READ-ONLY (`ROLE_PERMISSIONS` is a static client-side
 * constant with no mutation endpoint) and the user role is display-only (no
 * per-user role-edit API). Editable matrix, role CRUD, search/filter/export,
 * and inline/bulk role changes are tracked in the "Enterprise RBAC/ABAC
 * backend" epic and intentionally not stubbed in the UI.
 */
import { useState, useMemo, useCallback, Fragment } from 'react'
import { Navigate, useNavigate, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Shield, Users, Key, Check, UserPlus, ChevronDown, Copy } from 'lucide-react'
import {
  Avatar,
  TanstackDataTable,
  type ColumnDef,
  StatusBadge,
  AnimatedProgressBar,
  Button,
  DataTableRowActions,
  cn,
} from '@edforge/ui'
import { can, ROLE_PERMISSIONS, type Action } from '@edforge/abac'
import type { SchoolRole } from '@edforge/types'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { usersService } from '@/services/users.service'
import type { UserResponseDto } from '@/services/users.service'
import AssignUserModal from '@/components/modals/AssignUserModal'
import { SettingsPageHeader } from '@/components/settings/SettingsShared'

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type TabId = 'roles' | 'assignments'
type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

/** Action columns mirrored in the matrix (the five CRUD-style primitives). */
const MATRIX_ACTIONS = ['view', 'create', 'edit', 'delete', 'manage'] as const

interface RoleMeta {
  tier: string
  description: string
  /** Per-role accent hue (hex) — drives the icon tint, accent rail, and bar. */
  accent: string
}

const ROLE_ORDER: SchoolRole[] = [
  'Principal',
  'VicePrincipal',
  'Teacher',
  'Accountant',
  'Counselor',
  'Nurse',
  'Staff',
  'Student',
  'Parent',
]

const ROLE_META: Record<SchoolRole, RoleMeta> = {
  Principal: { tier: 'Administrator', description: 'Full school access with administrative privileges', accent: '#7c5cff' },
  VicePrincipal: { tier: 'Administrator', description: 'Deputy administrative access', accent: '#6366f1' },
  Teacher: { tier: 'Educator', description: 'Classroom management, grading, and attendance', accent: '#2563eb' },
  Accountant: { tier: 'Staff', description: 'Financial operations across schools', accent: '#d97706' },
  Counselor: { tier: 'Staff', description: 'Student guidance and wellbeing', accent: '#0d9488' },
  Nurse: { tier: 'Staff', description: 'Health records and student care', accent: '#db2777' },
  Staff: { tier: 'Staff', description: 'Limited operational access', accent: '#64748b' },
  Student: { tier: 'Student', description: 'Student portal access', accent: '#0ea5e9' },
  Parent: { tier: 'Parent', description: 'Parent portal with child information', accent: '#9333ea' },
}

const MATRIX_CATEGORIES: { label: string; resources: string[] }[] = [
  { label: 'Academics', resources: ['students', 'grades', 'attendance', 'enrollment', 'courses', 'scheduling', 'assessments', 'gradebook', 'calendar'] },
  { label: 'People', resources: ['staff', 'teachers', 'guardians', 'parents', 'departments'] },
  { label: 'Finance', resources: ['billing', 'payroll', 'expenses', 'tuition', 'reports:finance'] },
  { label: 'Settings', resources: ['settings', 'branding', 'edfi', 'integrations'] },
]

const ALL_RESOURCES = MATRIX_CATEGORIES.flatMap((c) => c.resources)

const RESOURCE_LABELS: Record<string, string> = {
  'reports:finance': 'Finance Reports',
  edfi: 'Ed-Fi',
}

function resourceLabel(r: string): string {
  return RESOURCE_LABELS[r] ?? r.charAt(0).toUpperCase() + r.slice(1)
}

// ============================================================================
// PERMISSION HELPERS (read-only, derived from ROLE_PERMISSIONS)
// ============================================================================

function isGranted(role: SchoolRole, resource: string, action: string): boolean {
  const perms = ROLE_PERMISSIONS[role][resource as keyof (typeof ROLE_PERMISSIONS)[SchoolRole]]
  return Array.isArray(perms) && (perms as readonly Action[]).includes(action as Action)
}

function grantsForResource(role: SchoolRole, resource: string): number {
  return MATRIX_ACTIONS.reduce((n, a) => n + (isGranted(role, resource, a) ? 1 : 0), 0)
}

function fractionFor(role: SchoolRole, resources: string[], action?: string) {
  const total = action ? resources.length : resources.length * MATRIX_ACTIONS.length
  let granted = 0
  for (const r of resources) {
    if (action) granted += isGranted(role, r, action) ? 1 : 0
    else granted += grantsForResource(role, r)
  }
  return { granted, total }
}

function roleSummary(role: SchoolRole) {
  const { granted, total } = fractionFor(role, ALL_RESOURCES)
  return { granted, total, pct: total ? Math.round((granted / total) * 100) : 0 }
}

// ============================================================================
// TAB 1 — ROLES & PERMISSIONS
// ============================================================================

function RoleRail({
  selected,
  onSelect,
}: {
  selected: SchoolRole
  onSelect: (r: SchoolRole) => void
}) {
  return (
    <div className="flex w-80 shrink-0 flex-col overflow-hidden rounded-2xl border border-[rgb(var(--border-primary)/0.5)] bg-[rgb(var(--background-secondary))]">
      <div className="shrink-0 border-b border-[rgb(var(--border-primary)/0.4)] px-3 py-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-tertiary))]">
          System Roles
        </span>
      </div>

      <div className="flex-1 space-y-1.5 overflow-y-auto p-2 scrollbar-thin">
        {ROLE_ORDER.map((role) => {
          const meta = ROLE_META[role]
          const { granted, pct } = roleSummary(role)
          const isSelected = role === selected
          return (
            <button
              key={role}
              type="button"
              onClick={() => onSelect(role)}
              // allow-presentation-style: selected-role accent border is data-driven (per-role hue)
              style={isSelected ? { borderColor: meta.accent } : undefined}
              className={cn(
                'w-full rounded-xl border p-3 text-start transition-all',
                isSelected
                  ? 'bg-[rgb(var(--background-primary))] shadow-sm ring-1'
                  : 'border-[rgb(var(--border-primary)/0.4)] hover:border-[rgb(var(--border-primary)/0.7)] hover:bg-[rgb(var(--background-primary)/0.5)]',
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  // allow-presentation-style: per-role accent tint is data-driven (per-role hue)
                  style={{ backgroundColor: `${meta.accent}1f`, color: meta.accent }}
                >
                  <Shield className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-semibold text-[rgb(var(--text-primary))]">{role}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-[rgb(var(--text-tertiary))]">
                    {meta.tier}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-[rgb(var(--text-secondary))]">
                    {meta.description}
                  </p>
                  <div className="mt-2">
                    <AnimatedProgressBar
                      percentage={pct}
                      color={meta.accent}
                      label={`${role} permission coverage`}
                      height={4}
                    />
                    <p className="mt-1 text-xs text-[rgb(var(--text-tertiary))]">
                      {granted} perms · {pct}%
                    </p>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PermissionCell({ granted }: { granted: boolean }) {
  if (granted) {
    return (
      <span className="mx-auto inline-flex h-6 w-6 items-center justify-center rounded-md bg-[rgb(var(--state-success-bg))]">
        <Check className="h-3.5 w-3.5 text-[rgb(var(--state-success-fg))]" strokeWidth={3} />
      </span>
    )
  }
  // Denial is the quiet default — a subtle hollow outline, not a loud red X.
  return (
    <span className="mx-auto inline-flex h-6 w-6 items-center justify-center rounded-md border border-[rgb(var(--border-primary)/0.45)]" aria-label="not granted" />
  )
}

function MatrixPanel({ role }: { role: SchoolRole }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const meta = ROLE_META[role]

  const toggleCategory = (label: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[rgb(var(--border-primary)/0.5)] bg-[rgb(var(--background-secondary))]">
      {/* Panel header */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-[rgb(var(--border-primary)/0.4)] p-4">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          // allow-presentation-style: per-role accent tint is data-driven (per-role hue)
          style={{ backgroundColor: `${meta.accent}1f`, color: meta.accent }}
        >
          <Key className="h-4 w-4" />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-[rgb(var(--text-primary))]">Permission Matrix</h2>
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium"
              // allow-presentation-style: per-role accent tint is data-driven (per-role hue)
              style={{ backgroundColor: `${meta.accent}1f`, color: meta.accent }}
            >
              {role}
            </span>
          </div>
          <p className="text-xs text-[rgb(var(--text-tertiary))]">Read-only view of granted access for this role</p>
        </div>
      </div>

      {/* Scroll container */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 min-w-56 bg-[rgb(var(--background-secondary))] px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-tertiary))]">
                Resource
              </th>
              {MATRIX_ACTIONS.map((action) => {
                const { granted, total } = fractionFor(role, ALL_RESOURCES, action)
                return (
                  <th
                    key={action}
                    className="sticky top-0 z-20 min-w-20 bg-[rgb(var(--background-secondary))] px-2 py-2.5 text-center"
                  >
                    <span className="block text-xs font-semibold capitalize text-[rgb(var(--text-secondary))]">{action}</span>
                    <span className="block text-xs tabular-nums text-[rgb(var(--text-tertiary))]">
                      {granted}/{total}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {MATRIX_CATEGORIES.map((category) => {
              const isOpen = !collapsed.has(category.label)
              const { granted, total } = fractionFor(role, category.resources)
              return (
                <Fragment key={category.label}>
                  <tr>
                    <td
                      colSpan={MATRIX_ACTIONS.length + 1}
                      className="sticky left-0 z-10 border-y border-[rgb(var(--border-primary)/0.3)] bg-[rgb(var(--background-tertiary))]"
                    >
                      <button
                        type="button"
                        onClick={() => toggleCategory(category.label)}
                        className="flex w-full items-center gap-2 px-4 py-2 text-start"
                      >
                        <ChevronDown
                          className={cn('h-4 w-4 text-[rgb(var(--text-tertiary))] transition-transform', !isOpen && '-rotate-90')}
                        />
                        <span className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-secondary))]">
                          {category.label}
                        </span>
                        <span className="text-xs tabular-nums text-[rgb(var(--text-tertiary))]">
                          {granted}/{total} granted
                        </span>
                      </button>
                    </td>
                  </tr>
                  {isOpen &&
                    category.resources.map((resource) => (
                      <tr key={resource} className="border-b border-[rgb(var(--border-primary)/0.2)] hover:bg-[rgb(var(--background-primary)/0.4)]">
                        <td className="sticky left-0 z-10 bg-[rgb(var(--background-secondary))] px-4 py-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-[rgb(var(--text-primary))]">{resourceLabel(resource)}</span>
                            <span className="text-xs tabular-nums text-[rgb(var(--text-tertiary))]">
                              {grantsForResource(role, resource)}/{MATRIX_ACTIONS.length}
                            </span>
                          </div>
                        </td>
                        {MATRIX_ACTIONS.map((action) => (
                          <td key={action} className="px-2 py-2.5 text-center">
                            <PermissionCell granted={isGranted(role, resource, action)} />
                          </td>
                        ))}
                      </tr>
                    ))}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RolesTab() {
  const [selected, setSelected] = useState<SchoolRole>('Principal')
  return (
    <div className="flex h-full min-h-0 gap-4">
      <RoleRail selected={selected} onSelect={setSelected} />
      <MatrixPanel role={selected} />
    </div>
  )
}

// ============================================================================
// TAB 2 — USER ASSIGNMENTS
// ============================================================================

function statusMeta(status: UserResponseDto['status']): { label: string; tone: Tone } {
  switch (status) {
    case 'active':
      return { label: 'Active', tone: 'success' }
    case 'pending':
      return { label: 'Invited', tone: 'info' }
    case 'suspended':
      return { label: 'Suspended', tone: 'danger' }
    default:
      return { label: 'Inactive', tone: 'neutral' }
  }
}

function roleLabel(u: UserResponseDto): { label: string; tone: Tone } {
  return u.globalRole === 'TenantAdmin'
    ? { label: 'Tenant Admin', tone: 'info' }
    : { label: 'Standard User', tone: 'neutral' }
}

function fullName(u: UserResponseDto): string {
  return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email
}

function relativeTime(iso?: string): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(diff)) return '—'
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(iso).toLocaleDateString()
}

function DistributionRow({
  label,
  count,
  max,
  color,
  active,
  onClick,
}: {
  label: string
  count: number
  max: number
  color: string
  active: boolean
  onClick: () => void
}) {
  const pct = max ? Math.round((count / max) * 100) : 0
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-lg px-2 py-1.5 text-start transition-colors',
        active ? 'bg-[rgb(var(--background-tertiary))]' : 'hover:bg-[rgb(var(--background-tertiary)/0.6)]',
      )}
    >
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-[rgb(var(--text-secondary))]">
          <span
            className="h-2 w-2 rounded-full"
            // allow-presentation-style: distribution dot color is data-driven (per-role hue)
            style={{ backgroundColor: color }}
          />
          {label}
        </span>
        <span className="tabular-nums text-[rgb(var(--text-tertiary))]">{count}</span>
      </div>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[rgb(var(--background-tertiary))]">
        <div
          className="h-full rounded-full"
          // allow-presentation-style: data-driven distribution bar width + per-role hue
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </button>
  )
}

function UsersTab({ onAssign }: { onAssign: () => void }) {
  const [roleFilter, setRoleFilter] = useState<'all' | 'TenantAdmin' | 'StandardUser'>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['users', 'list'],
    queryFn: () => usersService.listUsers({ limit: 100 }),
    staleTime: 5 * 60 * 1000,
  })

  const allUsers = useMemo(() => data?.items ?? [], [data])

  const counts = useMemo(() => {
    const byRole = { TenantAdmin: 0, StandardUser: 0 }
    let active = 0
    for (const u of allUsers) {
      if (u.globalRole === 'TenantAdmin') byRole.TenantAdmin++
      else byRole.StandardUser++
      if (u.status === 'active') active++
    }
    return { byRole, active, total: allUsers.length }
  }, [allUsers])

  const filtered = useMemo(
    () => (roleFilter === 'all' ? allUsers : allUsers.filter((u) => u.globalRole === roleFilter)),
    [allUsers, roleFilter],
  )

  const columns: ColumnDef<UserResponseDto, unknown>[] = useMemo(
    () => [
      {
        id: 'user',
        accessorFn: (u) => `${u.firstName} ${u.lastName} ${u.email}`,
        header: 'User',
        cell: ({ row }) => {
          const u = row.original
          return (
            <div className="flex items-center gap-3">
              <Avatar name={fullName(u)} size="sm" className="shrink-0" />
              <div className="min-w-0">
                <p className="truncate font-medium text-[rgb(var(--text-primary))]">{fullName(u)}</p>
                <p className="truncate text-xs text-[rgb(var(--text-tertiary))]">{u.email}</p>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'globalRole',
        header: 'Role',
        size: 160,
        cell: ({ row }) => {
          const { label, tone } = roleLabel(row.original)
          return (
            <StatusBadge tone={tone}>
              <Shield className="h-3 w-3" />
              {label}
            </StatusBadge>
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 130,
        cell: ({ row }) => {
          const { label, tone } = statusMeta(row.original.status)
          return (
            <StatusBadge tone={tone} dot>
              {label}
            </StatusBadge>
          )
        },
      },
      {
        accessorKey: 'lastLoginAt',
        header: 'Last active',
        size: 120,
        cell: ({ row }) => (
          <span className="text-sm text-[rgb(var(--text-tertiary))]">{relativeTime(row.original.lastLoginAt)}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 48,
        cell: ({ row }) => (
          <DataTableRowActions
            row={row.original}
            actions={[
              {
                label: 'Copy email',
                icon: <Copy className="h-4 w-4" />,
                onClick: (u) => navigator.clipboard?.writeText(u.email),
              },
            ]}
          />
        ),
      },
    ],
    [],
  )

  const roleDistMax = Math.max(counts.byRole.TenantAdmin, counts.byRole.StandardUser, 1)

  return (
    <div className="flex h-full min-h-0 gap-4">
      {/* Left aside — summary + by-role filter */}
      <aside className="flex w-64 shrink-0 flex-col gap-4 overflow-y-auto scrollbar-thin">
        <div className="rounded-2xl border border-[rgb(var(--border-primary)/0.5)] bg-[rgb(var(--background-secondary))] p-4">
          <div className="flex items-baseline gap-6">
            <div>
              <p className="text-2xl font-bold tabular-nums text-[rgb(var(--text-primary))]">{counts.total}</p>
              <p className="text-xs text-[rgb(var(--text-tertiary))]">Total users</p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-[rgb(var(--state-success-fg))]">{counts.active}</p>
              <p className="text-xs text-[rgb(var(--text-tertiary))]">Active</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[rgb(var(--border-primary)/0.5)] bg-[rgb(var(--background-secondary))] p-3">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-tertiary))]">By role</p>
          <div className="space-y-1">
            <DistributionRow
              label="All roles"
              count={counts.total}
              max={counts.total || 1}
              color="rgb(var(--text-tertiary))"
              active={roleFilter === 'all'}
              onClick={() => setRoleFilter('all')}
            />
            <DistributionRow
              label="Tenant Admin"
              count={counts.byRole.TenantAdmin}
              max={roleDistMax}
              color="#7c5cff"
              active={roleFilter === 'TenantAdmin'}
              onClick={() => setRoleFilter((p) => (p === 'TenantAdmin' ? 'all' : 'TenantAdmin'))}
            />
            <DistributionRow
              label="Standard User"
              count={counts.byRole.StandardUser}
              max={roleDistMax}
              color="#64748b"
              active={roleFilter === 'StandardUser'}
              onClick={() => setRoleFilter((p) => (p === 'StandardUser' ? 'all' : 'StandardUser'))}
            />
          </div>
        </div>
      </aside>

      {/* Main — table */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TanstackDataTable
          className="flex-1 min-h-0"
          columns={columns}
          data={filtered}
          getRowId={(u) => u.userId}
          isLoading={isLoading}
          tableId="settings.rbac-users"
          enableSorting
          pagination={{ pageSize: 10, pageSizeOptions: [10, 25, 50] }}
          toolbarExtra={
            <Button variant="primary" size="sm" onClick={onAssign}>
              <UserPlus className="h-4 w-4" />
              Assign User
            </Button>
          }
          emptyState={{
            icon: <Users className="h-10 w-10" />,
            title: 'No users found',
            description: 'Assign a user to grant system access.',
            action: { label: 'Assign user', onClick: onAssign },
          }}
        />
      </div>
    </div>
  )
}

// ============================================================================
// PAGE
// ============================================================================

const TABS: { id: TabId; label: string; icon: typeof Key }[] = [
  { id: 'roles', label: 'Roles & Permissions', icon: Key },
  { id: 'assignments', label: 'User Assignments', icon: Users },
]

export default function RBACSecurityPage() {
  const user = useAuthStore((s) => s.user)
  const { activeSchoolId } = useAppStore.getState()
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { tab?: string }
  const activeTab: TabId = search.tab === 'assignments' ? 'assignments' : 'roles'
  const [isAssignOpen, setIsAssignOpen] = useState(false)

  const switchTab = useCallback(
    (tab: TabId) => {
      navigate({ search: { tab } as never, replace: false })
    },
    [navigate],
  )

  if (!user) return <Navigate to="/login" />

  const hasPermission = can(user, {
    action: 'manage',
    resource: 'settings',
    schoolId: activeSchoolId ?? undefined,
  })
  if (!hasPermission) {
    return <AccessDenied message="You don't have permission to manage access policies." />
  }

  return (
    <div className="flex h-full flex-col px-6 pb-6 pt-6">
      <AssignUserModal isOpen={isAssignOpen} onClose={() => setIsAssignOpen(false)} />

      {/* Header */}
      <div className="shrink-0">
        <SettingsPageHeader
          title="Security Policies"
          description="Manage roles, permissions, and user access across your organization"
          icon={Shield}
        />
      </div>

      {/* Tabs */}
      <div className="mt-4 shrink-0 border-b border-[rgb(var(--border-primary))]">
        <div className="flex items-center gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={cn(
                  'relative px-4 py-3 text-sm font-medium outline-none transition-colors',
                  isActive ? 'text-[rgb(var(--text-primary))]' : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]',
                )}
              >
                <span className="flex items-center gap-2">
                  <Icon className={cn('h-4 w-4', isActive ? 'text-[rgb(var(--action-primary-bg))]' : 'opacity-70')} />
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-t-full bg-[rgb(var(--action-primary-bg))]" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content — fills remaining height; panels scroll internally */}
      <div className="mt-4 min-h-0 flex-1">
        {activeTab === 'roles' ? <RolesTab /> : <UsersTab onAssign={() => setIsAssignOpen(true)} />}
      </div>
    </div>
  )
}

// ============================================================================
// ACCESS DENIED
// ============================================================================

function AccessDenied({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="py-16 text-center">
        <div className="mb-4 inline-flex rounded-full bg-[rgb(var(--state-danger-bg))] p-4">
          <Shield className="h-8 w-8 text-[rgb(var(--state-danger-fg))]" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-[rgb(var(--text-primary))]">Access Denied</h2>
        <p className="text-[rgb(var(--text-tertiary))]">{message}</p>
      </div>
    </div>
  )
}
