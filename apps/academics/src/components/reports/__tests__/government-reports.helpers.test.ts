import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  canDownload,
  canMarkSubmitted,
  canMarkVerified,
  canRetry,
  extractBsYear,
  GENERATION_STALL_MS,
  groupSnapshotsByYear,
  isInProgress,
  isStalledGenerating,
  isValidBsYear,
  statusLabel,
  statusVariant,
  triggerBrowserDownload,
} from '../government-reports.helpers'
import type {
  ReportingSnapshot,
  ReportingSnapshotStatus,
} from '../government-reports.types'

function snap(overrides: Partial<ReportingSnapshot>): ReportingSnapshot {
  return {
    snapshotId: 's',
    schoolId: 'sch',
    templateId: 'IEMIS_NPL_CEHRD_FLASH_I',
    academicYearBs: '2083',
    status: 'generated',
    schemaVersion: 'v1',
    createdAt: '2026-06-01T00:00:00.000Z',
    createdBy: 'u',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  }
}

const ALL_STATUSES: ReportingSnapshotStatus[] = [
  'generating',
  'generated',
  'submitted',
  'verified',
  'failed',
]

describe('government-reports.helpers', () => {
  describe('canDownload', () => {
    it('allows download for generated/submitted/verified only', () => {
      expect(canDownload('generated')).toBe(true)
      expect(canDownload('submitted')).toBe(true)
      expect(canDownload('verified')).toBe(true)
      expect(canDownload('generating')).toBe(false)
      expect(canDownload('failed')).toBe(false)
    })

    it('never allows download for a dry-run snapshot (no S3 object exists)', () => {
      expect(canDownload('generated', true)).toBe(false)
    })
  })

  describe('canMarkSubmitted', () => {
    it('is true only for a non-dry-run generated snapshot', () => {
      expect(canMarkSubmitted('generated')).toBe(true)
      expect(canMarkSubmitted('generated', true)).toBe(false)
      expect(canMarkSubmitted('submitted')).toBe(false)
      expect(canMarkSubmitted('verified')).toBe(false)
      expect(canMarkSubmitted('generating')).toBe(false)
    })
  })

  describe('canMarkVerified', () => {
    it('is true only for a non-dry-run submitted snapshot', () => {
      expect(canMarkVerified('submitted')).toBe(true)
      expect(canMarkVerified('submitted', true)).toBe(false)
      expect(canMarkVerified('generated')).toBe(false)
      expect(canMarkVerified('verified')).toBe(false)
    })
  })

  describe('extractBsYear', () => {
    it('pulls the leading 4-digit BS year from an academic-year name', () => {
      expect(extractBsYear('2083')).toBe('2083')
      expect(extractBsYear('2083-2084')).toBe('2083')
      expect(extractBsYear('BS 2083/84')).toBe('2083')
    })

    it('returns null when no 4-digit year is present', () => {
      expect(extractBsYear('Current Year')).toBeNull()
      expect(extractBsYear('')).toBeNull()
    })
  })

  describe('isInProgress', () => {
    it('is true only while generating', () => {
      expect(isInProgress('generating')).toBe(true)
      for (const s of ALL_STATUSES.filter((x) => x !== 'generating')) {
        expect(isInProgress(s)).toBe(false)
      }
    })
  })

  describe('canRetry', () => {
    it('is true only for failed', () => {
      expect(canRetry('failed')).toBe(true)
      for (const s of ALL_STATUSES.filter((x) => x !== 'failed')) {
        expect(canRetry(s)).toBe(false)
      }
    })
  })

  describe('isStalledGenerating', () => {
    const start = Date.parse('2026-06-01T00:00:00.000Z')

    it('is false for a fresh generating snapshot', () => {
      expect(
        isStalledGenerating(snap({ status: 'generating' }), start + 1000),
      ).toBe(false)
    })

    it('is true once generating past the stall budget', () => {
      expect(
        isStalledGenerating(snap({ status: 'generating' }), start + GENERATION_STALL_MS + 1),
      ).toBe(true)
    })

    it('is false for non-generating statuses regardless of age', () => {
      expect(
        isStalledGenerating(snap({ status: 'generated' }), start + GENERATION_STALL_MS * 10),
      ).toBe(false)
    })
  })

  describe('groupSnapshotsByYear', () => {
    it('groups by academicYearBs, newest year first, preserving input order within a group', () => {
      const rows = [
        snap({ snapshotId: 'a', academicYearBs: '2083' }),
        snap({ snapshotId: 'b', academicYearBs: '2082' }),
        snap({ snapshotId: 'c', academicYearBs: '2083' }),
      ]
      const groups = groupSnapshotsByYear(rows)
      expect(groups.map((g) => g.year)).toEqual(['2083', '2082'])
      expect(groups[0].items.map((s) => s.snapshotId)).toEqual(['a', 'c'])
      expect(groups[1].items.map((s) => s.snapshotId)).toEqual(['b'])
    })

    it('returns [] for no snapshots', () => {
      expect(groupSnapshotsByYear([])).toEqual([])
    })
  })

  describe('statusLabel / statusVariant', () => {
    it('returns a label + a valid pill variant for every status', () => {
      for (const s of ALL_STATUSES) {
        expect(statusLabel(s)).toBeTruthy()
        expect(typeof statusVariant(s)).toBe('string')
      }
    })
  })

  describe('isValidBsYear', () => {
    it('accepts a 4-digit year, trims whitespace, rejects anything else', () => {
      expect(isValidBsYear('2083')).toBe(true)
      expect(isValidBsYear('  2083 ')).toBe(true)
      expect(isValidBsYear('208')).toBe(false)
      expect(isValidBsYear('20833')).toBe(false)
      expect(isValidBsYear('20a3')).toBe(false)
      expect(isValidBsYear('')).toBe(false)
    })
  })

  describe('triggerBrowserDownload', () => {
    afterEach(() => vi.restoreAllMocks())

    it('creates a transient anchor with the url + filename and clicks it', () => {
      // Use real DOM nodes (so appendChild/remove work) and only spy on click,
      // which jsdom would otherwise treat as an unimplemented navigation.
      const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
      const append = vi.spyOn(document.body, 'appendChild')

      triggerBrowserDownload('https://s3/presigned?sig=x', 'IEMIS_NPL_CEHRD_FLASH_I_2083.csv')

      const el = append.mock.calls[0][0] as HTMLAnchorElement
      expect(el.tagName).toBe('A')
      expect(el.getAttribute('download')).toBe('IEMIS_NPL_CEHRD_FLASH_I_2083.csv')
      expect(el.href).toContain('https://s3/presigned')
      expect(click).toHaveBeenCalledTimes(1)
      // anchor is cleaned up
      expect(document.body.contains(el)).toBe(false)
    })
  })
})
