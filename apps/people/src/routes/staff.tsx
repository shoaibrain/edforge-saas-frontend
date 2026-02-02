/**
 * Staff Directory Page
 *
 * Complete employee roster for the People domain.
 * Primary view for accessing staff profiles, assignments, and contact information.
 */

import { UsersRound, Search, Filter, Plus, Users, GraduationCap, Briefcase, Award } from 'lucide-react'
import { useAppStore } from '@/stores/app.store'
// NOTE: Auth is handled by Shell's protected routes - remotes don't need their own auth store

import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { peopleService } from '../services/people.service'

// Native date formatting
const formatDate = (date: string) => new Date(date).toLocaleDateString()

export default function StaffPage() {
  const { activeSchoolId } = useAppStore.getState()

  console.log('[People:Staff] Rendering staff page, activeSchoolId:', activeSchoolId)

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', activeSchoolId],
    queryFn: () => peopleService.listUsers(50),
    enabled: true, // Fetch for all users generally, or filter by school if API supports it (currently listUsers is generic)
  })

  // Basic stats handling (mock for now, or derived from data if pagination allows)
  const totalStaff = data?.items.length || 0

  // NOTE: This simple implementation fetches specific page of users. 
  // Real stats should come from a separate API endpoint.

  return (
    <div className="min-h-full">
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
                  Complete employee roster with contact information, certifications, and assignments
                </p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors">
              <Plus className="w-4 h-4" />
              <span>Add Staff</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Stats (Mocked or Derived) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Total Staff"
            value={isLoading ? '-' : totalStaff.toString()}
            accent="text-blue-600 dark:text-blue-400"
            bg="bg-blue-500/10"
          />
          <StatCard // Placeholder stats
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
              placeholder="Search by name, department, or role..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-secondary border border-border-secondary rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-surface-secondary border border-border-secondary rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Staff List */}
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-text-secondary" />
            <h3 className="text-lg font-semibold text-text-primary">Staff Roster ({data?.items.length || 0})</h3>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-text-secondary">Loading staff...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">Failed to load staff logic.</div>
          ) : data?.items.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">No staff members found.</div>
          ) : (
            <div className="space-y-3">
              {data?.items.map((user) => (
                <Link
                  to="/staff/$userId"
                  params={{ userId: user.userId }}
                  key={user.userId}
                  className="flex items-center justify-between p-4 rounded-lg border border-border-tertiary bg-surface-primary hover:border-accent-primary/30 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold group-hover:scale-105 transition-transform">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </div>
                    <div>
                      <h4 className="font-medium text-text-primary group-hover:text-accent-primary transition-colors">{user.firstName} {user.lastName}</h4>
                      <div className="text-sm text-text-secondary">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface-tertiary text-text-secondary border border-border-tertiary">
                      {user.globalRole}
                    </span>
                    <div className="text-xs text-text-tertiary">
                      Joined {formatDate(user.createdAt)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

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
