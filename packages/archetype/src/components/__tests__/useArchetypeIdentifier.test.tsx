/**
 * useArchetypeIdentifier — unit tests.
 *
 * The hook is a thin bridge: it reads (archetype, country) from the cross-MFE
 * tenant context and delegates to the pure `resolveIdentifier` function. Tests
 * verify that the bridge wires correctly — that context values reach the
 * resolver and that the returned object shape is complete.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'

// Mutable holder, hoisted so the vi.mock factory can reference it.
const h = vi.hoisted(() => ({
  ctx: {
    archetype: null as string | null,
    country: null as string | null,
  },
}))

vi.mock('@edforge/forms', () => ({
  useTenantContext: () => h.ctx,
}))

import { useArchetypeIdentifier } from '../useArchetypeIdentifier'

afterEach(cleanup)

// Helper: render the hook inside a minimal component and capture the result.
function renderHook(
  entity: Parameters<typeof useArchetypeIdentifier>[0],
  data: Parameters<typeof useArchetypeIdentifier>[1],
) {
  let result!: ReturnType<typeof useArchetypeIdentifier>
  function Harness() {
    result = useArchetypeIdentifier(entity, data)
    return null
  }
  render(<Harness />)
  return result
}

// ─── PABSON context ───────────────────────────────────────────────────────────

describe('useArchetypeIdentifier — PABSON context', () => {
  beforeEach(() => {
    h.ctx = { archetype: 'PABSON', country: 'NPL' }
  })

  it('resolves emisStudentId as the primary field for a student', () => {
    const r = renderHook('student', {
      emisStudentId: '1708400128200043',
      studentNumber: 'SSSEB-2026-00044',
      id: 'uuid',
    })
    expect(r.field).toBe('emisStudentId')
    expect(r.value).toBe('1708400128200043')
    expect(r.archetype).toBe('PABSON')
    expect(r.sensitive).toBe(true)
    expect(r.fallbackUsed).toBe(false)
  })

  it('returns a secondary line (studentNumber) when EMIS id is present', () => {
    const r = renderHook('student', {
      emisStudentId: '1708400128200043',
      studentNumber: 'SSSEB-2026-00044',
    })
    expect(r.secondary).toEqual({ field: 'studentNumber', value: 'SSSEB-2026-00044' })
  })

  it('falls back to studentNumber and suppresses secondary when EMIS id is absent', () => {
    const r = renderHook('student', { studentNumber: 'SSSEB-2026-00044', id: 'uuid' })
    expect(r.field).toBe('studentNumber')
    expect(r.fallbackUsed).toBe(true)
    expect(r.secondary).toBeUndefined()
  })
})

// ─── GENERIC context ──────────────────────────────────────────────────────────

describe('useArchetypeIdentifier — GENERIC context', () => {
  beforeEach(() => {
    h.ctx = { archetype: 'GENERIC', country: null }
  })

  it('resolves studentNumber as the primary field for a student', () => {
    const r = renderHook('student', { studentNumber: 'S-100', id: 'uuid' })
    expect(r.field).toBe('studentNumber')
    expect(r.value).toBe('S-100')
    expect(r.sensitive).toBe(false)
    expect(r.archetype).toBe('GENERIC')
  })

  it('returns format plain and copyable false for a student', () => {
    const r = renderHook('student', { studentNumber: 'S-100' })
    expect(r.format).toBe('plain')
    expect(r.copyable).toBe(false)
  })

  it('resolves transactionId for a transaction with uuid-short format and copyable', () => {
    const r = renderHook('transaction', {
      transactionId: 'aaaabbbb-cccc-dddd-eeee-ffffffffffff',
    })
    expect(r.field).toBe('transactionId')
    expect(r.format).toBe('uuid-short')
    expect(r.copyable).toBe(true)
  })
})

// ─── country-only fallback (no explicit archetype) ────────────────────────────

describe('useArchetypeIdentifier — country tiebreak (NPL → PABSON)', () => {
  beforeEach(() => {
    h.ctx = { archetype: null, country: 'NPL' }
  })

  it('resolves to PABSON profile when archetype is null but country is NPL', () => {
    const r = renderHook('student', {
      emisStudentId: '1708400128200043',
      studentNumber: 'SN',
    })
    expect(r.archetype).toBe('PABSON')
    expect(r.field).toBe('emisStudentId')
  })
})

// ─── null/undefined context ───────────────────────────────────────────────────

describe('useArchetypeIdentifier — null/undefined context falls back to GENERIC', () => {
  beforeEach(() => {
    h.ctx = { archetype: null, country: null }
  })

  it('degrades to GENERIC when both archetype and country are null', () => {
    const r = renderHook('student', { studentNumber: 'S-1' })
    expect(r.archetype).toBe('GENERIC')
  })

  it('returns empty string (not a crash) for null data', () => {
    const r = renderHook('student', null)
    expect(r.value).toBe('')
    expect(r.fallbackUsed).toBe(true)
  })

  it('returns empty string (not a crash) for undefined data', () => {
    const r = renderHook('payment', undefined)
    expect(r.value).toBe('')
  })
})

// ─── ResolvedIdentifier shape completeness ────────────────────────────────────

describe('useArchetypeIdentifier — result shape', () => {
  beforeEach(() => {
    h.ctx = { archetype: 'PABSON', country: 'NPL' }
  })

  it('result always carries field, value, fallbackUsed, labelKey, format, copyable, sensitive, archetype, entity', () => {
    const r = renderHook('student', { emisStudentId: '123', studentNumber: 'SN' })
    expect(r).toHaveProperty('field')
    expect(r).toHaveProperty('value')
    expect(r).toHaveProperty('fallbackUsed')
    expect(r).toHaveProperty('labelKey')
    expect(r).toHaveProperty('format')
    expect(r).toHaveProperty('copyable')
    expect(r).toHaveProperty('sensitive')
    expect(r).toHaveProperty('archetype')
    expect(r).toHaveProperty('entity')
    expect(r.entity).toBe('student')
  })

  it('labelKey always starts with "identifiers."', () => {
    const r = renderHook('student', { emisStudentId: '123' })
    expect(r.labelKey).toMatch(/^identifiers\./)
  })
})