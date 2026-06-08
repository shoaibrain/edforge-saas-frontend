/**
 * People Overview Page — V2
 *
 * Data command center replacing the old navigation-card layout.
 * Uses live staff data from useStaffList hook.
 */

import { useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Users,
  UserPlus,
  BookOpen,
  Lock,
  Briefcase,
  ChevronRight,
  Clock,
  BarChart3,
} from 'lucide-react'
import {
  Container,
  focusRing,
  focusRingInset,
  Inline,
  PageHeader,
  StatCard,
  Text,
  WidgetErrorBoundaryV2,
} from '@edforge/ui'
import type { StaffResponseDto } from '@aibrains/shared-types'

import { useStaffList } from '../hooks'
import { useModalState } from '../hooks'
import { useActiveSchoolId } from '../stores/app.store'
import { getStaffAvatar } from '../lib/avatar'
import { StaffRoleChip } from '../components/staff/StaffRoleChip'
import { CreateUserModal } from '../components/staff'

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(d?: string | Date | null): string {
  if (!d) return ''
  const date = new Date(d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Overview() {
  const navigate = useNavigate()
  const schoolId = useActiveSchoolId()
  const modal = useModalState()

  const { items: staff, isLoading } = useStaffList(
    schoolId ? { schoolId } : undefined,
  )

  // Derived stats
  const stats = useMemo(() => {
    const teachers = staff.filter((s) => s.role === 'teacher')
    const principals = staff.filter(
      (s) => s.role === 'principal' || s.role === 'vice_principal',
    )
    const support = staff.filter(
      (s) =>
        s.role === 'support_staff' ||
        s.role === 'admin_staff' ||
        s.role === 'it_staff',
    )
    const withAccess = staff.filter((s) => !!s.userId)
    const noAccess = staff.length - withAccess.length

    // Employment type counts
    const fullTime = staff.filter((s) => s.employmentStatus === 'active').length
    const contract = staff.filter((s) => s.employmentStatus === 'on_leave').length
    const partTime = staff.length - fullTime - contract

    // Department breakdown
    const deptMap = new Map<string, number>()
    for (const s of staff) {
      const dept = s.departmentName || 'Unassigned'
      deptMap.set(dept, (deptMap.get(dept) || 0) + 1)
    }
    const departments = Array.from(deptMap.entries())
      .sort((a, b) => b[1] - a[1])

    return {
      total: staff.length,
      teachers: teachers.length,
      principals: principals.length,
      support: support.length,
      withAccess: withAccess.length,
      noAccess,
      fullTime,
      contract,
      partTime,
      departments,
    }
  }, [staff])

  // Activity feed — derive from staff creation dates
  const activityFeed = useMemo(() => {
    return [...staff]
      .filter((s) => s.createdAt)
      .sort(
        (a, b) =>
          new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime(),
      )
      .slice(0, 5)
      .map((s) => ({
        id: s.staffId,
        text: `${s.firstName} ${s.lastSurname} ${s.userId ? 'account created and system access enabled' : `onboarded as ${s.role?.replace('_', ' ') || 'staff'} — no system access`}`,
        time: formatDate(s.createdAt),
        color: s.userId ? '#1D9E75' : '#7F77DD',
      }))
  }, [staff])

  return (
    <Container data-v2 size="full" padding="lg" className="overflow-auto py-6">
      {/* PAGE HEADER */}
      <PageHeader
        className="mb-2"
        title="People"
        description={new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
        actions={(
          <Inline gap="sm">
          <button
            type="button"
            onClick={() => navigate({ to: '/staff' as string })}
            className={`inline-flex h-9 items-center gap-1.5 rounded-lg border border-border-secondary bg-surface-secondary px-3.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-text-primary ${focusRingInset}`}
          >
            <Users className="h-3.5 w-3.5" />
            Staff Directory
          </button>
          <button
            type="button"
            onClick={() => modal.openCreate()}
            className={`inline-flex h-9 items-center gap-1.5 rounded-lg bg-[rgb(var(--action-primary-bg))] px-3.5 text-xs font-medium text-[rgb(var(--text-inverted))] transition-colors hover:bg-[rgb(var(--state-info-fg))] ${focusRing}`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add Staff Member
          </button>
          </Inline>
        )}
      />

      {/* CONTEXT BANNER */}
      <Text variant="caption" className="mb-5">
        <em className="font-medium not-italic text-[rgb(var(--action-secondary-fg))]">
          {stats.total} staff member{stats.total !== 1 ? 's' : ''}
        </em>
        {' · '}
        <span className="font-medium text-[rgb(var(--state-success-fg))]">
          {stats.teachers} teacher{stats.teachers !== 1 ? 's' : ''}
        </span>
        {' · '}
        <span className="font-medium text-[rgb(var(--state-info-fg))]">
          {stats.principals} principal{stats.principals !== 1 ? 's' : ''}
        </span>
        {' · '}
        <span className="font-medium text-[rgb(var(--action-primary-bg))]">
          {stats.withAccess} with system access enabled
        </span>
      </Text>

      {/* KPI TILES */}
      <WidgetErrorBoundaryV2>
        <div className="mb-4 grid grid-cols-4 gap-2.5">
          <StatCard
            label="Total Staff"
            value={isLoading ? '—' : stats.total.toString()}
            icon={Users}
            accentColor="rgba(216,90,48,0.10)"
            iconColor="#D85A30"
            barColor="#D85A30"
            valueColor="#D85A30"
            tag={{ text: '+1 this month', color: '#D85A30', bg: 'rgba(216,90,48,0.10)' }}
            loading={isLoading}
          />
          <StatCard
            label="Active Teachers"
            value={isLoading ? '—' : stats.teachers.toString()}
            icon={BookOpen}
            accentColor="rgba(29,158,117,0.10)"
            iconColor="#1D9E75"
            barColor="#1D9E75"
            valueColor="#1D9E75"
            tag={{ text: 'full-time + contract', color: '#1D9E75', bg: 'rgba(29,158,117,0.10)' }}
            loading={isLoading}
          />
          <StatCard
            label="Support Staff"
            value={isLoading ? '—' : stats.support.toString()}
            icon={Briefcase}
            accentColor={stats.support > 0 ? 'rgba(55,138,221,0.10)' : 'rgba(255,255,255,0.06)'}
            iconColor={stats.support > 0 ? '#378ADD' : 'var(--v2-text-hint, #4a5068)'}
            barColor={stats.support > 0 ? '#378ADD' : 'var(--v2-text-ghost, #2a3045)'}
            valueColor={stats.support > 0 ? '#378ADD' : 'var(--v2-text-hint, #4a5068)'}
            tag={{
              text: stats.support > 0 ? 'active' : 'none onboarded',
              color: stats.support > 0 ? '#378ADD' : 'var(--v2-text-hint, #4a5068)',
              bg: stats.support > 0 ? 'rgba(55,138,221,0.10)' : 'rgba(255,255,255,0.05)',
            }}
            loading={isLoading}
          />
          <StatCard
            label="System Access"
            value={isLoading ? '—' : stats.withAccess.toString()}
            icon={Lock}
            accentColor="rgba(55,138,221,0.10)"
            iconColor="#378ADD"
            barColor="#378ADD"
            valueColor="#378ADD"
            tag={{
              text: `${stats.noAccess} no access`,
              color: '#378ADD',
              bg: 'rgba(55,138,221,0.10)',
            }}
            loading={isLoading}
          />
        </div>
      </WidgetErrorBoundaryV2>

      {/* TWO-COL: Staff Roster + Employment Breakdown */}
      <div className="mb-3 grid grid-cols-[1.6fr_1fr] gap-3">
        {/* STAFF ROSTER */}
        <div className="overflow-hidden rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))]">
          <div className="flex items-center justify-between border-b border-[rgb(var(--border-primary))] px-3.5 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[rgb(var(--text-primary))]">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-[rgb(var(--action-secondary-fg))]/10">
                <Users className="h-3 w-3 text-[rgb(var(--action-secondary-fg))]" />
              </div>
              Staff roster
            </div>
            <button
              type="button"
              onClick={() => navigate({ to: '/staff' as string })}
              className="flex cursor-pointer items-center gap-1 text-xs font-medium text-[rgb(var(--action-secondary-fg))]"
            >
              View directory{' '}
              <ChevronRight className="h-2.5 w-2.5" />
            </button>
          </div>
          <div className="px-3.5 pb-2.5 pt-1">
            {isLoading ? (
              <div className="py-5 text-center">
                <span className="text-xs text-[rgb(var(--text-tertiary))]">
                  Loading staff...
                </span>
              </div>
            ) : staff.length === 0 ? (
              <div className="py-5 text-center">
                <span className="text-xs text-[rgb(var(--text-tertiary))]">
                  No staff members yet
                </span>
              </div>
            ) : (
              staff.slice(0, 5).map((s) => (
                <StaffRow key={s.staffId} staff={s} />
              ))
            )}
          </div>
        </div>

        {/* EMPLOYMENT BREAKDOWN */}
        <div className="overflow-hidden rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))]">
          <div className="flex items-center justify-between border-b border-[rgb(var(--border-primary))] px-3.5 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[rgb(var(--text-primary))]">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-[rgb(var(--state-info-fg))]/10">
                <BarChart3 className="h-3 w-3 text-[rgb(var(--state-info-fg))]" />
              </div>
              Employment breakdown
            </div>
          </div>
          <div className="px-3.5 py-2.5">
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-[rgb(var(--text-disabled))]">
              Employment type
            </div>
            <BarRow
              label="Full-time"
              value={stats.fullTime}
              total={stats.total}
              color="#D85A30"
            />
            <BarRow
              label="Contract"
              value={stats.contract}
              total={stats.total}
              color="#EF9F27"
            />
            <BarRow
              label="Part-time"
              value={stats.partTime}
              total={stats.total}
              color="#378ADD"
            />

            <div className="my-2.5 h-px bg-[rgb(var(--border-primary))]" />

            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-[rgb(var(--text-disabled))]">
              By department
            </div>
            {stats.departments.length === 0 ? (
              <div className="text-xs text-[rgb(var(--text-tertiary))]">
                No departments assigned
              </div>
            ) : (
              stats.departments.slice(0, 4).map(([dept, count]) => (
                <BarRow
                  key={dept}
                  label={dept}
                  value={count}
                  total={stats.total}
                  color="#7F77DD"
                  showCount
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* TWO-COL: Activity (wide) + Staff Directory shortcut (HR shortcut removed — out of scope) */}
      <div className="grid grid-cols-[2fr_1fr] gap-3">
        {/* RECENT ACTIVITY */}
        <div className="overflow-hidden rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))]">
          <div className="flex items-center gap-2 border-b border-[rgb(var(--border-primary))] px-3.5 py-3">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-[rgb(var(--state-warning-fg))]/10">
              <Clock className="h-3 w-3 text-[rgb(var(--state-warning-fg))]" />
            </div>
            <span className="text-xs font-semibold text-[rgb(var(--text-primary))]">
              Recent activity
            </span>
          </div>
          <div className="px-3.5 pb-2.5 pt-1">
            {activityFeed.length === 0 ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 py-1.5 ${i < 3 ? 'border-b border-[rgb(var(--border-primary))]' : ''}`}
                  >
                    <div className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[rgb(var(--text-tertiary))]" />
                    <span className="text-xs text-[rgb(var(--text-tertiary))]">
                      No recent activity
                    </span>
                  </div>
                ))}
              </>
            ) : (
              activityFeed.map((item, i) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-2 py-1.5 ${i < activityFeed.length - 1 ? 'border-b border-[rgb(var(--border-primary))]' : ''}`}
                >
                  <div
                    // allow-presentation-style: dot color is data-driven (per-activity success/role tone)
                    style={{ background: item.color }}
                    className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="text-xs leading-normal text-[rgb(var(--text-secondary))]">
                      {item.text}
                    </div>
                    <div className="mt-0.5 text-xs text-[rgb(var(--text-disabled))]">
                      {item.time}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* STAFF DIRECTORY SHORTCUT */}
        <button
          type="button"
          onClick={() => navigate({ to: '/staff' as string })}
          className={`flex cursor-pointer flex-col gap-2 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] p-3.5 text-left transition-colors hover:border-[rgb(var(--border-secondary))] ${focusRing}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[rgb(var(--state-success-fg))]/10">
              <Users className="h-3.5 w-3.5 text-[rgb(var(--state-success-fg))]" />
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-[rgb(var(--text-disabled))]" />
          </div>
          <div className="text-xs font-semibold text-[rgb(var(--text-primary))]">
            Staff Directory
          </div>
          <div className="text-xs leading-normal text-[rgb(var(--text-tertiary))]">
            View, search and manage all staff members, roles and system access.
          </div>
        </button>
      </div>

      {/* CREATE USER MODAL */}
      <CreateUserModal
        open={modal.mode === 'create'}
        onClose={modal.close}
      />
    </Container>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StaffRow({ staff: s }: { staff: StaffResponseDto }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-[rgb(var(--border-primary))] py-2">
      <img
        src={getStaffAvatar(s.staffId)}
        alt={`${s.firstName} ${s.lastSurname}`}
        className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
        loading="lazy"
      />
      <div className="min-w-0 flex-1">
        <div className="overflow-hidden text-ellipsis whitespace-nowrap text-xs font-medium text-[rgb(var(--text-primary))]">
          {s.firstName} {s.lastSurname}
        </div>
        <div className="text-xs text-[rgb(var(--text-disabled))]">
          {s.role?.replace('_', ' ')} · {s.email}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <StaffRoleChip role={s.role} />
        <div
          className={`h-1.5 w-1.5 rounded-full ${s.userId ? 'bg-[rgb(var(--state-success-fg))]' : 'bg-[rgb(var(--text-tertiary))]'}`}
          title={s.userId ? 'System Access Active' : 'No System Access'}
        />
      </div>
    </div>
  )
}

function BarRow({
  label,
  value,
  total,
  color,
  showCount,
}: {
  label: string
  value: number
  total: number
  color: string
  showCount?: boolean
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="w-16 flex-shrink-0 text-xs text-[rgb(var(--text-tertiary))]">
        {label}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded bg-[rgb(var(--border-primary))]">
        <div
          // allow-presentation-style: bar fill width is the data value (%) and color is the per-series prop
          style={{ background: color, width: `${pct}%` }}
          className="h-full rounded transition-[width] duration-700 ease-out"
        />
      </div>
      <span className="w-8 text-right text-xs text-[rgb(var(--text-tertiary))]">
        {showCount ? value : `${pct}%`}
      </span>
    </div>
  )
}
