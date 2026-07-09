/**
 * Unit tests for school-context-channel
 *
 * Tests the CustomEvent-based broadcast mechanism used for cross-MFE
 * school context synchronization.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  broadcastSchoolChange,
  onSchoolChange,
  getSchoolContext,
  resetSchoolContext,
  type SchoolContextPayload,
} from '../school-context-channel'

describe('school-context-channel', () => {
  let dispatchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Broadcasts merge over the retained payload — isolate tests from each
    // other's optional fields.
    resetSchoolContext()
    dispatchSpy = vi.spyOn(window, 'dispatchEvent')
  })

  afterEach(() => {
    dispatchSpy.mockRestore()
  })

  describe('broadcastSchoolChange', () => {
    it('dispatches a CustomEvent with the correct event name', () => {
      broadcastSchoolChange('school-1', 'active')

      expect(dispatchSpy).toHaveBeenCalledTimes(1)
      const event = dispatchSpy.mock.calls[0][0] as CustomEvent
      expect(event.type).toBe('edforge:school-changed')
    })

    it('includes schoolId and schoolStatus in the event detail', () => {
      broadcastSchoolChange('school-42', 'setup')

      const event = dispatchSpy.mock.calls[0][0] as CustomEvent<SchoolContextPayload>
      expect(event.detail).toEqual({
        schoolId: 'school-42',
        schoolStatus: 'setup',
      })
    })

    it('handles null schoolId and schoolStatus', () => {
      broadcastSchoolChange(null, null)

      const event = dispatchSpy.mock.calls[0][0] as CustomEvent<SchoolContextPayload>
      expect(event.detail).toEqual({
        schoolId: null,
        schoolStatus: null,
      })
    })
  })

  describe('onSchoolChange', () => {
    it('calls the callback when a school change event is dispatched', () => {
      const callback = vi.fn()
      const unsubscribe = onSchoolChange(callback)

      broadcastSchoolChange('school-1', 'active')

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith({
        schoolId: 'school-1',
        schoolStatus: 'active',
      })

      unsubscribe()
    })

    it('returns an unsubscribe function that removes the listener', () => {
      const callback = vi.fn()
      const unsubscribe = onSchoolChange(callback)

      broadcastSchoolChange('school-1', 'active')
      expect(callback).toHaveBeenCalledTimes(1)

      unsubscribe()

      broadcastSchoolChange('school-2', 'active')
      expect(callback).toHaveBeenCalledTimes(1) // Still 1, not 2
    })

    it('supports multiple concurrent listeners', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      const unsub1 = onSchoolChange(callback1)
      const unsub2 = onSchoolChange(callback2)

      broadcastSchoolChange('school-1', 'active')

      expect(callback1).toHaveBeenCalledTimes(1)
      expect(callback2).toHaveBeenCalledTimes(1)

      unsub1()
      broadcastSchoolChange('school-2', 'active')

      expect(callback1).toHaveBeenCalledTimes(1) // Unsubscribed
      expect(callback2).toHaveBeenCalledTimes(2) // Still listening

      unsub2()
    })

    it('receives sequential school changes in order', () => {
      const received: SchoolContextPayload[] = []
      const unsubscribe = onSchoolChange((payload) => received.push(payload))

      broadcastSchoolChange('school-1', 'active')
      broadcastSchoolChange('school-2', 'setup')
      broadcastSchoolChange(null, null)

      expect(received).toEqual([
        { schoolId: 'school-1', schoolStatus: 'active' },
        { schoolId: 'school-2', schoolStatus: 'setup' },
        { schoolId: null, schoolStatus: null },
      ])

      unsubscribe()
    })
  })

  describe('Sprint A.12 — archetype + country fields', () => {
    it('threads archetype and country through the payload', () => {
      broadcastSchoolChange(
        'school-1',
        'active',
        undefined, // resolvedSettings
        'tenant-1',
        'PABSON',
        'NPL',
      )

      const event = dispatchSpy.mock.calls[0][0] as CustomEvent<SchoolContextPayload>
      expect(event.detail.archetype).toBe('PABSON')
      expect(event.detail.country).toBe('NPL')
      expect(event.detail.tenantId).toBe('tenant-1')
    })

    it('archetype + country surface synchronously via getSchoolContext', () => {
      broadcastSchoolChange('school-1', 'active', undefined, 'tenant-1', 'PABSON', 'NPL')

      const ctx = getSchoolContext()
      expect(ctx.archetype).toBe('PABSON')
      expect(ctx.country).toBe('NPL')
    })

    it('subscribers receive archetype + country in the payload', () => {
      const callback = vi.fn()
      const unsubscribe = onSchoolChange(callback)

      broadcastSchoolChange('school-1', 'active', undefined, 'tenant-1', 'PABSON', 'NPL')

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ archetype: 'PABSON', country: 'NPL' }),
      )
      unsubscribe()
    })

    it('omits archetype + country gracefully when not provided (legacy callers)', () => {
      broadcastSchoolChange('school-1', 'active')
      const ctx = getSchoolContext()
      expect(ctx.archetype).toBeUndefined()
      expect(ctx.country).toBeUndefined()
    })
  })

  describe('getSchoolContext', () => {
    it('returns the last broadcast payload', () => {
      broadcastSchoolChange('school-99', 'active')

      const ctx = getSchoolContext()
      expect(ctx).toEqual({ schoolId: 'school-99', schoolStatus: 'active' })
    })

    it('updates when a new broadcast occurs', () => {
      broadcastSchoolChange('school-1', 'active')
      expect(getSchoolContext().schoolId).toBe('school-1')

      broadcastSchoolChange('school-2', 'setup')
      expect(getSchoolContext()).toEqual({
        schoolId: 'school-2',
        schoolStatus: 'setup',
      })
    })

    it('returns null values when null is broadcast', () => {
      broadcastSchoolChange('school-1', 'active')
      broadcastSchoolChange(null, null)

      expect(getSchoolContext()).toEqual({
        schoolId: null,
        schoolStatus: null,
      })
    })
  })

  describe('merge semantics (2026-07-09 currency-flash fix)', () => {
    const SETTINGS = {
      currency: 'NPR',
      timezone: 'Asia/Kathmandu',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '12h',
      calendarSystem: 'bikram_sambat',
      enableDualDateDisplay: true,
      numberFormat: 'south_asian',
      locale: 'ne-NP',
      weekStartsOn: 'sunday',
    } as const

    it('resolvedSettings round-trips synchronously via getSchoolContext', () => {
      broadcastSchoolChange('school-1', 'active', SETTINGS, 'tenant-1', 'PABSON', 'NPL')
      expect(getSchoolContext().resolvedSettings).toEqual(SETTINGS)
    })

    it('a settings-less broadcast preserves prior settings/tenant/archetype/country', () => {
      broadcastSchoolChange('school-1', 'active', SETTINGS, 'tenant-1', 'PABSON', 'NPL')
      // e.g. app.store's setActiveSchoolStatus broadcasts schoolId+status only
      broadcastSchoolChange('school-1', 'setup')

      const ctx = getSchoolContext()
      expect(ctx.schoolStatus).toBe('setup')
      expect(ctx.resolvedSettings).toEqual(SETTINGS)
      expect(ctx.tenantId).toBe('tenant-1')
      expect(ctx.archetype).toBe('PABSON')
      expect(ctx.country).toBe('NPL')
    })

    it('subscribers receive the merged payload, not the sparse call args', () => {
      broadcastSchoolChange('school-1', 'active', SETTINGS, 'tenant-1', 'PABSON', 'NPL')
      const callback = vi.fn()
      const unsubscribe = onSchoolChange(callback)

      broadcastSchoolChange('school-2', 'active')

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ schoolId: 'school-2', resolvedSettings: SETTINGS, archetype: 'PABSON' }),
      )
      unsubscribe()
    })

    it('schoolId and schoolStatus always take the new values', () => {
      broadcastSchoolChange('school-1', 'active', SETTINGS)
      broadcastSchoolChange('school-2', 'setup')
      expect(getSchoolContext().schoolId).toBe('school-2')
      expect(getSchoolContext().schoolStatus).toBe('setup')
    })

    it('resetSchoolContext blanks the retained payload (logout hygiene)', () => {
      broadcastSchoolChange('school-1', 'active', SETTINGS, 'tenant-1', 'PABSON', 'NPL')
      resetSchoolContext()
      expect(getSchoolContext()).toEqual({ schoolId: null, schoolStatus: null })
    })
  })
})
