/**
 * Teachers / Faculty Directory Module
 *
 * Read-only directory of school staff with profile drawer.
 * Uses the existing staff service with User/Staff fallback.
 */

import { useState, useMemo } from 'react'
import {
  Users,
  GraduationCap,
  UserCheck,
  Briefcase,
} from 'lucide-react'
import { useActiveSchoolId } from '../../stores/app.store'
import { useSchoolStaff, flattenStaffData } from '../../hooks/useStaff'
import { TeacherTable } from '../../components/teachers/TeacherTable'
import { TeacherDetailDrawer } from '../../components/teachers/TeacherDetailDrawer'

// ============================================================================
// STAT CARD
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
  value: string | number
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
// TEACHERS MODULE
// ============================================================================

export function TeachersModule() {
  const schoolId = useActiveSchoolId() || ''
  const { data: staffData, isLoading } = useSchoolStaff(schoolId)
  const staff = useMemo(() => flattenStaffData(staffData), [staffData])
  const [selectedMember, setSelectedMember] = useState<any>(null)

  // Compute stats
  const totalStaff = staff.length
  const teachers = staff.filter((s) => s.role === 'teacher' || !s.role)
  const activeStaff = staff.filter(
    (s) => (s.employmentStatus || 'active') === 'active'
  )
  const uniqueRoles = [...new Set(staff.map((s) => s.role).filter(Boolean))]

  return (
    <div className="min-h-full">
      {/* Page Header */}
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
              <Users className="w-6 h-6 text-[rgb(var(--state-info-fg))]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Faculty Directory</h1>
              <p className="text-text-secondary mt-0.5">
                School staff members and their teaching assignments
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Total Staff"
            value={isLoading ? '...' : totalStaff}
            accent="text-[rgb(var(--state-info-fg))]"
            bg="bg-[rgb(var(--state-info-bg)/0.18)]"
          />
          <StatCard
            icon={GraduationCap}
            label="Teachers"
            value={isLoading ? '...' : teachers.length}
            accent="text-[rgb(var(--state-info-fg))]"
            bg="bg-[rgb(var(--state-info-bg)/0.18)]"
          />
          <StatCard
            icon={UserCheck}
            label="Active"
            value={isLoading ? '...' : activeStaff.length}
            accent="text-[rgb(var(--state-success-fg))]"
            bg="bg-[rgb(var(--state-success-bg)/0.18)]"
          />
          <StatCard
            icon={Briefcase}
            label="Roles"
            value={isLoading ? '...' : uniqueRoles.length}
            accent="text-[rgb(var(--state-warning-fg))]"
            bg="bg-[rgb(var(--state-warning-fg))]/10"
          />
        </div>

        {/* Staff Table */}
        <TeacherTable
          staff={staff}
          isLoading={isLoading}
          onSelect={setSelectedMember}
        />
      </div>

      {/* Detail Drawer */}
      <TeacherDetailDrawer
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </div>
  )
}

export default TeachersModule
