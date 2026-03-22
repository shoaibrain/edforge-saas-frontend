import { describe, it, expect } from 'vitest'
import { formatDate, formatDateDual, formatDateTime } from './format-date'
import type { ResolvedSettings } from '@edforge/config/resolved-settings'

const BASE_SETTINGS: ResolvedSettings = {
  currency: 'USD',
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  calendarSystem: 'gregorian',
  enableDualDateDisplay: false,
  numberFormat: 'international',
  locale: 'en-US',
  weekStartsOn: 'sunday',
}

describe('formatDate', () => {
  it('formats with en-US locale and MM/DD/YYYY', () => {
    const result = formatDate('2026-03-18', { ...BASE_SETTINGS, locale: 'en-US', dateFormat: 'MM/DD/YYYY' })
    expect(result).toBe('03/18/2026')
  })

  it('formats with en-GB locale and DD/MM/YYYY', () => {
    const result = formatDate('2026-03-18', { ...BASE_SETTINGS, locale: 'en-GB', dateFormat: 'DD/MM/YYYY' })
    expect(result).toBe('18/03/2026')
  })

  it('backward compat: no settings uses en-GB DD/MM/YYYY', () => {
    const result = formatDate('2026-03-18')
    expect(result).toBe('18/03/2026')
  })

  it('returns em-dash for null', () => {
    expect(formatDate(null)).toBe('\u2014')
  })

  it('returns em-dash for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('\u2014')
  })
})

describe('formatDateDual', () => {
  it('shows dual format for bikram_sambat with enableDualDateDisplay', () => {
    const settings: ResolvedSettings = {
      ...BASE_SETTINGS,
      calendarSystem: 'bikram_sambat',
      enableDualDateDisplay: true,
      locale: 'en-GB',
      dateFormat: 'DD/MM/YYYY',
    }
    const result = formatDateDual('2026-03-18', settings)
    expect(result).toContain('(BS:')
  })

  it('shows single format for gregorian calendar', () => {
    const settings: ResolvedSettings = {
      ...BASE_SETTINGS,
      calendarSystem: 'gregorian',
      enableDualDateDisplay: false,
    }
    const result = formatDateDual('2026-03-18', settings)
    expect(result).not.toContain('(BS:')
  })

  it('shows single format when enableDualDateDisplay is false', () => {
    const settings: ResolvedSettings = {
      ...BASE_SETTINGS,
      calendarSystem: 'bikram_sambat',
      enableDualDateDisplay: false,
    }
    const result = formatDateDual('2026-03-18', settings)
    expect(result).not.toContain('(BS:')
  })

  it('backward compat: no settings shows dual format', () => {
    const result = formatDateDual('2026-03-18')
    expect(result).toContain('(BS:')
  })
})

describe('formatDateTime', () => {
  it('formats with Asia/Kathmandu timezone', () => {
    const settings: ResolvedSettings = {
      ...BASE_SETTINGS,
      timezone: 'Asia/Kathmandu',
      locale: 'en-US',
      timeFormat: '24h',
    }
    // UTC midnight should be 05:45 in Kathmandu
    const result = formatDateTime('2026-03-18T00:00:00Z', settings)
    expect(result).toContain('05:45')
  })

  it('formats with America/New_York timezone', () => {
    const settings: ResolvedSettings = {
      ...BASE_SETTINGS,
      timezone: 'America/New_York',
      locale: 'en-US',
      timeFormat: '24h',
    }
    // UTC midnight is 20:00 (or 19:00 EDT) previous day in New York (March = EDT)
    const result = formatDateTime('2026-03-18T00:00:00Z', settings)
    // March 18 is during EDT (UTC-4), so midnight UTC = 8:00 PM on March 17
    expect(result).toContain('20:00')
  })

  it('backward compat: no settings uses browser locale', () => {
    const result = formatDateTime('2026-03-18T12:30:00Z')
    expect(result).not.toBe('\u2014')
  })
})
