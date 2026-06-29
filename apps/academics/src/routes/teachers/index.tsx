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
import { ContextBar } from '@edforge/ui'
import { useSchoolStaff, flattenStaffData } from '../../hooks/useStaff'
import { TeacherTable } from '../../components/teachers/TeacherTable'
import { TeacherDetailDrawer } from '../../components/teachers/TeacherDetailDrawer'
import { useAcademicsI18n } from '../../lib/i18n'

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
  const { t, formatNumber, formatDate } = useAcademicsI18n()
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
      {/* Header — operating context, not a page title (breadcrumb says Teachers) */}
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-5">
          <ContextBar
            divider={false}
            meta={
              <span>
                {formatDate(new Date(), {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            }
            description={
              <p className="text-sm text-text-secondary">
                {t('teachersModule.description')}
              </p>
            }
          />
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label={t('teachersModule.stats.totalStaff')}
            value={isLoading ? '...' : formatNumber(totalStaff)}
            accent="text-[rgb(var(--state-info-fg))]"
            bg="bg-[rgb(var(--state-info-bg)/0.18)]"
          />
          <StatCard
            icon={GraduationCap}
            label={t('teachersModule.stats.teachers')}
            value={isLoading ? '...' : formatNumber(teachers.length)}
            accent="text-[rgb(var(--state-info-fg))]"
            bg="bg-[rgb(var(--state-info-bg)/0.18)]"
          />
          <StatCard
            icon={UserCheck}
            label={t('teachersModule.stats.active')}
            value={isLoading ? '...' : formatNumber(activeStaff.length)}
            accent="text-[rgb(var(--state-success-fg))]"
            bg="bg-[rgb(var(--state-success-bg)/0.18)]"
          />
          <StatCard
            icon={Briefcase}
            label={t('teachersModule.stats.roles')}
            value={isLoading ? '...' : formatNumber(uniqueRoles.length)}
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
