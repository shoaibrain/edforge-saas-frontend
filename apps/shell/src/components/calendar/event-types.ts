/**
 * Calendar Event Types — Single Source of Truth
 *
 * Sprint S2.8 — closes V1 finding that the same taxonomy was duplicated
 * across 4+ modules in the shell app, with subtle inconsistencies between
 * them (S1.4 cutover patch had to update 6 places to add the 3 new event
 * types from S1).
 *
 * This module is THE place to add, remove, or modify calendar event types.
 * Every consumer derives from this — color maps, dropdowns, labels,
 * instructional-flag auto-set logic, day-type legend chips, etc.
 *
 * Consumers
 * =========
 *   apps/shell/src/components/calendar/fullcalendar-utils.ts
 *   apps/shell/src/styles/fullcalendar-theme.css        (per-type CSS rules — manual sync)
 *   apps/shell/src/pages/settings/school-calendar.tsx
 *   apps/shell/src/pages/settings/tabs/AcademicSetupTab.tsx
 *
 * CSS note: the per-type CSS rules in fullcalendar-theme.css still need
 * manual addition when a new event type ships (browsers can't ingest TS
 * constants). The rule-name convention is `.fc-evt-<type>` + `.fc-bg-<type>`
 * with light + dark variants — see the comment at the top of that file.
 *
 * Stay lockstep with shared-types calendarEventDescriptorSchema.
 */

// Local literal union — must mirror shared-types CalendarEventDescriptor.
// Kept local instead of imported from shared-types to avoid pulling the
// whole Zod surface into the frontend bundle for what is effectively a
// presentation-layer concern.
export type CalendarEventType =
  | 'instructional_day'
  | 'non_instructional_day'
  | 'holiday'
  | 'teacher_only'
  | 'student_holiday'
  | 'weather_day'
  | 'exam_window'
  | 'school_program'
  | 'monthly_test'
  | 'early_release'
  | 'late_start'
  | 'conference_day'
  | 'graduation'
  | 'break'
  | 'in_service'
  | 'make_up_day'
  | 'other'

export interface EventTypeMeta {
  /** Operator-facing display label. */
  label: string
  /**
   * Foreground color for chips, dots, and text. Used in:
   *   - LEGEND chips (foreground text + dot)
   *   - Wizard "Day types:" inline pills
   *   - DateEditPanel preview swatch
   */
  fg: string
  /**
   * 8% alpha background for chips and pills (low-contrast).
   * Matches the inline rgba pattern used by AcademicSetupTab wizard chips.
   */
  bgChip: string
  /**
   * 20% alpha border for chips and pills.
   */
  borderChip: string
  /**
   * 12% alpha background for the inline month-grid CELL coloring (higher
   * intensity than chip-bg). Used by EVENT_TYPE_COLORS consumers.
   */
  bgGrid: string
  /**
   * 6% alpha background for FullCalendar BACKGROUND events (lowest
   * intensity, visible only when the cell has no foreground event).
   */
  bgBackground: string
  /**
   * True when this event implies "the school is open and class is in
   * session" — used to auto-set the isInstructionalDay flag when the
   * operator picks this type from the date-edit dropdown.
   */
  instructional: boolean
  /**
   * True when the operator can pick this type from a "manually mark this
   * date as…" dropdown. False = server-managed (e.g. exam_window is
   * auto-synced from GradingPeriod.examStartDate/examEndDate; if the
   * operator manually picks it, the auto-sync won't clean it up later).
   */
  operatorSelectable: boolean
}

