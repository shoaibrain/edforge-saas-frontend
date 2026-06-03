import { describe, expect, it } from 'vitest'
import { resolveIdentifier, serializeIdentifier } from '../resolveIdentifier'

const PABSON = { archetype: 'PABSON' as const }
const GENERIC = { archetype: 'GENERIC' as const }

describe('resolveIdentifier — PABSON student (the headline case)', () => {
  it('renders the government EMIS id as primary, studentNumber as secondary', () => {
    const r = resolveIdentifier(
      'student',
      { emisStudentId: '1708400128200043', studentNumber: 'SSSEB-2026-00044', id: 'uuid' },
      PABSON,
    )
    expect(r.field).toBe('emisStudentId')
    expect(r.value).toBe('1708400128200043')
    expect(r.secondary).toEqual({ field: 'studentNumber', value: 'SSSEB-2026-00044' })
    expect(r.format).toBe('iemis')
    expect(r.sensitive).toBe(true)
    expect(r.fallbackUsed).toBe(false)
    expect(r.archetype).toBe('PABSON')
  })

  it('falls back to studentNumber when EMIS id missing (new admission / ECD-PPC cohort)', () => {
    const r = resolveIdentifier(
      'student',
      { emisStudentId: '', studentNumber: 'SSSEB-2026-00044', id: 'uuid' },
      PABSON,
    )
    expect(r.field).toBe('studentNumber')
    expect(r.value).toBe('SSSEB-2026-00044')
    expect(r.fallbackUsed).toBe(true)
    // secondary equals the fallback field → suppressed (no duplicate line)
    expect(r.secondary).toBeUndefined()
  })
})

describe('resolveIdentifier — GENERIC student', () => {
  it('renders studentNumber, no EMIS, not sensitive', () => {
    const r = resolveIdentifier('student', { studentNumber: 'S-1', id: 'uuid' }, GENERIC)
    expect(r.field).toBe('studentNumber')
    expect(r.value).toBe('S-1')
    expect(r.sensitive).toBe(false)
    expect(r.archetype).toBe('GENERIC')
  })

  it('falls back to id when studentNumber missing', () => {
    const r = resolveIdentifier('student', { id: 'uuid-123' }, GENERIC)
    expect(r.field).toBe('id')
    expect(r.value).toBe('uuid-123')
    expect(r.fallbackUsed).toBe(true)
  })
})

describe('resolveIdentifier — emptiness edge cases', () => {
  it.each([
    ['empty string', ''],
    ['null', null],
    ['undefined', undefined],
    ['whitespace', '   '],
  ])('treats %s primary as empty and falls back', (_label, primary) => {
    const r = resolveIdentifier(
      'student',
      { emisStudentId: primary, studentNumber: 'SN', id: 'i' },
      PABSON,
    )
    expect(r.fallbackUsed).toBe(true)
    expect(r.value).toBe('SN')
  })

  it("does NOT treat '0' (falsy-numeric string) as empty", () => {
    const r = resolveIdentifier('student', { emisStudentId: '0', studentNumber: 'SN' }, PABSON)
    expect(r.fallbackUsed).toBe(false)
    expect(r.value).toBe('0')
  })

  it('returns empty value (not a crash) when nothing resolves', () => {
    const r = resolveIdentifier('student', {}, PABSON)
    expect(r.value).toBe('')
    expect(r.fallbackUsed).toBe(true)
  })

  it('tolerates null/undefined data', () => {
    expect(resolveIdentifier('payment', null).value).toBe('')
    expect(resolveIdentifier('payment', undefined).value).toBe('')
  })
})

describe('serializeIdentifier — CSV/PDF parity', () => {
  it('returns the same value as on-screen, with a translated label when given a translator', () => {
    const data = { emisStudentId: '1708400128200043', studentNumber: 'SN' }
    const onScreen = resolveIdentifier('student', data, PABSON)
    const serialized = serializeIdentifier('student', data, PABSON, (k) =>
      k === 'identifiers.emisStudentId' ? 'EMIS Student ID' : k,
    )
    expect(serialized.value).toBe(onScreen.value) // parity — no screen/CSV drift
    expect(serialized.label).toBe('EMIS Student ID')
  })

  it('returns the raw labelKey when no translator is supplied', () => {
    expect(serializeIdentifier('student', { studentNumber: 'SN' }, GENERIC).label).toBe(
      'identifiers.studentNumber',
    )
  })
})
