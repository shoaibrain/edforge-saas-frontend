// ... imports
import { useState, Fragment } from 'react'
import { Navigate, Link } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Shield,
  Users,
  Key,
  Search,
  Check,
  X,
  Eye,
  Edit,
  UserPlus,
  ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { can } from '@edforge/abac'
import { ROLE_PERMISSIONS } from '@edforge/abac'
import type { SchoolRole } from '@edforge/types'
import { usersService } from '@/services/users.service'
import { ComingSoonBanner } from '@edforge/ui'
import AssignUserModal from '@/components/modals/AssignUserModal'
import {
  SettingsPageHeader,
  SettingsSection,
  staggerChildren,
  fadeInUp,
} from '@/components/settings/SettingsShared'

// ============================================================================
// TYPES
// ============================================================================

type TabId = 'roles' | 'users' | 'audit'

interface RoleInfo {
  id: SchoolRole
  name: string
  description: string
  category: 'administrator' | 'educator' | 'staff' | 'student' | 'parent'
  color: string
  permissionCount: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TABS: { id: TabId; label: string; icon: typeof Key }[] = [
  { id: 'roles', label: 'Roles & Permissions', icon: Key },
  { id: 'users', label: 'User Assignments', icon: Users },
  { id: 'audit', label: 'Audit Log', icon: Eye },
]

const SYSTEM_ROLES: RoleInfo[] = [
  {
    id: 'Principal',
    name: 'Principal',
    description: 'Full school access with administrative privileges',
    category: 'administrator',
    color: 'teal',
    permissionCount: Object.keys(ROLE_PERMISSIONS.Principal).length,
  },
  {
    id: 'Teacher',
    name: 'Teacher',
    description: 'Classroom management, grading, and attendance',
    category: 'educator',
    color: 'cyan',
    permissionCount: Object.keys(ROLE_PERMISSIONS.Teacher).length,
  },
  {
    id: 'Accountant',
    name: 'Accountant',
    description: 'Financial operations across schools',
    category: 'staff',
    color: 'golden',
    permissionCount: Object.keys(ROLE_PERMISSIONS.Accountant).length,
  },
  {
    id: 'Staff',
    name: 'Staff',
    description: 'Limited operational access',
    category: 'staff',
    color: 'slate',
    permissionCount: Object.keys(ROLE_PERMISSIONS.Staff).length,
  },
  {
    id: 'Student',
    name: 'Student',
    description: 'Student portal access',
    category: 'student',
    color: 'blue',
    permissionCount: Object.keys(ROLE_PERMISSIONS.Student).length,
  },
  {
    id: 'Parent',
    name: 'Parent',
    description: 'Parent portal with child information',
    category: 'parent',
    color: 'purple',
    permissionCount: Object.keys(ROLE_PERMISSIONS.Parent).length,
  },
]

const RESOURCE_CATEGORIES: { label: string; resources: string[] }[] = [
  {
    label: 'Academics',
    resources: ['students', 'grades', 'attendance', 'enrollment', 'courses', 'scheduling', 'assessments', 'gradebook', 'calendar'],
  },
  {
    label: 'People',
    resources: ['staff', 'teachers', 'guardians', 'parents', 'departments'],
  },
  {
    label: 'Settings',
    resources: ['settings'],
  },
]

const MATRIX_ACTIONS = ['view', 'create', 'edit', 'delete', 'manage'] as const

// ============================================================================
// ROLE CARD COMPONENT
// ============================================================================

interface RoleCardProps {
  role: RoleInfo
  isSelected: boolean
  onSelect: () => void
}

function RoleCard({ role, isSelected, onSelect }: RoleCardProps) {
  const colorClasses: Record<string, string> = {
    teal: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20',
    golden: 'bg-golden-500/10 text-golden-700 dark:text-golden-400 border-golden-500/20',
    slate: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20',
    blue: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  }

  return (
    <motion.button
      variants={fadeInUp}
      onClick={onSelect}
      className={`w-full p-4 rounded-xl border transition-all text-left group ${
        isSelected
          ? 'border-teal-500/40 ring-1 ring-teal-500/20 bg-[rgb(var(--surface-secondary))]'
          : 'border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] hover:border-teal-500/30'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${colorClasses[role.color]}`}>
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-[rgb(var(--text-primary))]">{role.name}</h3>
            <p className="text-sm text-[rgb(var(--text-tertiary))] mt-0.5">{role.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-secondary))]">
                {role.permissionCount} resources
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-secondary))] capitalize">
                {role.category}
              </span>
            </div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-[rgb(var(--text-tertiary))] group-hover:text-[rgb(var(--text-secondary))] group-hover:translate-x-0.5 transition-all" />
      </div>
    </motion.button>
  )
}