// Tailwind-incompatible inline color values — these are the canonical
// reference for the entire app's calendar palette. Keep in sync with
// fullcalendar-theme.css. Adding a new event type means: (a) add it here,
// (b) add the matching `.fc-evt-*` + `.fc-bg-*` rules in the theme CSS,
// (c) optionally add a backend descriptor to shared-types.
export const EVENT_TYPE_META: Record<CalendarEventType, EventTypeMeta> = {
  instructional_day: {
    label: 'Instructional',
    fg: '#1D9E75',
    bgChip: 'rgba(29,158,117,0.08)',
    borderChip: 'rgba(29,158,117,0.2)',
    bgGrid: 'rgba(29,158,117,0.12)',
    bgBackground: 'rgba(29,158,117,0.06)',
    instructional: true,
    operatorSelectable: true,
  },
  non_instructional_day: {
    label: 'Non-Instructional',
    fg: 'rgb(var(--text-tertiary))',
    bgChip: 'rgba(255,255,255,0.05)',
    borderChip: 'rgba(255,255,255,0.06)',
    bgGrid: 'rgba(255,255,255,0.04)',
    bgBackground: 'rgba(100,116,139,0.04)',
    instructional: false,
    operatorSelectable: true,
  },
  holiday: {
    label: 'Holiday',
    fg: '#E24B4A',
    bgChip: 'rgba(226,75,74,0.08)',
    borderChip: 'rgba(226,75,74,0.2)',
    bgGrid: 'rgba(226,75,74,0.12)',
    bgBackground: 'rgba(239,68,68,0.06)',
    instructional: false,
    operatorSelectable: true,
  },
  teacher_only: {
    label: 'Teacher Only',
    fg: '#EF9F27',
    bgChip: 'rgba(239,159,39,0.08)',
    borderChip: 'rgba(239,159,39,0.2)',
    bgGrid: 'rgba(239,159,39,0.12)',
    bgBackground: 'rgba(245,158,11,0.06)',
    instructional: false,
    operatorSelectable: true,
  },
  student_holiday: {
    label: 'Student Holiday',
    fg: '#EF9F27',
    bgChip: 'rgba(239,159,39,0.08)',
    borderChip: 'rgba(239,159,39,0.2)',
    bgGrid: 'rgba(239,159,39,0.08)',
    bgBackground: 'rgba(249,115,22,0.06)',
    instructional: false,
    operatorSelectable: true,
  },
  weather_day: {
    label: 'Weather Day',
    fg: 'rgb(var(--text-tertiary))',
    bgChip: 'rgba(255,255,255,0.06)',
    borderChip: 'rgba(255,255,255,0.08)',
    bgGrid: 'rgba(255,255,255,0.06)',
    bgBackground: 'rgba(59,130,246,0.06)',
    instructional: false,
    operatorSelectable: true,
  },
  // Sprint S2.5 — exam_window is server-managed (auto-synced from
  // GradingPeriod.examStartDate/examEndDate). Operators should NOT pick it
  // manually because manual rows lack the sourceTermId provenance the
  // auto-sync uses to clean up its own writes.
  exam_window: {
    label: 'Exam Window',
    fg: '#F97316',
    bgChip: 'rgba(249,115,22,0.08)',
    borderChip: 'rgba(249,115,22,0.2)',
    bgGrid: 'rgba(249,115,22,0.12)',
    bgBackground: 'rgba(249,115,22,0.06)',
    instructional: true,  // exams ARE school days
    operatorSelectable: false,
  },
  school_program: {
    label: 'School Program',
    fg: '#10B981',
    bgChip: 'rgba(16,185,129,0.08)',
    borderChip: 'rgba(16,185,129,0.2)',
    bgGrid: 'rgba(16,185,129,0.12)',
    bgBackground: 'rgba(16,185,129,0.06)',
    instructional: false,
    operatorSelectable: true,
  },
  monthly_test: {
    label: 'Monthly Test',
    fg: '#EAB308',
    bgChip: 'rgba(234,179,8,0.08)',
    borderChip: 'rgba(234,179,8,0.2)',
    bgGrid: 'rgba(234,179,8,0.12)',
    bgBackground: 'rgba(234,179,8,0.06)',
    instructional: true,  // tests ARE school days
    operatorSelectable: true,
  },
  early_release: {
    label: 'Early Release',
    fg: '#378ADD',
    bgChip: 'rgba(55,138,221,0.08)',
    borderChip: 'rgba(55,138,221,0.2)',
    bgGrid: 'rgba(55,138,221,0.1)',
    bgBackground: 'rgba(14,165,233,0.06)',
    instructional: false,
    operatorSelectable: true,
  },
  late_start: {
    label: 'Late Start',
    fg: '#378ADD',
    bgChip: 'rgba(55,138,221,0.08)',
    borderChip: 'rgba(55,138,221,0.2)',
    bgGrid: 'rgba(55,138,221,0.08)',
    bgBackground: 'rgba(99,102,241,0.06)',
    instructional: false,
    operatorSelectable: true,
  },
  conference_day: {
    label: 'Conference',
    fg: '#7F77DD',
    bgChip: 'rgba(127,119,221,0.08)',
    borderChip: 'rgba(127,119,221,0.2)',
    bgGrid: 'rgba(127,119,221,0.08)',
    bgBackground: 'rgba(236,72,153,0.06)',
    instructional: false,
    operatorSelectable: true,
  },
  graduation: {
    label: 'Graduation',
    fg: '#EF9F27',
    bgChip: 'rgba(239,159,39,0.08)',
    borderChip: 'rgba(239,159,39,0.2)',
    bgGrid: 'rgba(239,159,39,0.1)',
    bgBackground: 'rgba(139,92,246,0.06)',
    instructional: false,
    operatorSelectable: true,
  },
  break: {
    label: 'Break',
    fg: '#7F77DD',
    bgChip: 'rgba(127,119,221,0.08)',
    borderChip: 'rgba(127,119,221,0.2)',
    bgGrid: 'rgba(127,119,221,0.1)',
    bgBackground: 'rgba(168,85,247,0.06)',
    instructional: false,
    operatorSelectable: true,
  },
  in_service: {
    label: 'In-Service',
    fg: '#EF9F27',
    bgChip: 'rgba(255,255,255,0.05)',
    borderChip: 'rgba(255,255,255,0.06)',
    bgGrid: 'rgba(239,159,39,0.08)',
    bgBackground: 'rgba(132,204,22,0.06)',
    instructional: false,
    operatorSelectable: true,
  },
  make_up_day: {
    label: 'Make-up Day',
    fg: '#1D9E75',
    bgChip: 'rgba(29,158,117,0.08)',
    borderChip: 'rgba(29,158,117,0.2)',
    bgGrid: 'rgba(29,158,117,0.08)',
    bgBackground: 'rgba(20,184,166,0.06)',
    instructional: true,
    operatorSelectable: true,
  },
  other: {
    label: 'Other',
    fg: 'rgb(var(--text-tertiary))',
    bgChip: 'rgba(255,255,255,0.05)',
    borderChip: 'rgba(255,255,255,0.06)',
    bgGrid: 'rgba(255,255,255,0.04)',
    bgBackground: 'rgba(255,255,255,0.04)',
    instructional: false,
    operatorSelectable: true,
  },
}

