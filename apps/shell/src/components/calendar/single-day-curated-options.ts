/**
 * Curated single-day event options — operator-facing labels.
 *
 * Why this exists
 * ===============
 * `event-types.ts` defines the raw `CalendarEventDescriptor` enum (17
 * values) that the backend stores. Operators are non-engineers; showing
 * them raw enum jargon like `teacher_only` / `early_release` /
 * `student_holiday` invites confusion — they don't know what
 * "early release" means without context (early release of WHOM?).
 *
 * Audit Q2 (docs/pilot-greenlight/c4-fe-vocabulary-audit.md §2.2) resolved
 * this by adding a presentation-layer mapping: the UI exposes a *curated*
 * set of labelled options that combine `eventType` + optional `audience`
 * + optional `category` into a single dropdown choice. Each curated
 * option encodes/decodes losslessly to a `CalendarEventDto` triple.
 *
 * The operator picks "Early Release — Students Only"; the backend stores
 * `(eventType: 'early_release', audience: 'students')`. No information
 * loss; no operator-facing audience picker.
 *
 * Consumers
 * =========
 *   - AcademicSetupTab.tsx → CalendarStep → DateEditPanel
 *   - school-calendar.tsx → legacy single-date drawer (audit follow-up #2)
 *
 * Bidirectional contract
 * ======================
 *   encodeCuratedOption(key, description?, rawOverride?) → CalendarEventDto
 *   decodeCalendarEvent(evt) → CuratedSingleDayKey
 * Properties tested in single-day-curated-options.test.ts:
 *   - round-trip: decode(encode(k)) === k for every curated key
 *   - unknown (eventType, audience) triples → 'other'
 *   - pre-seeded PABSON holidays decode to 'holiday' (not 'other')
 *
 * Q1 — half-day path
 * ==================
 * The Allen-ISD reference calendar shows "Half Day" as a single-day
 * event. The backend has TWO places this can land: (a) the calendar
 * event level (`eventType: 'early_release'`), or (b) the bell-schedule
 * level (`dayType: 'half_day'`). The audit chose path (a) — the
 * calendar UI declares half-days via the event-level dropdown; the
 * bell-schedule `dayType` is a separate concern (how periods are
 * shortened). This module therefore offers `early_release_*` curated
 * options, not a top-level "Half Day" entry.
 *
 * "Other" escape hatch
 * ====================
 * If a stored event doesn't match any curated triple (e.g. legacy data
 * with an unusual `category`, or a future enum value we haven't curated
 * yet), `decodeCalendarEvent` returns `'other'`. The UI then reveals
 * the raw `eventType` dropdown from `event-types.ts` so the operator
 * can still see + change the value. No silent data corruption.
 */

import type {
  CalendarEventDescriptor,
  CalendarEventAudience,
  CalendarEventCategory,
} from '@aibrains/shared-types'

// `CalendarEventDto` from shared-types is the parsed object; we use a
// narrower shape here that's friendly to the FE's form state. Both encode
// from and decode to the same fields.
export interface CalendarEventInput {
  eventType: CalendarEventDescriptor
  description?: string
  isAllDay?: boolean
  startTime?: string
  endTime?: string
  audience?: CalendarEventAudience
  category?: CalendarEventCategory
  gradeLevelScope?: string[]
}

// ============================================================================
// Curated keys — the 11 operator-facing options
// ============================================================================

export type CuratedSingleDayKey =
  | 'holiday'
  | 'staff_pd'
  | 'student_holiday'
  | 'early_release_all'
  | 'early_release_students'
  | 'early_release_staff'
  | 'make_up_day'
  | 'conference_day'
  | 'graduation'
  | 'school_program'
  | 'other'

export interface CuratedOptionMeta {
  key: CuratedSingleDayKey
  label: string
  description: string
  eventType: CalendarEventDescriptor
  audience?: CalendarEventAudience
  category?: CalendarEventCategory
  /**
   * Auto-set the date's `isInstructionalDay` flag when the operator
   * picks this option. Mirrors the same field on `EVENT_TYPE_META` but
   * specifically for curated picks (some curated options imply
   * instructional, e.g. make_up_day).
   */
  autoInstructional: boolean
}

/**
 * Canonical curated-option table. Order = display order in the dropdown.
 * Each entry is uniquely identifiable by the `(eventType, audience)` pair
 * EXCEPT for the `'other'` fallback (no fixed triple).
 */
export const CURATED_OPTIONS: CuratedOptionMeta[] = [
  {
    key: 'holiday',
    label: 'Holiday',
    description: 'School closed for everyone',
    eventType: 'holiday',
    autoInstructional: false,
  },
  {
    key: 'staff_pd',
    label: 'Staff Professional Development',
    description: 'Students off, staff in',
    eventType: 'teacher_only',
    autoInstructional: false,
  },
  {
    key: 'student_holiday',
    label: 'Student Holiday',
    description: 'Students off, staff working',
    eventType: 'student_holiday',
    autoInstructional: false,
  },
  {
    key: 'early_release_all',
    label: 'Early Release — All',
    description: 'Both staff and students leave early',
    eventType: 'early_release',
    audience: 'all',
    autoInstructional: false,
  },
  {
    key: 'early_release_students',
    label: 'Early Release — Students Only',
    description: 'Students dismiss early; staff continue working',
    eventType: 'early_release',
    audience: 'students',
    autoInstructional: false,
  },
  {
    key: 'early_release_staff',
    label: 'Early Release — Staff Only',
    description: 'Staff leave early (rare; usually a Trade Day)',
    eventType: 'early_release',
    audience: 'faculty',
    autoInstructional: false,
  },
  {
    key: 'make_up_day',
    label: 'Make-Up Day',
    description: 'Catch-up day for a missed school day (e.g. bad weather)',
    eventType: 'make_up_day',
    autoInstructional: true,
  },
  {
    key: 'conference_day',
    label: 'Parent-Teacher Conference',
    description: 'Scheduled parent meetings; class status varies',
    eventType: 'conference_day',
    autoInstructional: false,
  },
  {
    key: 'graduation',
    label: 'Graduation / Annual Function',
    description: 'Year-end milestone or annual program',
    eventType: 'graduation',
    autoInstructional: false,
  },
  {
    key: 'school_program',
    label: 'School Program',
    description: 'Cultural, religious, or community event',
    eventType: 'school_program',
    autoInstructional: false,
  },
  {
    key: 'other',
    label: 'Other (advanced)',
    description: 'Pick a specific event type from the raw list',
    // `other` is a sentinel — the actual eventType is provided at encode
    // time via the rawOverride parameter. We use `non_instructional_day`
    // here as a safe default if the operator selects "Other" but doesn't
    // pick a raw type.
    eventType: 'non_instructional_day',
    autoInstructional: false,
  },
]

