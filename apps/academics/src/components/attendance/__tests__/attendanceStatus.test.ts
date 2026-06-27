/**
 * attendanceStatus single-source tests (F0.T2). Pins the vocabulary decisions
 * the rest of the attendance UI depends on: the entry set, the "late → Tardy"
 * label mapping, the keyboard-shortcut resolution, and the save-summary buckets.
 */

import { describe, it, expect } from 'vitest'
import {
  ATTENDANCE_STATUS_META,
  ENTRY_STATUSES,
  TONE_CLASSES,
  statusLabel,
  statusForShortcut,
  summarizeByBucket,
} from '../attendanceStatus'

describe('attendanceStatus — entry set + labels', () => {
  it('exposes exactly Present/Absent/Tardy/Excused/Remote as entry buttons', () => {
    expect(ENTRY_STATUSES).toEqual(['present', 'absent', 'late', 'excused', 'remote'])
  })

  it('displays the stored `late` value as "Tardy" (Story vocabulary)', () => {
    expect(statusLabel('late')).toBe('Tardy')
    expect(ATTENDANCE_STATUS_META.late.shortLabel).toBe('T')
  })

  it('keeps canonical labels for the other statuses', () => {
    expect(statusLabel('present')).toBe('Present')
    expect(statusLabel('absent')).toBe('Absent')
    expect(statusLabel('excused')).toBe('Excused')
    expect(statusLabel('remote')).toBe('Remote')
  })

  it('has meta for every value in the frontend AttendanceStatus union', () => {
    // half_day / early_departure are not entry buttons but must still render.
    expect(ATTENDANCE_STATUS_META.half_day).toBeTruthy()
    expect(ATTENDANCE_STATUS_META.early_departure).toBeTruthy()
  })
})

describe('statusForShortcut', () => {
  it('resolves entry shortcuts case-insensitively', () => {
    expect(statusForShortcut('p')).toBe('present')
    expect(statusForShortcut('A')).toBe('absent')
    expect(statusForShortcut('t')).toBe('late') // Tardy
    expect(statusForShortcut('E')).toBe('excused')
    expect(statusForShortcut('r')).toBe('remote')
  })

  it('returns undefined for unmapped keys', () => {
    expect(statusForShortcut('Z')).toBeUndefined()
    expect(statusForShortcut('L')).toBeUndefined() // old "Late" shortcut retired in favor of T
  })
})

describe('summarizeByBucket', () => {
  it('buckets attending statuses into present, absent into absent, excused into excused', () => {
    const result = summarizeByBucket([
      'present', 'present', 'late', 'remote', // 4 attending → present bucket
      'absent', 'absent', // 2 absent
      'excused', // 1 excused
      null, undefined, // ignored
    ])
    expect(result).toEqual({ present: 4, absent: 2, excused: 1, total: 7 })
  })

  it('ignores unmarked entries', () => {
    expect(summarizeByBucket([null, undefined, undefined])).toEqual({
      present: 0,
      absent: 0,
      excused: 0,
      total: 0,
    })
  })
})

describe('TONE_CLASSES — Tardy/warning amber consistency', () => {
  it('drives the warning dot/swatch from the theme-stable amber `--state-warning-border`', () => {
    // `--state-warning-fg` is a muddy brown in light mode (tuned for text legibility);
    // the dot must use the amber border token so Tardy reads amber in both themes.
    expect(TONE_CLASSES.warning.dot).toContain('--state-warning-border')
    expect(TONE_CLASSES.warning.dot).not.toContain('--state-warning-fg')
  })

  it('keeps warning TEXT (`fg`) on `--state-warning-fg` for contrast', () => {
    expect(TONE_CLASSES.warning.fg).toContain('--state-warning-fg')
  })

  it('resolves the Tardy status (`late`) to the warning tone', () => {
    expect(ATTENDANCE_STATUS_META.late.tone).toBe('warning')
  })
})
