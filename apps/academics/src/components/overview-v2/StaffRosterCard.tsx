/**
 * StaffRosterCard — V2
 *
 * Staff list with DiceBear avatars (initials fallback), role/department info,
 * employment type badges, and department coverage summary.
 */

import { useMemo, useState } from 'react'
import { useTranslation } from '@edforge/i18n'
import { getStaffAvatar } from '../../lib/avatar'
import type { StaffResponseDto } from '../../services/staff.service'

function getInitials(staff: any): string {
  const first = staff.firstName?.[0] || ''
  const last = staff.lastSurname?.[0] || staff.lastName?.[0] || ''
  return (first + last).toUpperCase() || '?'
}

function getDisplayName(staff: any, fallback: string): string {
  const parts = [staff.firstName, staff.lastSurname || staff.lastName].filter(Boolean)
  return parts.join(' ') || staff.email || fallback
}

function getRole(staff: any, fallback: string): string {
  return staff.role || staff.staffRole || fallback
}

function getDepartment(staff: any, fallback: string): string {
  const assignments = staff.schoolAssignments || []
  if (assignments.length > 0 && assignments[0].department) {
    return assignments[0].department
  }
  return fallback
}

function getEmploymentType(staff: any): string {
  return staff.employmentType || 'full_time'
}

/** Hash a string to a deterministic color from a palette */
function hashColor(name: string): string {
  const palette = ['#1D9E75', '#378ADD', '#7F77DD', '#D85A30', '#EF9F27', '#5C2D91', '#0a9396', '#E24B4A']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
  return palette[Math.abs(hash) % palette.length]
}

function StaffAvatar({ staff, unknownLabel }: { staff: any; unknownLabel: string }) {
  const [imgError, setImgError] = useState(false)
  const name = getDisplayName(staff, unknownLabel)
  const staffId = staff.staffId || staff.id || name
  const src = getStaffAvatar(staffId)
  const initials = getInitials(staff)
  const bg = hashColor(name)

  if (imgError || !src) {
    return (
      <div
        // allow-presentation-style: per-staff deterministic avatar color
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold text-[rgb(var(--action-primary-fg))]"
        style={{ background: bg }}
      >
        {initials}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name}
      width={32}
      height={32}
      // allow-presentation-style: per-staff avatar bg shows behind the loading image
      className="w-8 h-8 rounded-full flex-shrink-0"
      style={{ background: bg, maxWidth: 32, maxHeight: 32 }}
      onError={() => setImgError(true)}
    />
  )
}

interface StaffRosterCardProps {
  staff: StaffResponseDto[]
  activeCount: number
  isLoading: boolean
  isError: boolean
  /** Render only the roster + department coverage (no card chrome / title) for WidgetCard framing. */
  bare?: boolean
}

function StaffSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full v2-skeleton-pulse flex-shrink-0 bg-[rgb(var(--background-tertiary))]" />
          <div className="flex-1 space-y-1">
            <div className="h-3 w-20 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
            <div className="h-2.5 w-28 rounded v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
          </div>
          <div className="h-4 w-14 rounded-full v2-skeleton-pulse bg-[rgb(var(--background-tertiary))]" />
        </div>
      ))}
    </div>
  )
}

export function StaffRosterCard({
  staff,
  activeCount,
  isLoading,
  isError,
  bare,
}: StaffRosterCardProps) {
  const { t } = useTranslation('academics')
  const unknownLabel = t('moduleOverview.staffRoster.unknown')
  const staffFallback = t('moduleOverview.staffRoster.staff')
  const generalFallback = t('moduleOverview.staffRoster.general')

  // Department coverage
  const departments = useMemo(() => {
    const deptMap = new Map<string, number>()
    for (const s of staff) {
      const dept = getDepartment(s, generalFallback)
      const role = getRole(s, staffFallback)
      if (role.toLowerCase() === 'teacher') {
        deptMap.set(dept, (deptMap.get(dept) || 0) + 1)
      }
    }
    return Array.from(deptMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [staff, generalFallback, staffFallback])

  const displayStaff = staff.slice(0, 5)

  const body = (
    <>
      {/* Staff list */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <StaffSkeleton />
        ) : isError ? (
          <div className="text-sm py-4 text-center text-[rgb(var(--text-tertiary))]">
            {t('moduleOverview.staffRoster.loadFailed')}
          </div>
        ) : displayStaff.length === 0 ? (
          <div className="text-sm py-4 text-center text-[rgb(var(--text-tertiary))]">
            {t('moduleOverview.staffRoster.empty')}
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayStaff.map((s, index) => {
              const empType = getEmploymentType(s)
              const isFullTime = empType === 'full_time' || empType === 'full-time'
              return (
                <div key={(s as any).staffId || index} className="flex items-center gap-3">
                  <StaffAvatar staff={s} unknownLabel={unknownLabel} />
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate text-[rgb(var(--text-secondary))]">
                      {getDisplayName(s, unknownLabel)}
                    </p>
                    <p className="text-xs truncate text-[rgb(var(--text-disabled))]">
                      {getRole(s, staffFallback)} · {getDepartment(s, generalFallback)}
                    </p>
                  </div>
                  {/* Badge */}
                  <span
                    // allow-presentation-style: employment-type chip tint (full-time/contract)
                    className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      background: isFullTime ? 'rgba(29,158,117,0.10)' : 'rgba(239,159,39,0.10)',
                      color: isFullTime ? '#1D9E75' : '#EF9F27',
                    }}
                  >
                    {isFullTime ? t('moduleOverview.staffRoster.fullTime') : t('moduleOverview.staffRoster.contract')}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Department coverage */}
      {departments.length > 0 && (
        <>
          <div className="my-3 h-px bg-[rgb(var(--border-primary)/0.35)]" />
          <div className="space-y-1.5">
            {departments.slice(0, 4).map((dept) => (
              <div key={dept.name} className="flex items-center justify-between">
                <span className="text-xs text-[rgb(var(--text-disabled))]">
                  {dept.name}
                </span>
                <span className="text-xs font-medium text-[rgb(var(--accent-enrollment-text))]">
                  {t('moduleOverview.staffRoster.teachers', { count: dept.count })}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )

  if (bare) return body

  return (
    <div
      // allow-presentation-style: card padding (18px) is off the 4px scale
      className="rounded-xl border flex flex-col bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary)/0.35)]"
      style={{ padding: 18 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[rgb(var(--text-secondary))]">
          {t('moduleOverview.staffRoster.title')}
        </h3>
        <span className="text-xs font-medium text-[rgb(var(--text-tertiary))]">
          {t('moduleOverview.staffRoster.active', { count: activeCount })}
        </span>
      </div>
      {body}
    </div>
  )
}
