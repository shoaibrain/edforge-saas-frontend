/**
 * Access Policy / People Settings Page
 * 
 * Manage workspace members and roles.
 */

import { useState } from 'react'
import { Navigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Users, ShieldX, Search, Filter, MoreHorizontal, Mail, Shield } from 'lucide-react'
import { Button } from '@edforge/ui'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { can } from '@edforge/abac'
import { useQuery } from '@tanstack/react-query'
import { usersService, type UserResponseDto } from '@/services/users.service'
import { SettingsPageHeader, SettingsEmptyState, fadeInUp, staggerChildren } from '@/components/settings/SettingsShared'

export default function PeopleSettingsPage() {
  const { user } = useAuthStore.getState()
  const { activeSchoolId } = useAppStore.getState()

  const [searchQuery, setSearchQuery] = useState('')

  // Check permission
  if (!user) {
    return <Navigate to="/login" />
  }

  const hasPermission = can(user, {
    action: 'view',
    resource: 'staff',
    schoolId: activeSchoolId ?? undefined,
  })

  // Fetch users
  const { data, isLoading } = useQuery({
    queryKey: ['users', activeSchoolId],
    queryFn: () => usersService.listUsers(50),
    enabled: !!hasPermission,
  })

  if (!hasPermission) {
    return <AccessDenied message="You don't have permission to view access policy settings." />
  }

  const users = data?.items || []
  const filteredUsers = users.filter(u =>
    (u.firstName + ' ' + u.lastName).toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
        className="space-y-8"
      >
        <SettingsPageHeader
          title="Access Policy"
          description="Manage workspace members, roles, and permissions"
          icon={Users}
        />

        {/* Filters & Search */}
        <motion.div variants={fadeInUp} className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </motion.div>

        {/* User List */}
        <motion.div variants={fadeInUp}>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <SettingsEmptyState
              icon={Users}
              title="No members found"
              description="Members will appear here once they are added to this school."
            />
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No results found matching your search.
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredUsers.map((user) => (
                <UserCard key={user.userId} user={user} />
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}

function UserCard({ user }: { user: UserResponseDto }) {
  return (
    <motion.div
      variants={fadeInUp}
      className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:border-teal-500/30 transition-colors group"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-semibold">
          {user.firstName[0]}{user.lastName[0]}
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{user.firstName} {user.lastName}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Mail className="w-3.5 h-3.5" />
            {user.email}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex flex-col items-end gap-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            <Shield className="w-3 h-3" />
            {user.globalRole}
          </span>
          <span className="text-xs text-gray-400">
            Added {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  )
}

function AccessDenied({ message }: { message: string }) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="p-4 rounded-full bg-rust-500/10 inline-flex mb-4">
          <ShieldX className="w-8 h-8 text-rust-500" />
        </div>
        <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-2">Access Denied</h2>
        <p className="text-[rgb(var(--text-tertiary))]">{message}</p>
      </motion.div>
    </div>
  )
}
