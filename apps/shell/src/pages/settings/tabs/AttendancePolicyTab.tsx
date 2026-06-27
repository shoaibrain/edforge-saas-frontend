/**
 * Attendance Policy Tab — Attendance Domain epic (Story 4: "Admin configures
 * attendance mode").
 *
 * Lets a TenantAdmin pick the school's attendance recording mode:
 *   - daily_presence       (PABSON default; cross-section locking)
 *   - per_section_granular  (platform default; threshold roll-up)
 *
 * Read path: GET /academics/attendance/policy?schoolId= (the resolver, which
 * also tells us where the current value came from via `modeSource`).
 * Write path: PATCH /schools/{id}/configuration { attendancePolicy } — reusing
 * the existing identity school-config endpoint (TenantAdmin-only server-side,
 * so Save is gated on TenantAdmin here, Decision D-B).
 *
 * Threshold is read-only for now (Decision D-A): per-school threshold config is
 * a future add; today we surface the resolved archetype default.
 */

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { RadioGroup } from '@edforge/ui'
import type { School } from '@edforge/types'
import type { AttendancePolicy } from '@aibrains/shared-types'
import { useAuthStore } from '@/stores/auth.store'
import {
  useSchoolAttendancePolicy,
  useUpdateSchoolAttendancePolicy,
} from '@/hooks/useAttendancePolicy'

// ============================================================================
// SECTION CARD (mirrors ConfigurationTab)
// ============================================================================

interface SectionCardProps {
  icon: string
  iconBg?: string
  title: string
  subtitle: string
  headerExtra?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
}

function SectionCard({ icon, iconBg = 'bg-[rgba(55,138,221,0.1)]', title, subtitle, headerExtra, children, footer }: SectionCardProps) {
  return (
    <div className="bg-[rgb(var(--background-primary))] border border-[rgba(255,255,255,0.06)] rounded-xl">
      <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.05)] flex items-center gap-2.5">
        <div className={`w-6 h-6 rounded-lg ${iconBg} flex items-center justify-center text-sm`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-[rgb(var(--text-primary))]">{title}</h3>
            {headerExtra}
          </div>
          <p className="text-xs text-[rgb(var(--text-tertiary))] mt-px">{subtitle}</p>
        </div>
      </div>
      {children}
      {footer && (
        <div className="px-4 py-2.5 border-t border-[rgba(255,255,255,0.05)] flex justify-end gap-2">
          {footer}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// MODE OPTIONS
// ============================================================================

const MODE_OPTIONS: { value: AttendancePolicy; label: string; description: string }[] = [
  {
    value: 'daily_presence',
    label: 'Daily Presence',
    description:
      'A student is marked present for the day if they attend any class. Once recorded in one class, other teachers see them as locked (they can still mark Tardy or Excused).',
  },
  {
    value: 'per_section_granular',
    label: 'Per-Section Granular',
    description:
      "Track attendance per class independently. A student's daily presence is calculated from their class attendance using a threshold.",
  },
]

const MODE_LABELS: Record<AttendancePolicy, string> = {
  daily_presence: 'Daily Presence',
  per_section_granular: 'Per-Section Granular',
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface AttendancePolicyTabProps {
  schoolId: string
  school?: School
}

export default function AttendancePolicyTab({ schoolId }: AttendancePolicyTabProps) {
  const user = useAuthStore(s => s.user)
  const isTenantAdmin = user?.globalRole === 'TenantAdmin'

  const { data: policy, isLoading } = useSchoolAttendancePolicy(schoolId)
  const updateMutation = useUpdateSchoolAttendancePolicy(schoolId)

  const [selectedMode, setSelectedMode] = useState<AttendancePolicy>('daily_presence')

  // Sync local selection from the resolved policy once loaded.
  useEffect(() => {
    if (policy?.effectiveMode) {
      setSelectedMode(policy.effectiveMode)
    }
  }, [policy?.effectiveMode])

  if (isLoading || !policy) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-64 bg-[rgb(var(--background-secondary))] rounded-xl" />
      </div>
    )
  }

  const dirty = selectedMode !== policy.effectiveMode

  const sourceBadge =
    policy.modeSource === 'school'
      ? 'School override'
      : `Using ${policy.archetype ? `${policy.archetype} ` : ''}default`

  const handleSave = () => {
    updateMutation.mutate(selectedMode, {
      onSuccess: () => {
        toast.success(`Attendance mode updated to ${MODE_LABELS[selectedMode]}`)
      },
      onError: (err: any) => {
        toast.error(err?.message || 'Failed to update attendance mode')
      },
    })
  }

  return (
    <div className="space-y-3">
      <SectionCard
        icon="🟢"
        title="Attendance Recording Mode"
        subtitle="Choose how this school records and rolls up daily attendance."
        headerExtra={
          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-[rgba(55,138,221,0.08)] text-[#378ADD]">
            {sourceBadge}
          </span>
        }
        footer={
          isTenantAdmin ? (
            <>
              <button
                onClick={() => setSelectedMode(policy.effectiveMode)}
                disabled={!dirty}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[rgba(255,255,255,0.08)] text-[rgb(var(--text-tertiary))] hover:bg-[rgba(255,255,255,0.04)] disabled:opacity-40 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!dirty || updateMutation.isPending}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#1D9E75] text-[rgb(var(--action-primary-fg))] hover:opacity-90 disabled:opacity-40 transition-all"
              >
                Save
              </button>
            </>
          ) : undefined
        }
      >
        <div className="p-4 space-y-4">
          <RadioGroup
            variant="card"
            options={MODE_OPTIONS}
            value={selectedMode}
            onChange={v => setSelectedMode(v as AttendancePolicy)}
            disabled={!isTenantAdmin}
          />

          {/* Threshold info — only meaningful under per-section granular.
              Read-only fallback (Decision D-A): no slider yet. */}
          {selectedMode === 'per_section_granular' && (
            <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] px-3 py-2.5 opacity-70">
              <p className="text-xs text-[rgb(var(--text-secondary))]">
                Presence threshold: <strong>{policy.countingPolicy.granularPresenceThresholdPct}%</strong>
                {' '}— a student is present for the day if they attend at least that share of their classes.
              </p>
              <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
                Per-school threshold configuration is coming soon; this value is the archetype default.
              </p>
            </div>
          )}

          {!isTenantAdmin && (
            <p className="text-xs text-[rgb(var(--text-tertiary))] italic">
              Only tenant administrators can change the attendance mode.
            </p>
          )}
        </div>
      </SectionCard>
    </div>
  )
}