// ============================================================================
// PERMISSION MATRIX
// ============================================================================

function PermissionMatrix({ selectedRole }: { selectedRole: SchoolRole }) {
  const rolePerms = ROLE_PERMISSIONS[selectedRole]

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[rgb(var(--border-primary))]">
            <th className="text-left py-3 px-4 font-medium text-[rgb(var(--text-secondary))]">Resource</th>
            {MATRIX_ACTIONS.map((action) => (
              <th key={action} className="text-center py-3 px-2 font-medium text-[rgb(var(--text-secondary))] capitalize">
                {action}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {RESOURCE_CATEGORIES.map((category) => {
            const categoryResources = category.resources.filter(
              (r) => rolePerms[r as keyof typeof rolePerms],
            )
            if (categoryResources.length === 0) return null
            return (
              <Fragment key={category.label}>
                <tr>
                  <td
                    colSpan={MATRIX_ACTIONS.length + 1}
                    className="py-2 px-4 text-xs font-semibold text-[rgb(var(--text-tertiary))] uppercase tracking-wider bg-[rgb(var(--surface-tertiary))]"
                  >
                    {category.label}
                  </td>
                </tr>
                {categoryResources.map((resource) => {
                  const actions = rolePerms[resource as keyof typeof rolePerms] || []
                  return (
                    <tr key={resource} className="border-b border-[rgb(var(--border-secondary))]">
                      <td className="py-2.5 px-4 font-medium text-[rgb(var(--text-primary))] capitalize">
                        {resource.replace(':', ' / ')}
                      </td>
                      {MATRIX_ACTIONS.map((action) => (
                        <td key={action} className="text-center py-2.5 px-2">
                          {(actions as readonly string[]).includes(action) ? (
                            <Check className="w-4 h-4 text-teal-500 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-[rgb(var(--text-tertiary))] mx-auto opacity-20" />
                          )}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function RBACSecurityPage() {
  const user = useAuthStore((s) => s.user)
  const { activeSchoolId } = useAppStore.getState()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTab, setSelectedTab] = useState<TabId>('roles')
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [matrixRole, setMatrixRole] = useState<SchoolRole>('Principal')

  // Fetch Users — query key matches AssignUserModal for cache sharing
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', 'list'],
    queryFn: () => usersService.listUsers({ limit: 100 }),
    staleTime: 5 * 60 * 1000,
  })

  if (!user) {
    return <Navigate to="/login" />
  }

  const hasPermission = can(user, {
    action: 'manage',
    resource: 'settings',
    schoolId: activeSchoolId ?? undefined,
  })

  if (!hasPermission) {
    return <AccessDenied message="You don't have permission to manage access policies." />
  }

  const filteredUsers = usersData?.items.filter(u =>
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  // Select a role card → update the Permission Matrix
  const handleSelectRole = (roleId: SchoolRole) => {
    setMatrixRole(roleId)
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <AssignUserModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
        className="space-y-0"
      >
        {/* Header */}
        <div className="mb-6">
          <SettingsPageHeader
            title="Security Policies"
            description="Manage roles, permissions, and user access across your organization"
            icon={Shield}
          />
        </div>

        {/* Tab Navigation — EdForge standard pattern */}
        <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar border-b border-[rgb(var(--border-primary))]">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = selectedTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`
                  relative px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap outline-none
                  ${isActive
                    ? 'text-[rgb(var(--text-primary))]'
                    : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]'
                  }
                `}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-500' : 'opacity-70'}`} />
                  {tab.label}
                </span>

                {/* Animated underline indicator */}
                {isActive && (
                  <motion.div
                    layoutId="securityPolicyTab"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-teal-500 rounded-t-full"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Tab Content with AnimatePresence */}
        <div className="min-h-[400px] pt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedTab}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={staggerChildren}
              className="space-y-6"
            >
              {/* Roles Tab */}
              {selectedTab === 'roles' && (
                <>
                  {/* System Roles */}
                  <SettingsSection
                    title="System Roles"
                    icon={Shield}
                    description="Click a role to view its permissions in the matrix below"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {SYSTEM_ROLES.map((role) => (
                        <RoleCard
                          key={role.id}
                          role={role}
                          isSelected={matrixRole === role.id}
                          onSelect={() => handleSelectRole(role.id)}
                        />
                      ))}
                    </div>
                  </SettingsSection>

                  {/* Permission Matrix */}
                  <SettingsSection
                    title="Permission Matrix"
                    icon={Key}
                    description={`Showing permissions for ${matrixRole}`}
                  >
                    <PermissionMatrix selectedRole={matrixRole} />
                  </SettingsSection>
                </>
              )}

              {/* Users Tab */}
              {selectedTab === 'users' && (
                <SettingsSection
                  title="User Assignments"
                  icon={Users}
                  description="Users and their role assignments"
                >
                  {/* Search and Add */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                      />
                    </div>
                    <button
                      onClick={() => setIsAssignModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-600 transition-colors inline-flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Assign User
                    </button>
                  </div>

                  {/* User List */}
                  <div className="space-y-1">
                    {isLoadingUsers ? (
                      <div className="py-8 text-center text-[rgb(var(--text-secondary))]">Loading users...</div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="py-8 text-center text-[rgb(var(--text-secondary))]">No users found.</div>
                    ) : (
                      filteredUsers.map((user) => (
                        <div key={user.userId} className="flex items-center justify-between p-3 rounded-lg hover:bg-[rgb(var(--surface-tertiary))] transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-medium">
                              {user.firstName?.charAt(0) || user.email.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-[rgb(var(--text-primary))]">{user.firstName} {user.lastName}</p>
                              <p className="text-sm text-[rgb(var(--text-tertiary))]">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="text-sm font-medium text-[rgb(var(--text-secondary))]">
                              {user.globalRole === 'TenantAdmin' ? 'Tenant Admin' : 'Standard User'}
                            </p>
                            <Link
                              to="/people/$"
                              params={{ _splat: `staff/${user.userId}` }}
                              className="p-2 rounded-lg hover:bg-[rgb(var(--surface-secondary))] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </SettingsSection>
              )}

              {/* COMING_SOON: audit-log — Replace ComingSoonBanner with AuditLogViewer when it ships */}
              {selectedTab === 'audit' && (
                <ComingSoonBanner
                  variant="security"
                  title="Audit Log"
                  description="Track security events across your organization including permission changes, role assignments, and authentication activity."
                  features={[
                    'Permission denial tracking with endpoint details',
                    'Role assignment and removal history',
                    'User lifecycle events (create, update, disable)',
                    'Authentication events and login history',
                  ]}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

// ============================================================================
// ACCESS DENIED COMPONENT
// ============================================================================

function AccessDenied({ message }: { message: string }) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="p-4 rounded-full bg-rust-500/10 inline-flex mb-4">
          <Shield className="w-8 h-8 text-rust-500" />
        </div>
        <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-2">Access Denied</h2>
        <p className="text-[rgb(var(--text-tertiary))]">{message}</p>
      </motion.div>
    </div>
  )
}