// =========================================================================
// Derived constants — every other consumer reads from these, never from
// the raw EVENT_TYPE_META. Keeps the contract one-directional.
// =========================================================================

/** All event types as a readonly tuple, in declaration order. */
export const ALL_EVENT_TYPES = Object.keys(EVENT_TYPE_META) as CalendarEventType[]

/**
 * Types an operator can pick from a "manually mark this date as…" dropdown.
 * Excludes server-managed types (e.g. exam_window) per S2.5.
 */
export const OPERATOR_SELECTABLE_TYPES: CalendarEventType[] = ALL_EVENT_TYPES.filter(
  t => EVENT_TYPE_META[t].operatorSelectable,
)

/**
 * Types that count as instructional (a school day) when the operator picks
 * them in the date-edit panel. Drives the auto-set of `isInstructionalDay`.
 */
export const INSTRUCTIONAL_TYPES: CalendarEventType[] = ALL_EVENT_TYPES.filter(
  t => EVENT_TYPE_META[t].instructional,
)

/** Legend items shape for FullCalendar's legend renderer. */
export const LEGEND_ITEMS: { type: CalendarEventType; label: string }[] = ALL_EVENT_TYPES.map(
  type => ({ type, label: EVENT_TYPE_META[type].label }),
)

/** type → label map, useful for dropdowns and labels in other components. */
export const EVENT_TYPE_LABELS: Record<CalendarEventType, string> = Object.fromEntries(
  ALL_EVENT_TYPES.map(t => [t, EVENT_TYPE_META[t].label]),
) as Record<CalendarEventType, string>

/**
 * Per-type color tuple — the shape consumed by the inline month-grid
 * cell renderer in AcademicSetupTab.tsx. Matches the prior
 * `EVENT_TYPE_COLORS` constant exactly so the refactor is a drop-in.
 */
export const EVENT_TYPE_COLORS: Record<CalendarEventType, { bg: string; dot: string; label: string }> = Object.fromEntries(
  ALL_EVENT_TYPES.map(t => [
    t,
    {
      bg: EVENT_TYPE_META[t].bgGrid,
      dot: EVENT_TYPE_META[t].fg,
      label: EVENT_TYPE_META[t].label,
    },
  ]),
) as Record<CalendarEventType, { bg: string; dot: string; label: string }>

/**
 * Day-type legend chips shape — used by the wizard's "Day types:" legend.
 * Filters out server-managed types so operators don't see types they
 * can't pick anyway.
 */
export const DAY_TYPE_LEGEND_CHIPS: { label: string; color: string; text: string; border: string }[] =
  OPERATOR_SELECTABLE_TYPES.map(t => ({
    label: EVENT_TYPE_META[t].label,
    color: EVENT_TYPE_META[t].bgChip,
    text: EVENT_TYPE_META[t].fg,
    border: EVENT_TYPE_META[t].borderChip,
  }))
