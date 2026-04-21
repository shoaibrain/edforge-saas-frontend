/**
 * Sprint B.6 — State-matrix coverage for the workspace lock classification.
 *
 * We exercise the per-field governance logic directly (it's pure) across
 * every named state the product cares about, plus a light wrapper check
 * for the `useFieldLockState` hook via a stubbed shell context.
 *
 * Full-page render tests for `workspace.tsx` live in the dev-server
 * smoke pass — they require the whole ShellProvider chain + MSW.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, renderHook } from '@testing-library/react'
import { isWorkspaceFieldLocked, type WorkspaceLockHolder } from '@edforge/types'
import { useFieldLockState } from './useFieldLockState'

// Mock useShell so the hook can be rendered without a full ShellProvider.
// The module exports we need: workspaceIsLocked + workspaceLockHolders.
vi.mock('../lib/shell-context', () => ({
  useShell: vi.fn(),
}))

import { useShell } from '../lib/shell-context'

const holders: WorkspaceLockHolder[] = [
  { schoolId: 's1', schoolName: 'Milos Elementary', yearId: 'y1', yearName: '2083-84' },
]

function stubShell(isLocked: boolean, lockHolders: WorkspaceLockHolder[] = []) {
  ;(useShell as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    workspaceIsLocked: isLocked,
    workspaceLockHolders: lockHolders,
  })
}

describe('isWorkspaceFieldLocked — named states', () => {
  it('state 1: no active year + data-integrity field → unlocked', () => {
    expect(isWorkspaceFieldLocked('regional.defaultCurrency', false).locked).toBe(false)
  })

  it('state 2: no active year + display-only field → unlocked', () => {
    expect(isWorkspaceFieldLocked('regional.defaultLocale', false).locked).toBe(false)
  })

  it('state 3: active year + data-integrity field → locked with reason', () => {
    const r = isWorkspaceFieldLocked('regional.defaultCurrency', true)
    expect(r.locked).toBe(true)
    expect(r.class).toBe('locked_during_active_year')
    expect(r.reason).toMatch(/active academic year/i)
  })

  it('state 4: active year + display-only field → unlocked (admin can still edit)', () => {
    expect(isWorkspaceFieldLocked('regional.defaultLocale', true).locked).toBe(false)
    expect(isWorkspaceFieldLocked('regional.defaultDateFormat', true).locked).toBe(false)
    expect(isWorkspaceFieldLocked('regional.defaultTimeFormat', true).locked).toBe(false)
    expect(isWorkspaceFieldLocked('regional.defaultNumberFormat', true).locked).toBe(false)
    expect(isWorkspaceFieldLocked('regional.enableDualDateDisplay', true).locked).toBe(false)
  })

  it('state 5: active year + calendar system → locked (critical)', () => {
    expect(isWorkspaceFieldLocked('regional.defaultCalendarSystem', true).locked).toBe(true)
  })

  it('state 6: active year + timezone → locked (critical)', () => {
    expect(isWorkspaceFieldLocked('regional.defaultTimezone', true).locked).toBe(true)
  })

  it('state 7: active year + week-starts-on → locked (critical)', () => {
    expect(isWorkspaceFieldLocked('regional.defaultWeekStartsOn', true).locked).toBe(true)
  })

  it('state 8: active year + branding/policies → unlocked (always editable)', () => {
    expect(isWorkspaceFieldLocked('branding.organizationName', true).locked).toBe(false)
    expect(isWorkspaceFieldLocked('branding.primaryColor', true).locked).toBe(false)
    expect(isWorkspaceFieldLocked('policies.defaultAttendancePolicy', true).locked).toBe(false)
  })

  it('state 9: unknown path → unlocked (fail-safe; server remains authoritative)', () => {
    expect(isWorkspaceFieldLocked('regional.someBrandNewField', true).locked).toBe(false)
    expect(isWorkspaceFieldLocked('somethingElse.field', true).locked).toBe(false)
  })
})

describe('useFieldLockState hook', () => {
  afterEach(cleanup)

  it('surfaces the locked state, reason, and heldBy when a critical field is locked', () => {
    stubShell(true, holders)
    const { result } = renderHook(() => useFieldLockState('regional.defaultCurrency'))
    expect(result.current.locked).toBe(true)
    expect(result.current.class).toBe('locked_during_active_year')
    expect(result.current.heldBy).toEqual(holders)
  })

  it('omits heldBy for immutable/always-editable paths even when workspace is locked', () => {
    stubShell(true, holders)
    const displayField = renderHook(() => useFieldLockState('regional.defaultLocale'))
    expect(displayField.result.current.locked).toBe(false)
    expect(displayField.result.current.heldBy).toEqual([])
  })

  it('returns unlocked when workspace has no active year — regardless of provided holders', () => {
    stubShell(false, holders)
    const { result } = renderHook(() => useFieldLockState('regional.defaultCurrency'))
    expect(result.current.locked).toBe(false)
    expect(result.current.heldBy).toEqual([])
  })
})
