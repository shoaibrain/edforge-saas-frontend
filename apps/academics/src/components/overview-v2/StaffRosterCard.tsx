/**
 * StaffRosterCard — V2
 *
 * Staff list with DiceBear avatars (initials fallback), role/department info,
 * employment type badges, and department coverage summary.
 */

import { useMemo, useState } from 'react'
import { getStaffAvatar } from '../../lib/avatar'
import type { StaffResponseDto } from '../../services/staff.service'

function getInitials(staff: any): string {
  const first = staff.firstName?.[0] || ''
  const last = staff.lastSurname?.[0] || staff.lastName?.[0] || ''
  return (first + last).toUpperCase() || '?'
}

function getDisplayName(staff: any): string {
  const parts = [staff.firstName, staff.lastSurname || staff.lastName].filter(Boolean)
  return parts.join(' ') || staff.email || 'Unknown'
}

function getRole(staff: any): string {
  return staff.role || staff.staffRole || 'Staff'
}

function getDepartment(staff: any): string {
  const assignments = staff.schoolAssignments || []
  if (assignments.length > 0 && assignments[0].department) {
    return assignments[0].department
  }
  return 'General'
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

function StaffAvatar({ staff }: { staff: any }) {
  const [imgError, setImgError] = useState(false)
  const name = getDisplayName(staff)
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
}: StaffRosterCardProps) {
  // Department coverage
  const departments = useMemo(() => {
    const deptMap = new Map<string, number>()
    for (const s of staff) {
      const dept = getDepartment(s)
      const role = getRole(s)
      if (role.toLowerCase() === 'teacher') {
        deptMap.set(dept, (deptMap.get(dept) || 0) + 1)
      }
    }
    return Array.from(deptMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [staff])

  const displayStaff = staff.slice(0, 5)

  return (
    <div
      // allow-presentation-style: card padding (18px) is off the 4px scale
      className="rounded-xl border flex flex-col bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary)/0.35)]"
      style={{ padding: 18 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[rgb(var(--text-secondary))]">
          Staff roster
        </h3>
        <span className="text-xs font-medium text-[rgb(var(--text-tertiary))]">
          {activeCount} active
        </span>
      </div>

      {/* Staff list */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <StaffSkeleton />
        ) : isError ? (
          <div className="text-sm py-4 text-center text-[rgb(var(--text-tertiary))]">
            Unable to load staff data
          </div>
        ) : displayStaff.length === 0 ? (
          <div className="text-sm py-4 text-center text-[rgb(var(--text-tertiary))]">
            No staff members
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayStaff.map((s, index) => {
              const empType = getEmploymentType(s)
              const isFullTime = empType === 'full_time' || empType === 'full-time'
              return (
                <div key={(s as any).staffId || index} className="flex items-center gap-3">
                  <StaffAvatar staff={s} />
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate text-[rgb(var(--text-secondary))]">
                      {getDisplayName(s)}
                    </p>
                    <p className="text-xs truncate text-[rgb(var(--text-disabled))]">
                      {getRole(s)} · {getDepartment(s)}
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
                    {isFullTime ? 'Full-time' : 'Contract'}
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
                <span className="text-xs font-medium text-[#1D9E75]">
                  {dept.count} teacher{dept.count !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
