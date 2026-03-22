/**
 * Resolved Settings — shared types and defaults for the tenant/school settings
 * precedence chain. Consumed by Shell (provider) and MFEs (consumers).
 *
 * Precedence: School Configuration → School Entity → Tenant Settings → SYSTEM_DEFAULTS
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ResolvedSettings {
  currency: string
  timezone: string
  dateFormat: string
  timeFormat: '12h' | '24h'
  calendarSystem: 'gregorian' | 'bikram_sambat'
  enableDualDateDisplay: boolean
  numberFormat: 'south_asian' | 'international'
  locale: string
  weekStartsOn: 'sunday' | 'monday'
}

// ============================================================================
// SYSTEM DEFAULTS — final fallback when nothing else is configured
// ============================================================================

export const SYSTEM_DEFAULTS: ResolvedSettings = {
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
