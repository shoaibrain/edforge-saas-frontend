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

  it('handles null data without crashing and returns empty value', () => {
    const result = serializeIdentifier('payment', null, GENERIC)
    expect(result.value).toBe('')
    expect(result.label).toBe('identifiers.receiptNumber')
  })

  it('parity holds for GENERIC payment: receiptNumber primary', () => {
    const data = { receiptNumber: 'REC-2026-0001', id: 'uuid' }
    const onScreen = resolveIdentifier('payment', data, GENERIC)
    const serialized = serializeIdentifier('payment', data, GENERIC)
    expect(serialized.value).toBe(onScreen.value)
    expect(serialized.value).toBe('REC-2026-0001')
  })
})

// ─── Additional entity kinds ──────────────────────────────────────────────────

describe('resolveIdentifier — all GENERIC entity kinds', () => {
  it('payment: resolves receiptNumber as primary, id as fallback', () => {
    const r = resolveIdentifier('payment', { receiptNumber: 'REC-001', id: 'uuid' }, GENERIC)
    expect(r.field).toBe('receiptNumber')
    expect(r.value).toBe('REC-001')
    expect(r.format).toBe('plain')
    expect(r.copyable).toBe(false)
    expect(r.entity).toBe('payment')
  })

  it('invoice: resolves invoiceNumber as primary', () => {
    const r = resolveIdentifier('invoice', { invoiceNumber: 'INV-001', id: 'uuid' }, GENERIC)
    expect(r.field).toBe('invoiceNumber')
    expect(r.value).toBe('INV-001')
    expect(r.format).toBe('plain')
  })

  it('account: resolves accountNumber as primary', () => {
    const r = resolveIdentifier('account', { accountNumber: 'ACC-001', id: 'uuid' }, GENERIC)
    expect(r.field).toBe('accountNumber')
    expect(r.value).toBe('ACC-001')
  })

  it('user: resolves displayName as primary', () => {
    const r = resolveIdentifier('user', { displayName: 'Alice Smith', id: 'uuid' }, GENERIC)
    expect(r.field).toBe('displayName')
    expect(r.value).toBe('Alice Smith')
  })

  it('receipt: resolves receiptNumber as primary', () => {
    const r = resolveIdentifier('receipt', { receiptNumber: 'RCPT-007', id: 'uuid' }, GENERIC)
    expect(r.field).toBe('receiptNumber')
    expect(r.value).toBe('RCPT-007')
  })

  it('transaction: resolves transactionId as primary with uuid-short format and copyable', () => {
    const txId = 'aaaabbbb-cccc-dddd-eeee-ffffffffffff'
    const r = resolveIdentifier('transaction', { transactionId: txId }, GENERIC)
    expect(r.field).toBe('transactionId')
    expect(r.value).toBe(txId)
    expect(r.format).toBe('uuid-short')
    expect(r.copyable).toBe(true)
    expect(r.sensitive).toBe(false)
  })

  it('enrollment: resolves enrollmentId as primary with uuid-short format and copyable', () => {
    const enrolId = 'aaaabbbb-cccc-dddd-eeee-000000000001'
    const r = resolveIdentifier('enrollment', { enrollmentId: enrolId }, GENERIC)
    expect(r.field).toBe('enrollmentId')
    expect(r.value).toBe(enrolId)
    expect(r.format).toBe('uuid-short')
    expect(r.copyable).toBe(true)
  })
})

describe('resolveIdentifier — country-only context (NPL → PABSON tiebreak)', () => {
  it('resolves to PABSON profile when no archetype but country=NPL', () => {
    const r = resolveIdentifier(
      'student',
      { emisStudentId: '1708400128200043', studentNumber: 'SN' },
      { country: 'NPL' },
    )
    expect(r.archetype).toBe('PABSON')
    expect(r.field).toBe('emisStudentId')
    expect(r.sensitive).toBe(true)
  })

  it('resolves to GENERIC when country is not NPL and archetype is absent', () => {
    const r = resolveIdentifier('student', { studentNumber: 'S-1' }, { country: 'USA' })
    expect(r.archetype).toBe('GENERIC')
    expect(r.field).toBe('studentNumber')
  })
})

describe('resolveIdentifier — ResolvedIdentifier shape completeness', () => {
  it('always includes the entity field in the result', () => {
    const r = resolveIdentifier('invoice', { invoiceNumber: 'INV-001' }, GENERIC)
    expect(r.entity).toBe('invoice')
  })

  it('copyable defaults to false for non-copyable specs', () => {
    const r = resolveIdentifier('student', { studentNumber: 'S-1' }, GENERIC)
    expect(r.copyable).toBe(false)
  })

  it('copyable is true for transaction (uuid-short, copyable)', () => {
    const r = resolveIdentifier('transaction', { transactionId: 'tx-id' }, GENERIC)
    expect(r.copyable).toBe(true)
  })

  it('secondary is undefined when no secondaryField is configured (GENERIC student)', () => {
    const r = resolveIdentifier('student', { studentNumber: 'S-1', id: 'uuid' }, GENERIC)
    // GENERIC student has no secondaryField
    expect(r.secondary).toBeUndefined()
  })
})
