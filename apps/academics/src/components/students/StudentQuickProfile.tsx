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
import { QuickDrawer, AttendanceDonutRing } from '@edforge/ui'
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

const STATUS_STYLES: Record<string, { bg: string; fg: string }> = {
  active:     { bg: 'rgba(29,158,117,0.10)',  fg: '#1D9E75' },
  pending:    { bg: 'rgba(239,159,39,0.10)',   fg: '#EF9F27' },
  inactive:   { bg: 'rgba(154,160,184,0.10)',  fg: '#9aa0b8' },
  withdrawn:  { bg: 'rgba(226,75,74,0.08)',    fg: '#E24B4A' },
  suspended:  { bg: 'rgba(226,75,74,0.08)',    fg: '#E24B4A' },
  graduated:  { bg: 'rgba(55,138,221,0.10)',   fg: '#378ADD' },
  transferred:{ bg: 'rgba(239,159,39,0.10)',   fg: '#EF9F27' },
}
const DEFAULT_STATUS = { bg: 'rgba(154,160,184,0.10)', fg: '#9aa0b8' }

function attColor(r: number | undefined) {
  if (r == null) return 'var(--v2-text-ghost)'
  if (r < 80) return '#E24B4A'
  if (r < 90) return '#EF9F27'
  return '#1D9E75'
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
              className="text-[15px] font-semibold truncate"
              style={{ color: 'var(--v2-text-primary)', letterSpacing: '-0.2px', lineHeight: 1.25 }}
            >
              {student.fullName}
            </h2>
            <div className="flex items-center gap-2 mt-[3px]">
              {student.studentNumber && (
                <span className="font-mono text-[10px]" style={{ color: 'var(--v2-text-hint)' }}>
                  #{student.studentNumber}
                </span>
              )}
              <span
                className="inline-flex items-center gap-[4px] text-[9px] font-medium px-[7px] py-[1px]"
                style={{ borderRadius: 6, background: ss.bg, color: ss.fg }}
              >
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: ss.fg }} />
                {statusText}
              </span>
            </div>
          </div>

          {/* close */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center flex-shrink-0 transition-colors hover:opacity-80"
            style={{
              width: 26, height: 26, borderRadius: 6,
              background: 'var(--v2-surface-interactive)',
              border: '1px solid var(--v2-border-default)',
            }}
            aria-label="Close"
          >
            <X className="w-[13px] h-[13px]" style={{ color: 'var(--v2-text-hint)' }} />
          </button>
        </div>
      </QuickDrawer.Header>

      {/* ─── BODY ────────────────────────────────────────────────── */}
      <QuickDrawer.Body>
        <div className="px-4 pt-4 pb-5 space-y-[14px]">

          {/* ── At-risk banner ── */}
          {isAtRisk && (
            <div
              className="flex items-center gap-2 px-3 py-[7px]"
              style={{ background: 'rgba(226,75,74,0.06)', border: '1px solid rgba(226,75,74,0.14)', borderRadius: 8 }}
              role="alert"
            >
              <AlertTriangle className="w-[13px] h-[13px] flex-shrink-0" style={{ color: '#E24B4A' }} />
              <span className="text-[11px] font-medium" style={{ color: '#E24B4A' }}>
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
            <div
              className="relative overflow-hidden flex flex-col items-center justify-center gap-[2px] py-[8px]"
              style={{ background: 'var(--v2-surface-inset)', border: '1px solid var(--v2-border-default)', borderRadius: 9 }}
            >
              {attendanceRate != null ? (
                <AttendanceDonutRing rate={attendanceRate} size={36} strokeWidth={3} showLabel />
              ) : (
                <div className="w-[22px] h-[22px] rounded-full" style={{ border: '2px solid var(--v2-text-ghost)' }} />
              )}
              <div className="text-[8px] font-semibold uppercase tracking-[0.5px] mt-[2px]" style={{ color: 'var(--v2-text-ghost)' }}>
                Attendance
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: accent, opacity: 0.7 }} />
            </div>
          </div>

          {/* ── Enrollment card ── */}
          <div
            style={{
              background: 'var(--v2-surface-inset)',
              border: '1px solid var(--v2-border-default)',
              borderRadius: 10,
              padding: '12px 14px 14px',
            }}
          >
            <div
              className="text-[9px] font-bold uppercase tracking-[0.6px] mb-[10px] pb-[6px]"
              style={{ color: 'var(--v2-text-ghost)', borderBottom: '1px solid var(--v2-border-default)' }}
            >
              Enrollment
            </div>
            <div className="grid grid-cols-2 gap-x-[14px] gap-y-[10px]">
              <Field label="Grade Level" value={student.currentGradeLevel ? `Grade ${student.currentGradeLevel}` : '—'} />
              <Field label="Homeroom" value="—" />
              <Field label="Enrolled" value={enrollPrimary} sub={enrollSub} />
              <Field label="Academic Year" value={academicYearName || '—'} />
            </div>
          </div>

          {/* ── Privacy note ── */}
          <div
            className="flex gap-2 px-3 py-[8px]"
            style={{ background: 'rgba(55,138,221,0.04)', border: '1px solid rgba(55,138,221,0.10)', borderRadius: 7 }}
          >
            <Lock className="flex-shrink-0 mt-[1px]" style={{ width: 11, height: 11, color: 'var(--v2-info, #378ADD)' }} />
            <span className="text-[10px] leading-snug" style={{ color: 'var(--v2-text-muted)' }}>
              Demographics, contact info, and guardian details are on the full profile page.
            </span>
          </div>

          {/* ── CTA (flows with content — no excess whitespace) ── */}
          <button
            type="button"
            onClick={handleViewProfile}
            className="flex items-center justify-center gap-[6px] w-full transition-all hover:brightness-110 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[var(--v2-brand-primary)]/40"
            style={{
              height: 38,
              background: 'var(--v2-brand-primary)',
              borderRadius: 8,
              border: 'none',
              color: '#fff',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
            aria-label={`View full profile for ${student.fullName}`}
          >
            View Full Profile
            <ArrowRight className="w-[13px] h-[13px]" />
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
    <div
      className="relative overflow-hidden flex flex-col items-center gap-[4px] py-[10px]"
      style={{ background: 'var(--v2-surface-inset)', border: '1px solid var(--v2-border-default)', borderRadius: 9 }}
    >
      {icon}
      <div
        className="text-[17px] font-semibold leading-none"
        style={{ color: muted ? 'var(--v2-text-hint)' : 'var(--v2-text-primary)', letterSpacing: '-0.4px' }}
      >
        {value}
      </div>
      <div className="text-[8px] font-semibold uppercase tracking-[0.5px]" style={{ color: 'var(--v2-text-ghost)' }}>
        {label}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: accent, opacity: muted ? 0.3 : 0.6 }} />
    </div>
  )
}

function Field({ label, value, sub }: { label: string; value: string; sub?: string | null }) {
  const empty = !value || value === '—'
  return (
    <div className="flex flex-col gap-[2px]">
      <div className="text-[9px] font-semibold uppercase tracking-[0.5px]" style={{ color: 'var(--v2-text-ghost)' }}>
        {label}
      </div>
      <div
        className="text-[12px] font-medium leading-tight"
        style={{ color: empty ? 'var(--v2-text-hint)' : 'var(--v2-text-secondary)' }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[10px]" style={{ color: 'var(--v2-text-hint)' }}>{sub}</div>
      )}
    </div>
  )
}
