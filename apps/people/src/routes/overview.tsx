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
        title="People & HR"
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
        <em className="font-medium not-italic text-[var(--v2-brand-accent,#D85A30)]">
          {stats.total} staff member{stats.total !== 1 ? 's' : ''}
        </em>
        {' · '}
        <span className="font-medium text-[var(--v2-success)]">
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 10,
            marginBottom: 18,
          }}
        >
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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr',
          gap: 12,
          marginBottom: 12,
        }}
      >
        {/* STAFF ROSTER */}
        <div
          style={{
            background: 'var(--v2-bg-surface, #161b27)',
            border: '1px solid var(--v2-border-default, rgba(255,255,255,0.06))',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 14px',
              borderBottom: '1px solid var(--v2-border-default, rgba(255,255,255,0.06))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--v2-text-primary, #e8eaf0)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 5,
                  background: 'rgba(216,90,48,0.10)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users style={{ width: 12, height: 12, color: '#D85A30' }} />
              </div>
              Staff roster
            </div>
            <button
              type="button"
              onClick={() => navigate({ to: '/staff' as string })}
              style={{
                fontSize: 11,
                color: '#D85A30',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                fontWeight: 500,
              }}
            >
              View directory{' '}
              <ChevronRight style={{ width: 10, height: 10 }} />
            </button>
          </div>
          <div style={{ padding: '4px 14px 10px' }}>
            {isLoading ? (
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--v2-text-hint, #4a5068)' }}>
                  Loading staff...
                </span>
              </div>
            ) : staff.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--v2-text-hint, #4a5068)' }}>
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
        <div
          style={{
            background: 'var(--v2-bg-surface, #161b27)',
            border: '1px solid var(--v2-border-default, rgba(255,255,255,0.06))',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 14px',
              borderBottom: '1px solid var(--v2-border-default, rgba(255,255,255,0.06))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--v2-text-primary, #e8eaf0)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 5,
                  background: 'rgba(55,138,221,0.10)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BarChart3 style={{ width: 12, height: 12, color: '#378ADD' }} />
              </div>
              Employment breakdown
            </div>
          </div>
          <div style={{ padding: '10px 14px' }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: 'var(--v2-text-ghost, #2a3045)',
                marginBottom: 8,
              }}
            >
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

            <div
              style={{
                height: 1,
                background: 'rgba(255,255,255,0.05)',
                margin: '10px 0',
              }}
            />

            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: 'var(--v2-text-ghost, #2a3045)',
                marginBottom: 8,
              }}
            >
              By department
            </div>
            {stats.departments.length === 0 ? (
              <div style={{ fontSize: 11, color: 'var(--v2-text-hint, #4a5068)' }}>
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

      {/* THREE-COL: Activity + Dir shortcut + HR shortcut */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 12,
        }}
      >
        {/* RECENT ACTIVITY */}
        <div
          style={{
            background: 'var(--v2-bg-surface, #161b27)',
            border: '1px solid var(--v2-border-default, rgba(255,255,255,0.06))',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 14px',
              borderBottom: '1px solid var(--v2-border-default, rgba(255,255,255,0.06))',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 5,
                background: 'rgba(239,159,39,0.10)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock style={{ width: 12, height: 12, color: '#EF9F27' }} />
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--v2-text-primary, #e8eaf0)',
              }}
            >
              Recent activity
            </span>
          </div>
          <div style={{ padding: '4px 14px 10px' }}>
            {activityFeed.length === 0 ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      padding: '7px 0',
                      borderBottom:
                        i < 3
                          ? '1px solid rgba(255,255,255,0.04)'
                          : 'none',
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: 'var(--v2-text-hint, #4a5068)',
                        flexShrink: 0,
                        marginTop: 4,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        color: 'var(--v2-text-hint, #4a5068)',
                      }}
                    >
                      No recent activity
                    </span>
                  </div>
                ))}
              </>
            ) : (
              activityFeed.map((item, i) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '7px 0',
                    borderBottom:
                      i < activityFeed.length - 1
                        ? '1px solid rgba(255,255,255,0.04)'
                        : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: item.color,
                      flexShrink: 0,
                      marginTop: 4,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--v2-text-secondary, #c8ccd8)',
                        lineHeight: 1.5,
                      }}
                    >
                      {item.text}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        color: 'var(--v2-text-ghost, #2a3045)',
                        marginTop: 2,
                      }}
                    >
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
          style={{
            background: 'var(--v2-bg-surface, #161b27)',
            border: '1px solid var(--v2-border-default, rgba(255,255,255,0.06))',
            borderRadius: 10,
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'border-color 0.12s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor =
              'var(--v2-border-default, rgba(255,255,255,0.06))'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: 'rgba(29,158,117,0.10)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users style={{ width: 14, height: 14, color: '#1D9E75' }} />
            </div>
            <ChevronRight
              style={{
                width: 14,
                height: 14,
                color: 'var(--v2-text-ghost, #2a3045)',
              }}
            />
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--v2-text-primary, #e8eaf0)',
            }}
          >
            Staff Directory
          </div>
          <div
            style={{
              fontSize: 10,
              color: 'var(--v2-text-muted, #7a8099)',
              lineHeight: 1.5,
            }}
          >
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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 0',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <img
        src={getStaffAvatar(s.staffId)}
        alt={`${s.firstName} ${s.lastSurname}`}
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          flexShrink: 0,
          objectFit: 'cover',
        }}
        loading="lazy"
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--v2-text-primary, #e8eaf0)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {s.firstName} {s.lastSurname}
        </div>
        <div
          style={{
            fontSize: 10,
            color: 'var(--v2-text-ghost, #2a3045)',
          }}
        >
          {s.role?.replace('_', ' ')} · {s.email}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <StaffRoleChip role={s.role} />
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: s.userId ? '#1D9E75' : 'var(--v2-text-hint, #4a5068)',
          }}
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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: 'var(--v2-text-muted, #7a8099)',
          width: 68,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: 5,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: 3,
            background: color,
            width: `${pct}%`,
            transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
          }}
        />
      </div>
      <span
        style={{
          fontSize: 10,
          color: 'var(--v2-text-hint, #4a5068)',
          width: 32,
          textAlign: 'right',
        }}
      >
        {showCount ? value : `${pct}%`}
      </span>
    </div>
  )
}