const CURATED_BY_KEY: Record<CuratedSingleDayKey, CuratedOptionMeta> = Object.fromEntries(
  CURATED_OPTIONS.map((opt) => [opt.key, opt]),
) as Record<CuratedSingleDayKey, CuratedOptionMeta>

export function getCuratedMeta(key: CuratedSingleDayKey): CuratedOptionMeta {
  return CURATED_BY_KEY[key]
}

// ============================================================================
// Encode — curated key → CalendarEvent payload for the API
// ============================================================================

/**
 * Build a `CalendarEventInput` from a curated key. The result is what
 * the FE pushes to PATCH `/calendar-dates/:date`.
 *
 * @param key - The operator-selected curated option.
 * @param description - Optional operator-typed name for the event (e.g.
 *                      "Mid-Term Conference Day"). Stored as-is.
 * @param rawOverride - When `key === 'other'`, this is the raw
 *                      `CalendarEventDescriptor` the operator picked
 *                      from the escape-hatch dropdown.
 */
export function encodeCuratedOption(
  key: CuratedSingleDayKey,
  description?: string,
  rawOverride?: CalendarEventDescriptor,
): CalendarEventInput {
  const meta = getCuratedMeta(key)

  const event: CalendarEventInput = {
    eventType: key === 'other' && rawOverride ? rawOverride : meta.eventType,
    isAllDay: true,
  }

  if (description?.trim()) {
    event.description = description.trim()
  }

  // Only include `audience` when the curated option specifies one. An
  // absent field means "whole-school visibility" per the schema (line
  // 71 of calendar-date.schema.ts).
  if (meta.audience !== undefined) {
    event.audience = meta.audience
  }

  if (meta.category !== undefined) {
    event.category = meta.category
  }

  return event
}

// ============================================================================
// Decode — existing CalendarEvent → curated key
// ============================================================================

/**
 * Map an existing stored CalendarEvent back to the curated option that
 * would have produced it. Used on edit-open so the dropdown highlights
 * the right option for the stored row.
 *
 * If the stored `(eventType, audience)` triple doesn't match any
 * curated entry (e.g. legacy data, future enum value), returns
 * `'other'` so the UI reveals the raw escape hatch.
 *
 * Match priority (most-specific-first):
 *   1. Exact match on `(eventType, audience)` pair
 *   2. Exact match on `eventType` alone (when curated has no audience)
 *   3. Fallback to `'other'`
 */
export function decodeCalendarEvent(evt: CalendarEventInput | undefined): CuratedSingleDayKey {
  if (!evt) return 'other'

  // Priority 1 — exact match including audience.
  for (const opt of CURATED_OPTIONS) {
    if (opt.key === 'other') continue
    if (
      opt.eventType === evt.eventType &&
      opt.audience !== undefined &&
      opt.audience === evt.audience
    ) {
      return opt.key
    }
  }

  // Priority 2 — match eventType when curated option has NO audience
  // requirement. (Don't accidentally match `early_release_students`
  // when the stored row has no audience field — that should NOT decode
  // to `early_release_students`; it should decode to a "no audience"
  // variant if one exists, or fall through.)
  for (const opt of CURATED_OPTIONS) {
    if (opt.key === 'other') continue
    if (opt.audience === undefined && opt.eventType === evt.eventType && !evt.audience) {
      return opt.key
    }
  }

  // Priority 3 — eventType matches a curated option whose audience is
  // 'all' (since 'all' and absent are semantically equivalent per the
  // schema comment). Handles the case where the stored row says
  // `audience: 'all'` and we want to decode it to the curated
  // "Early Release — All" option.
  for (const opt of CURATED_OPTIONS) {
    if (opt.key === 'other') continue
    if (opt.audience === 'all' && opt.eventType === evt.eventType) {
      // The stored event must have audience absent OR 'all' for this to
      // be the right curated key.
      if (!evt.audience || evt.audience === 'all') return opt.key
    }
  }

  return 'other'
}

// ============================================================================
// UI-friendly accessors
// ============================================================================

/**
 * Curated options the FE renders, in declaration order. Excludes the
 * `'other'` entry; the dropdown renders it as a separate trailing
 * "Other (advanced)" item below a divider.
 */
export const CURATED_OPTIONS_FOR_DROPDOWN: CuratedOptionMeta[] = CURATED_OPTIONS.filter(
  (o) => o.key !== 'other',
)

export const CURATED_OTHER_META: CuratedOptionMeta = getCuratedMeta('other')
