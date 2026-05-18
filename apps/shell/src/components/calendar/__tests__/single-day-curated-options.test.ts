/**
 * Unit tests for the curated single-day options mapper.
 *
 * The mapper is the bidirectional bridge between operator-facing labels
 * ("Staff PD", "Early Release — Students Only") and the backend's
 * `(eventType, audience, category)` triple. Drift between encode and
 * decode here would corrupt stored data on edit-open (the dropdown would
 * show a different value than was saved → operator hits Save again →
 * different value lands in DDB).
 *
 * These tests pin the contract.
 */

import { describe, it, expect } from 'vitest'
import {
  CURATED_OPTIONS,
  encodeCuratedOption,
  decodeCalendarEvent,
  type CalendarEventInput,
  type CuratedSingleDayKey,
} from '../single-day-curated-options'

describe('single-day-curated-options', () => {
  describe('encode → decode round-trip', () => {
    // Every curated key must round-trip cleanly: encoding the key and
    // immediately decoding the resulting event must produce the same
    // key. Otherwise the dropdown's "stored value" view is wrong.
    it.each(
      CURATED_OPTIONS.filter((o) => o.key !== 'other').map((o) => [o.key]),
    )('round-trips "%s"', (key) => {
      const encoded = encodeCuratedOption(key as CuratedSingleDayKey)
      const decoded = decodeCalendarEvent(encoded)
      expect(decoded).toBe(key)
    })
  })

  describe('encode behavior', () => {
    it('encodes "holiday" as eventType=holiday with no audience', () => {
      const evt = encodeCuratedOption('holiday')
      expect(evt.eventType).toBe('holiday')
      expect(evt.audience).toBeUndefined()
      expect(evt.isAllDay).toBe(true)
    })

    it('encodes "staff_pd" as teacher_only with no audience field', () => {
      // Audience is intentionally absent — `teacher_only` already
      // implies the audience semantically (audit Q2 rationale).
      const evt = encodeCuratedOption('staff_pd')
      expect(evt.eventType).toBe('teacher_only')
      expect(evt.audience).toBeUndefined()
    })

    it('encodes "early_release_students" with audience=students', () => {
      const evt = encodeCuratedOption('early_release_students')
      expect(evt.eventType).toBe('early_release')
      expect(evt.audience).toBe('students')
    })

    it('encodes "early_release_all" with audience=all', () => {
      const evt = encodeCuratedOption('early_release_all')
      expect(evt.eventType).toBe('early_release')
      expect(evt.audience).toBe('all')
    })

    it('encodes "early_release_staff" with audience=faculty', () => {
      const evt = encodeCuratedOption('early_release_staff')
      expect(evt.eventType).toBe('early_release')
      expect(evt.audience).toBe('faculty')
    })

    it('encodes operator description as the `description` field', () => {
      const evt = encodeCuratedOption('conference_day', 'Mid-Term PT Meeting')
      expect(evt.description).toBe('Mid-Term PT Meeting')
    })

    it('trims whitespace from operator description', () => {
      const evt = encodeCuratedOption('conference_day', '   spaces around   ')
      expect(evt.description).toBe('spaces around')
    })

    it('drops empty/whitespace-only description', () => {
      expect(encodeCuratedOption('conference_day', '').description).toBeUndefined()
      expect(encodeCuratedOption('conference_day', '   ').description).toBeUndefined()
    })

    it('encodes "other" with the provided raw override', () => {
      const evt = encodeCuratedOption('other', 'Custom day', 'weather_day')
      expect(evt.eventType).toBe('weather_day')
      expect(evt.description).toBe('Custom day')
    })

    it('encodes "other" without rawOverride to safe default', () => {
      // "Other" without a rawOverride uses non_instructional_day as a
      // safe sentinel — won't accidentally mark the date as a school day.
      const evt = encodeCuratedOption('other')
      expect(evt.eventType).toBe('non_instructional_day')
    })
  })

  describe('decode behavior', () => {
    it('returns "other" for undefined input', () => {
      expect(decodeCalendarEvent(undefined)).toBe('other')
    })

    it('decodes early_release with audience=students to "early_release_students"', () => {
      const evt: CalendarEventInput = { eventType: 'early_release', audience: 'students' }
      expect(decodeCalendarEvent(evt)).toBe('early_release_students')
    })

    it('decodes early_release with audience=all to "early_release_all"', () => {
      const evt: CalendarEventInput = { eventType: 'early_release', audience: 'all' }
      expect(decodeCalendarEvent(evt)).toBe('early_release_all')
    })

    it('decodes early_release with NO audience to "early_release_all" (audience absent ≡ "all" per schema)', () => {
      const evt: CalendarEventInput = { eventType: 'early_release' }
      expect(decodeCalendarEvent(evt)).toBe('early_release_all')
    })

    it('decodes teacher_only (no audience) to "staff_pd"', () => {
      const evt: CalendarEventInput = { eventType: 'teacher_only' }
      expect(decodeCalendarEvent(evt)).toBe('staff_pd')
    })

    it('decodes student_holiday to "student_holiday"', () => {
      const evt: CalendarEventInput = { eventType: 'student_holiday' }
      expect(decodeCalendarEvent(evt)).toBe('student_holiday')
    })

    it('decodes a pre-seeded PABSON holiday with category=religious to "holiday" (NOT "other")', () => {
      // The PABSON archetype seed (pabson-npl-2083.json) writes
      // 13 single-day holidays with eventType=holiday and various
      // categories. Operator-edit must decode them all to the
      // curated "Holiday" option so the dropdown shows the right
      // selection on edit-open. (Audit Q1 + §6 of vocabulary audit.)
      const seeded: CalendarEventInput = {
        eventType: 'holiday',
        category: 'religious',
        description: 'Buddha Jayanti',
      }
      expect(decodeCalendarEvent(seeded)).toBe('holiday')
    })

    it('decodes a PABSON school program to "school_program"', () => {
      const seeded: CalendarEventInput = {
        eventType: 'school_program',
        category: 'religious',
        description: 'Saraswati Puja Celebration',
      }
      expect(decodeCalendarEvent(seeded)).toBe('school_program')
    })

    it('decodes an unknown eventType to "other"', () => {
      // Cast-through-unknown to simulate a future enum value the
      // current build doesn't know about.
      const evt = { eventType: 'unknown_future_type' } as unknown as CalendarEventInput
      expect(decodeCalendarEvent(evt)).toBe('other')
    })

    it('decodes a known eventType with an unrecognized audience to "other"', () => {
      const evt = {
        eventType: 'early_release' as const,
        audience: 'parents' as const, // not one of the curated audiences for early_release
      }
      // 'parents' isn't covered by any early_release_* curated key →
      // falls through to 'other' rather than guessing.
      expect(decodeCalendarEvent(evt)).toBe('other')
    })
  })

  describe('curated table invariants', () => {
    it('every curated option except "other" has a unique (eventType, audience) pair', () => {
      const seen = new Set<string>()
      for (const opt of CURATED_OPTIONS) {
        if (opt.key === 'other') continue
        const sig = `${opt.eventType}|${opt.audience ?? '-'}`
        expect(seen.has(sig), `duplicate (eventType, audience) for ${opt.key}: ${sig}`).toBe(false)
        seen.add(sig)
      }
    })

    it('every curated key has a non-empty label and description', () => {
      for (const opt of CURATED_OPTIONS) {
        expect(opt.label.length).toBeGreaterThan(0)
        expect(opt.description.length).toBeGreaterThan(0)
      }
    })

    it('the 11-key list matches the audit-confirmed taxonomy', () => {
      // Pin the exact set so a future PR can't silently drop one.
      const expected: CuratedSingleDayKey[] = [
        'holiday',
        'staff_pd',
        'student_holiday',
        'early_release_all',
        'early_release_students',
        'early_release_staff',
        'make_up_day',
        'conference_day',
        'graduation',
        'school_program',
        'other',
      ]
      expect(CURATED_OPTIONS.map((o) => o.key)).toEqual(expected)
    })
  })
})
