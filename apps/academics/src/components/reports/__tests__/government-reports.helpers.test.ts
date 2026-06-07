import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  canDownload,
  canMarkSubmitted,
  canMarkVerified,
  extractBsYear,
  isInProgress,
  isValidBsYear,
  statusLabel,
  statusVariant,
  triggerBrowserDownload,
} from '../government-reports.helpers'
import type { ReportingSnapshotStatus } from '../government-reports.types'

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
