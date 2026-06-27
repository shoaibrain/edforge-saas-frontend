/**
 * attendanceStatus — single source of truth for attendance status vocabulary.
 *
 * Sprint F0.T2 (attendance realignment). Before this module, the status set,
 * labels, keyboard shortcuts, and token colors were duplicated across
 * AttendanceRow, StatusBadge, and DailySummary — and drifted (StatusBadge had
 * no entry for some values; the grid hard-coded its own button list). Everything
 * status-related now derives from ATTENDANCE_STATUS_META + TONE_CLASSES here.
 *
 * Vocabulary note — "Tardy" vs `late`:
 *   The frontend AttendanceStatus union (academics.service.ts) carries `late`,
 *   not `tardy` (the backend enum has both; the FE only ever writes `late`). The
 *   attendance Stories call this status "Tardy", so we DISPLAY `late` as "Tardy"
 *   and bind it to the "T" shortcut, while the stored/sent value stays `late`.
 *   `late` counts as attending for the rate (matches the counting policy's
 *   attendingCategories), so the present/absent/excused bucket below is for the
 *   operator-facing save summary, not the ADA numerator.
 */

import type { AttendanceStatus } from '../../services/academics.service'

/** Coarse bucket for the save-confirmation summary ("68 present, 2 absent, 1 excused"). */
export type AttendanceBucket = 'present' | 'absent' | 'excused'

type Tone = 'success' | 'danger' | 'warning' | 'info'

export interface AttendanceStatusMeta {
  /** Operator-facing label. */
  label: string
  /** Single/short glyph for compact badges + entry buttons. */
  shortLabel: string
  /** Keyboard shortcut (uppercase) for the entry grid; omitted = no shortcut. */
  shortcut?: string
  /** Coarse bucket for the save summary. */
  bucket: AttendanceBucket
  /** Semantic tone → token color set. */
  tone: Tone
}

/**
 * Tone → token classes. One place to keep success/danger/warning/info mapped to
 * the design-system CSS vars. `badgeBg`/`fg`/`dot` drive StatusBadge + summary
 * dots; `btnHover`/`btnActive` drive the entry-grid toggle buttons.
 */
export const TONE_CLASSES: Record<
  Tone,
  { badgeBg: string; fg: string; dot: string; btnHover: string; btnActive: string }
> = {
  success: {
    badgeBg: 'bg-[rgb(var(--state-success-bg)/0.18)]',
    fg: 'text-[rgb(var(--state-success-fg))]',
    dot: 'bg-[rgb(var(--state-success-fg))]',
    btnHover: 'hover:bg-[rgb(var(--state-success-bg)/0.18)] hover:text-[rgb(var(--state-success-fg))]',
    btnActive: 'bg-[rgb(var(--state-success-fg))] text-[rgb(var(--action-primary-fg))]',
  },
  danger: {
    badgeBg: 'bg-[rgb(var(--state-danger-bg)/0.18)]',
    fg: 'text-[rgb(var(--state-danger-fg))]',
    dot: 'bg-[rgb(var(--state-danger-fg))]',
    btnHover: 'hover:bg-[rgb(var(--state-danger-bg)/0.18)] hover:text-[rgb(var(--state-danger-fg))]',
    btnActive: 'bg-[rgb(var(--state-danger-fg))] text-[rgb(var(--action-primary-fg))]',
  },
  warning: {
    badgeBg: 'bg-[rgb(var(--state-warning-bg)/0.18)]',
    fg: 'text-[rgb(var(--state-warning-fg))]',
    dot: 'bg-[rgb(var(--state-warning-fg))]',
    btnHover: 'hover:bg-[rgb(var(--state-warning-bg)/0.18)] hover:text-[rgb(var(--state-warning-fg))]',
    btnActive: 'bg-[rgb(var(--state-warning-fg))] text-[rgb(var(--action-primary-fg))]',
  },
  info: {
    badgeBg: 'bg-[rgb(var(--state-info-bg)/0.18)]',
    fg: 'text-[rgb(var(--state-info-fg))]',
    dot: 'bg-[rgb(var(--state-info-fg))]',
    btnHover: 'hover:bg-[rgb(var(--state-info-bg)/0.18)] hover:text-[rgb(var(--state-info-fg))]',
    btnActive: 'bg-[rgb(var(--state-info-fg))] text-[rgb(var(--action-primary-fg))]',
  },
}

export const ATTENDANCE_STATUS_META: Record<AttendanceStatus, AttendanceStatusMeta> = {
  present: { label: 'Present', shortLabel: 'P', shortcut: 'P', bucket: 'present', tone: 'success' },
  absent: { label: 'Absent', shortLabel: 'A', shortcut: 'A', bucket: 'absent', tone: 'danger' },
  // Stored value `late`, displayed "Tardy" per the attendance Stories. Attending.
  late: { label: 'Tardy', shortLabel: 'T', shortcut: 'T', bucket: 'present', tone: 'warning' },
  excused: { label: 'Excused', shortLabel: 'E', shortcut: 'E', bucket: 'excused', tone: 'info' },
  remote: { label: 'Remote', shortLabel: 'R', shortcut: 'R', bucket: 'present', tone: 'info' },
  half_day: { label: 'Half Day', shortLabel: 'H', bucket: 'present', tone: 'info' },
  early_departure: { label: 'Early Dep.', shortLabel: 'ED', bucket: 'present', tone: 'warning' },
}

/**
 * The statuses offered as toggle buttons in the entry grid, in display order.
 * Half-day / early-departure are valid values that still render in badges, but
 * are not first-class entry buttons (kept out of the fast roll-call path).
 */
export const ENTRY_STATUSES: AttendanceStatus[] = ['present', 'absent', 'late', 'excused', 'remote']

/**
 * Story 2 lock granularity (F2.T4): when a student's day-presence is already
 * locked by an earlier section (daily_presence), this section may still mark them
 * Tardy (late arrival) or Excused (approved absence) — but NOT flip their
 * Present↔Absent presence. These are the statuses a locked row still allows.
 * The backend does not enforce locks (advisory), so this is a frontend rule.
 */
export const LOCKED_OVERRIDE_STATUSES: AttendanceStatus[] = ['late', 'excused']

export function isLockedOverrideStatus(status: AttendanceStatus | null | undefined): boolean {
  return !!status && LOCKED_OVERRIDE_STATUSES.includes(status)
}

export function getStatusMeta(status: AttendanceStatus): AttendanceStatusMeta | undefined {
  return ATTENDANCE_STATUS_META[status]
}

export function statusLabel(status: AttendanceStatus): string {
  return ATTENDANCE_STATUS_META[status]?.label ?? status
}

/** Resolve an uppercase keyboard key to an entry status (single source for shortcuts). */
export function statusForShortcut(key: string): AttendanceStatus | undefined {
  const upper = key.toUpperCase()
  return ENTRY_STATUSES.find((s) => ATTENDANCE_STATUS_META[s].shortcut === upper)
}

/**
 * Bucket a set of marked statuses into present/absent/excused counts for the
 * save-confirmation toast. `null` entries (unmarked) are ignored.
 */
export function summarizeByBucket(
  statuses: Array<AttendanceStatus | null | undefined>,
): { present: number; absent: number; excused: number; total: number } {
  let present = 0
  let absent = 0
  let excused = 0
  for (const s of statuses) {
    if (!s) continue
    const bucket = ATTENDANCE_STATUS_META[s]?.bucket
    if (bucket === 'present') present++
    else if (bucket === 'absent') absent++
    else if (bucket === 'excused') excused++
  }
  return { present, absent, excused, total: present + absent + excused }
}
