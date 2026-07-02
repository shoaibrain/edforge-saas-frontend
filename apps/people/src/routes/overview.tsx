/**
 * People Overview Page — dashboard recipe
 *
 * PageHeader (pagebar, date-only — People isn't academic-year scoped) → StatBand
 * → WidgetCard grid. No signal source for People yet, so the ⑧ AttentionCorner
 * is omitted (same as Teacher Home; see header-zone-spec §7b for the planned
 * corner). Reuses the live `useStaffList` data + the inline StaffRow/BarRow
 * bodies, now framed by WidgetCard.
 */

import { useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Users, UserPlus, ChevronRight } from 'lucide-react'
import {
  Container,
  PageHeader,
  StatBand,
  type StatMetric,
  WidgetGrid,
  WidgetCard,
  WidgetErrorBoundaryV2,
} from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import type { StaffResponseDto } from '@aibrains/shared-types'

import { useStaffList } from '../hooks'
import { useModalState } from '../hooks'
import { useActiveSchoolId } from '../stores/app.store'
import { getStaffAvatar } from '../lib/avatar'
import { StaffRoleChip } from '../components/staff/StaffRoleChip'
import { getRoleI18nKey } from '../components/staff/StaffRoleBadge'
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
  const { t } = useTranslation('people')
  const navigate = useNavigate()
  const schoolId = useActiveSchoolId()
  const modal = useModalState()

  const { items: staff, isLoading } = useStaffList(
    schoolId ? { schoolId } : undefined,
  )

  const goStaff = () => navigate({ to: '/staff' as string })

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
      const dept = s.departmentName || t('common.unassigned')
      deptMap.set(dept, (deptMap.get(dept) || 0) + 1)
    }
    const departments = Array.from(deptMap.entries()).sort((a, b) => b[1] - a[1])

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
  }, [staff, t])

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
        text: s.userId
          ? t('overview.activity.accountCreated', { name: `${s.firstName} ${s.lastSurname}` })
          : t('overview.activity.onboardedNoAccess', {
              name: `${s.firstName} ${s.lastSurname}`,
              role: s.role
                ? t(`roles.${getRoleI18nKey(s.role)}`, { defaultValue: s.role })
                : t('overview.activity.staffFallback'),
            }),
        time: formatDate(s.createdAt),
        color: s.userId ? '#1D9E75' : '#7F77DD',
      }))
  }, [staff, t])

  // ── StatBand metrics (calm; attention only via state) ────────────────────
  const metrics: StatMetric[] = [
    {
      label: t('stats.totalStaff'),
      value: isLoading ? '—' : String(stats.total),
      iconSignature: 'people',
      state: 'normal',
      primary: true,
      sub: t('overview.stats.thisMonth', { count: 1 }),
    },
    {
      label: t('stats.activeTeachers'),
      value: isLoading ? '—' : String(stats.teachers),
      iconSignature: 'academics',
      state: 'normal',
      sub: t('overview.stats.fullTimeContract'),
    },
    {
      label: t('stats.supportStaff'),
      value: isLoading ? '—' : String(stats.support),
      iconSignature: 'staff',
      state: stats.support > 0 ? 'normal' : 'muted',
      sub: stats.support > 0 ? t('stats.tags.active') : t('overview.stats.noneOnboarded'),
    },
    {
      label: t('stats.systemAccess'),
      value: isLoading ? '—' : String(stats.withAccess),
      iconSignature: 'security',
      state: 'normal',
      sub: t('stats.tags.noAccess', { count: stats.noAccess }),
    },
  ]

  return (
    <Container size="full" padding="lg" className="overflow-auto py-6">
      {/* Screen-reader page heading (breadcrumb names the page visually) */}
      <h1 className="sr-only">{t('title')}</h1>

      {/* ---- Page header (pagebar) ---- */}
      <PageHeader
        className="mb-4"
        mode="pagebar"
        actions={[
          {
            label: t('staffDirectory.title'),
            icon: <Users className="h-3.5 w-3.5" />,
            onClick: goStaff,
          },
          {
            label: t('staffDirectory.addStaff'),
            icon: <UserPlus className="h-3.5 w-3.5" />,
            primary: true,
            onClick: () => modal.openCreate(),
          },
        ]}
      />

      {/* ---- StatBand — staff KPIs ---- */}
      <div className="mb-4">
        <StatBand metrics={metrics} ariaLabel={t('overview.kpi.region')} />
      </div>

      {/* ---- WidgetCard grid ---- */}
      <WidgetGrid>
        {/* Staff roster */}
        <WidgetCard
          title={t('overview.roster.title')}
          iconSignature="staff"
          span={8}
          footer={
            <button
              type="button"
              onClick={goStaff}
              className="inline-flex items-center gap-1 text-xs font-medium text-[rgb(var(--action-secondary-fg))] transition-opacity hover:opacity-80"
            >
              {t('overview.roster.viewDirectory')}
              <ChevronRight className="h-3 w-3" />
            </button>
          }
        >
          <WidgetErrorBoundaryV2>
            {isLoading ? (
              <div className="py-5 text-center">
                <span className="text-xs text-[rgb(var(--text-tertiary))]">
                  {t('overview.roster.loading')}
                </span>
              </div>
            ) : staff.length === 0 ? (
              <div className="py-5 text-center">
                <span className="text-xs text-[rgb(var(--text-tertiary))]">
                  {t('overview.roster.empty')}
                </span>
              </div>
            ) : (
              staff.slice(0, 5).map((s) => <StaffRow key={s.staffId} staff={s} />)
            )}
          </WidgetErrorBoundaryV2>
        </WidgetCard>

        {/* Employment breakdown */}
        <WidgetCard title={t('overview.breakdown.title')} iconSignature="overview" span={4}>
          <WidgetErrorBoundaryV2>
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-[rgb(var(--text-disabled))]">
              {t('overview.breakdown.employmentType')}
            </div>
            <BarRow label={t('employmentTypes.fullTime')} value={stats.fullTime} total={stats.total} color="#D85A30" />
            <BarRow label={t('overview.breakdown.contract')} value={stats.contract} total={stats.total} color="#EF9F27" />
            <BarRow label={t('overview.breakdown.partTime')} value={stats.partTime} total={stats.total} color="#378ADD" />

            <div className="my-2.5 h-px bg-[rgb(var(--border-primary))]" />

            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-[rgb(var(--text-disabled))]">
              {t('overview.breakdown.byDepartment')}
            </div>
            {stats.departments.length === 0 ? (
              <div className="text-xs text-[rgb(var(--text-tertiary))]">
                {t('overview.breakdown.noDepartments')}
              </div>
            ) : (
              stats.departments.slice(0, 4).map(([dept, count]) => (
                <BarRow key={dept} label={dept} value={count} total={stats.total} color="#7F77DD" showCount />
              ))
            )}
          </WidgetErrorBoundaryV2>
        </WidgetCard>

        {/* Recent activity */}
        <WidgetCard title={t('overview.activity.title')} iconSignature="overview" span={8}>
          <WidgetErrorBoundaryV2>
            {activityFeed.length === 0 ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 py-1.5 ${i < 3 ? 'border-b border-[rgb(var(--border-primary))]' : ''}`}
                  >
                    <div className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[rgb(var(--text-tertiary))]" />
                    <span className="text-xs text-[rgb(var(--text-tertiary))]">
                      {t('overview.activity.empty')}
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
          </WidgetErrorBoundaryV2>
        </WidgetCard>

        {/* Staff directory shortcut */}
        <WidgetCard title={t('staffDirectory.title')} iconSignature="staff" span={4}>
          <div className="flex h-full flex-col justify-between gap-3">
            <p className="text-xs leading-normal text-[rgb(var(--text-tertiary))]">
              {t('overview.directoryShortcutDescription')}
            </p>
            <button
              type="button"
              onClick={goStaff}
              className="inline-flex w-fit items-center gap-1 text-xs font-medium text-[rgb(var(--action-secondary-fg))] transition-opacity hover:opacity-80"
            >
              {t('overview.roster.viewDirectory')}
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </WidgetCard>
      </WidgetGrid>

      {/* CREATE USER MODAL */}
      <CreateUserModal open={modal.mode === 'create'} onClose={modal.close} />
    </Container>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StaffRow({ staff: s }: { staff: StaffResponseDto }) {
  const { t } = useTranslation('people')
  const roleLabel = s.role
    ? t(`roles.${getRoleI18nKey(s.role)}`, { defaultValue: s.role })
    : t('overview.activity.staffFallback')

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
          {roleLabel} · {s.email}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <StaffRoleChip role={s.role} />
        <div
          className={`h-1.5 w-1.5 rounded-full ${s.userId ? 'bg-[rgb(var(--state-success-fg))]' : 'bg-[rgb(var(--text-tertiary))]'}`}
          title={s.userId ? t('systemAccess.active') : t('systemAccess.noAccess')}
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
