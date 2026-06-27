/**
 * StudentQuickProfile — V3.1 Quick-info drawer
 *
 * Compact, enterprise-grade student profile card. Always-mounted drawer
 * with zero-layout-shift CSS transitions. DiceBear avatar consistency
 * with the table. Locale-aware enrollment dates.
 */

import { useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { X, ArrowRight, Lock, AlertTriangle } from 'lucide-react'
import type { StudentResponseDto } from '@aibrains/shared-types'
import { QuickDrawer, AttendanceDonutRing, focusRing, focusRingInset } from '@edforge/ui'
import { useDateFormatter, adToBS, formatBSDate } from '@edforge/date-utils'
import { UserAvatar } from '../common/UserAvatar'

// ============================================================================
// TYPES
// ============================================================================

export interface StudentQuickProfileProps {
  open: boolean
  onClose: () => void
  student: StudentResponseDto | null
  attendanceRate?: number
  academicYearName?: string
  /** @deprecated Kept for compat — V3 removed withdraw from drawer. */
  onWithdraw?: (student: StudentResponseDto) => void
  /** @deprecated Kept for compat — V3 removed section pills. */
  enrolledSections?: string[]
}

// ============================================================================
// STATUS STYLE MAP
// ============================================================================

const STATUS_STYLES: Record<string, { pill: string; dot: string }> = {
  active: {
    pill: 'bg-[rgb(var(--state-success-bg))] text-[rgb(var(--state-success-fg))]',
    dot: 'bg-[rgb(var(--state-success-fg))]',
  },
  pending: {
    pill: 'bg-[rgb(var(--state-warning-bg))] text-[rgb(var(--state-warning-fg))]',
    dot: 'bg-[rgb(var(--state-warning-fg))]',
  },
  inactive: {
    pill: 'bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))]',
    dot: 'bg-[rgb(var(--text-tertiary))]',
  },
  withdrawn: {
    pill: 'bg-[rgb(var(--state-danger-bg))] text-[rgb(var(--state-danger-fg))]',
    dot: 'bg-[rgb(var(--state-danger-fg))]',
  },
  suspended: {
    pill: 'bg-[rgb(var(--state-danger-bg))] text-[rgb(var(--state-danger-fg))]',
    dot: 'bg-[rgb(var(--state-danger-fg))]',
  },
  graduated: {
    pill: 'bg-[rgb(var(--state-info-bg))] text-[rgb(var(--state-info-fg))]',
    dot: 'bg-[rgb(var(--state-info-fg))]',
  },
  transferred: {
    pill: 'bg-[rgb(var(--state-warning-bg))] text-[rgb(var(--state-warning-fg))]',
    dot: 'bg-[rgb(var(--state-warning-fg))]',
  },
}
const DEFAULT_STATUS = STATUS_STYLES.inactive

function attColor(r: number | undefined) {
  if (r == null) return 'rgb(var(--text-disabled))'
  if (r < 80) return 'rgb(var(--state-danger-fg))'
  if (r < 90) return 'rgb(var(--state-warning-fg))'
  return 'rgb(var(--state-success-fg))'
}

// ============================================================================
// COMPONENT
// ============================================================================

export function StudentQuickProfile({
  open,
  onClose,
  student,
  attendanceRate,
  academicYearName,
}: StudentQuickProfileProps) {
  const navigate = useNavigate()
  const { calendarSystem } = useDateFormatter()

  const handleViewProfile = useCallback(() => {
    if (!student) return
    onClose()
    queueMicrotask(() => navigate({ to: `/students/${student.studentId}` }))
  }, [student, onClose, navigate])

  if (!student) return null

  // ── derived values ──────────────────────────────────────────────
  const ss = STATUS_STYLES[student.status] || DEFAULT_STATUS
  const statusText = student.status
    ? student.status.charAt(0).toUpperCase() + student.status.slice(1)
    : 'Active'
  const isAtRisk = attendanceRate != null && attendanceRate < 80
  const accent = attColor(attendanceRate)

  // locale-aware enrolled date
  const dt = student.enrollmentDate ? new Date(student.enrollmentDate) : null
  const ok = dt && !isNaN(dt.getTime())
  const ad = ok ? dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
  const bs = ok ? `BS ${formatBSDate(adToBS(dt))}` : null
  const enrollPrimary = calendarSystem === 'bs' ? (bs || '—') : ad
  const enrollSub = calendarSystem === 'bs' ? ad : bs

  return (
    <QuickDrawer isOpen={open} onClose={onClose} width={360} ariaLabelledBy="sqp-name">

      {/* ─── HEADER ──────────────────────────────────────────────── */}
      <QuickDrawer.Header className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          {/* avatar */}
          <div className="flex-shrink-0" style={{ width: 44, height: 44 }}>
            <UserAvatar userId={student.studentId} userName={student.fullName} role="student" size="lg" />
          </div>

          {/* identity */}
          <div className="flex-1 min-w-0 pt-[1px]">
            <h2
              id="sqp-name"
              className="text-sm font-semibold truncate text-[rgb(var(--text-primary))] tracking-[-0.2px] leading-[1.25]"
            >
              {student.fullName}
            </h2>
            <div className="flex items-center gap-2 mt-[3px]">
              {student.studentNumber && (
                <span className="font-mono text-xs text-[rgb(var(--text-tertiary))]">
                  #{student.studentNumber}
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-px text-xs font-medium ${ss.pill}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${ss.dot}`} />
                {statusText}
              </span>
            </div>
          </div>

          {/* close */}
          <button
            type="button"
            onClick={onClose}
            className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-tertiary)/0.6)] transition-colors hover:opacity-80 ${focusRingInset}`}
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))]" />
          </button>
        </div>
      </QuickDrawer.Header>

      {/* ─── BODY ────────────────────────────────────────────────── */}
      <QuickDrawer.Body>
        <div className="px-4 pt-4 pb-5 space-y-[14px]">

          {/* ── At-risk banner ── */}
          {isAtRisk && (
            <div
              className="flex items-center gap-2 rounded-lg border border-[rgb(var(--state-danger-border))] bg-[rgb(var(--state-danger-bg))] px-3 py-2"
              role="alert"
            >
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-[rgb(var(--state-danger-fg))]" />
              <span className="text-xs font-medium text-[rgb(var(--state-danger-fg))]">
                At-risk &middot; {attendanceRate!.toFixed(0)}% attendance (30-day)
              </span>
            </div>
          )}

          {/* ── Three glance tiles ── */}
          <div className="grid grid-cols-3 gap-2">
            <Tile
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#378ADD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>}
              value={student.currentGradeLevel || '—'}
              label="Grade"
              accent="#378ADD"
            />
            <Tile
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7F77DD" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}
              value="—"
              label="GPA"
              accent="#7F77DD"
              muted
            />
            <div className="relative overflow-hidden flex flex-col items-center justify-center gap-0.5 py-2 bg-[rgb(var(--background-tertiary)/0.5)] border border-[rgb(var(--border-primary)/0.35)] rounded-[9px]">
              {attendanceRate != null ? (
                <AttendanceDonutRing rate={attendanceRate} size={36} strokeWidth={3} showLabel />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-[rgb(var(--text-disabled))]" />
              )}
              <div className="text-xs font-semibold uppercase tracking-[0.5px] mt-[2px] text-[rgb(var(--text-disabled))]">
                Attendance
              </div>
              <div
                // allow-presentation-style: accent underline reflects the attendance-rate severity color
                className="absolute bottom-0 left-0 right-0 h-0.5 opacity-70"
                style={{ background: accent }}
              />
            </div>
          </div>

          {/* ── Enrollment card ── */}
          <div className="bg-[rgb(var(--background-tertiary)/0.5)] border border-[rgb(var(--border-primary)/0.35)] rounded-[10px] pt-3 px-3.5 pb-3.5">
            <div className="text-xs font-bold uppercase tracking-[0.6px] mb-[10px] pb-[6px] text-[rgb(var(--text-disabled))] border-b border-[rgb(var(--border-primary)/0.35)]">
              Enrollment
            </div>
            <div className="grid grid-cols-2 gap-x-[14px] gap-y-[10px]">
              <Field label="Grade Level" value={student.currentGradeLevel ? `Grade ${student.currentGradeLevel}` : '—'} />
              <Field label="Enrolled" value={enrollPrimary} sub={enrollSub} />
              <Field label="Academic Year" value={academicYearName || '—'} />
            </div>
          </div>

          {/* ── Privacy note ── */}
          <div className="flex gap-2 px-3 py-2 bg-[rgb(var(--accent-academics)/0.04)] border border-[rgb(var(--accent-academics)/0.1)] rounded-[7px]">
            <Lock className="flex-shrink-0 mt-[1px] text-[rgb(var(--state-info-fg))]" style={{ width: 11, height: 11 }} />
            <span className="text-xs leading-snug text-[rgb(var(--text-tertiary))]">
              Demographics, contact info, and guardian details are on the full profile page.
            </span>
          </div>

          {/* ── CTA (flows with content — no excess whitespace) ── */}
          <button
            type="button"
            onClick={handleViewProfile}
            className={`flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[rgb(var(--action-primary-bg))] text-xs font-medium text-[rgb(var(--action-primary-fg))] transition-all hover:bg-[rgb(var(--action-primary-bg-hover))] active:scale-[0.98] ${focusRing}`}
            aria-label={`View full profile for ${student.fullName}`}
          >
            View Full Profile
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </QuickDrawer.Body>
    </QuickDrawer>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function Tile({
  icon,
  value,
  label,
  accent,
  muted,
}: {
  icon: React.ReactNode
  value: string
  label: string
  accent: string
  muted?: boolean
}) {
  return (
    <div className="relative overflow-hidden flex flex-col items-center gap-1 py-2.5 bg-[rgb(var(--background-tertiary)/0.5)] border border-[rgb(var(--border-primary)/0.35)] rounded-[9px]">
      {icon}
      <div className={`text-lg font-semibold leading-none tracking-[-0.4px] ${muted ? 'text-[rgb(var(--text-tertiary))]' : 'text-[rgb(var(--text-primary))]'}`}>
        {value}
      </div>
      <div className="text-xs font-semibold uppercase tracking-[0.5px] text-[rgb(var(--text-disabled))]">
        {label}
      </div>
      <div
        // allow-presentation-style: per-tile accent underline color (prop)
        className={`absolute bottom-0 left-0 right-0 h-0.5 ${muted ? 'opacity-30' : 'opacity-60'}`}
        style={{ background: accent }}
      />
    </div>
  )
}

function Field({ label, value, sub }: { label: string; value: string; sub?: string | null }) {
  const empty = !value || value === '—'
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-xs font-semibold uppercase tracking-[0.5px] text-[rgb(var(--text-disabled))]">
        {label}
      </div>
      <div className={`text-xs font-medium leading-tight ${empty ? 'text-[rgb(var(--text-tertiary))]' : 'text-[rgb(var(--text-secondary))]'}`}>
        {value}
      </div>
      {sub && (
        <div className="text-xs text-[rgb(var(--text-tertiary))]">{sub}</div>
      )}
    </div>
  )
}
