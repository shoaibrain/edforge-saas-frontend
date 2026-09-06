import { describe, expect, it } from 'vitest'
import type { FeeType } from '@edforge/types'
import {
  BILLING_FREQUENCIES,
  AMOUNT_SUM_TOLERANCE,
  initialWizardState,
  cellKey,
  pruneCells,
  buildCreateDto,
  validateStep1,
  validateStep2,
  type WizardState,
} from '../wizard-types'

const STUDENT_A = '11111111-1111-4111-8111-111111111111'
const STUDENT_B = '22222222-2222-4222-8222-222222222222'
const FAMILY_ID = '33333333-3333-4333-8333-333333333333'

function baseState(overrides: Partial<WizardState> = {}): WizardState {
  return {
    ...initialWizardState(),
    title: 'Sharma siblings 2083',
    payerName: 'Ram Sharma',
    members: [
      { studentId: STUDENT_A, studentName: 'Sita Sharma' },
      { studentId: STUDENT_B, studentName: 'Hari Sharma' },
    ],
    coveredFeeTypes: ['tuition', 'transport'] as FeeType[],
    effectiveFrom: '2026-04-14',
    effectiveTo: '2027-04-13',
    ...overrides,
  }
}

function perStudentState(overrides: Partial<WizardState> = {}): WizardState {
  return baseState({
    agreementType: 'per_student',
    cells: {
      [cellKey(STUDENT_A, 'tuition')]: '10000',
      [cellKey(STUDENT_A, 'transport')]: '2000',
      [cellKey(STUDENT_B, 'tuition')]: '9000',
      [cellKey(STUDENT_B, 'transport')]: '1500',
    },
    ...overrides,
  })
}

describe('BILLING_FREQUENCIES', () => {
  it('matches the backend feeFrequencyEnum exactly', () => {
    expect([...BILLING_FREQUENCIES].sort()).toEqual(
      ['annual', 'monthly', 'one_time', 'quarterly'].sort(),
    )
  })

  it('defaults the wizard to monthly', () => {
    expect(initialWizardState().billingFrequency).toBe('monthly')
  })
})

describe('buildCreateDto — per_student', () => {
  it('emits the FULL member × coveredFeeType matrix as lines', () => {
    const dto = buildCreateDto(perStudentState(), 'NPR')
    expect(dto.agreementType).toBe('per_student')
    const terms = dto.terms
    if (terms.agreementType !== 'per_student') throw new Error('wrong terms')
    expect(terms.lines).toHaveLength(4)
    expect(terms.lines).toEqual(
      expect.arrayContaining([
        { studentId: STUDENT_A, feeType: 'tuition', amount: 10000 },
        { studentId: STUDENT_A, feeType: 'transport', amount: 2000 },
        { studentId: STUDENT_B, feeType: 'tuition', amount: 9000 },
        { studentId: STUDENT_B, feeType: 'transport', amount: 1500 },
      ]),
    )
    // every line carries a feeType from coveredFeeTypes (backend invariants)
    for (const line of terms.lines) {
      expect(dto.coveredFeeTypes).toContain(line.feeType)
    }
  })

  it('threads currency, notes, and familyId into the DTO', () => {
    const dto = buildCreateDto(
      perStudentState({ notes: '  Negotiated at admission  ', familyId: FAMILY_ID }),
      'USD',
    )
    expect(dto.currency).toBe('USD')
    expect(dto.notes).toBe('Negotiated at admission')
    expect(dto.familyId).toBe(FAMILY_ID)
  })

  it('omits empty optionals (notes, familyId, payer phone/email)', () => {
    const dto = buildCreateDto(perStudentState(), 'NPR')
    expect(dto).not.toHaveProperty('notes')
    expect(dto).not.toHaveProperty('familyId')
    expect(dto.payer).toEqual({ name: 'Ram Sharma' })
  })

  it('always emits a backend-valid billingFrequency', () => {
    for (const frequency of BILLING_FREQUENCIES) {
      const dto = buildCreateDto(perStudentState({ billingFrequency: frequency }), 'NPR')
      expect(['one_time', 'monthly', 'quarterly', 'annual']).toContain(
        dto.billingFrequency,
      )
    }
  })
})

describe('buildCreateDto — fixed_total', () => {
  it('emits totalAmount + one allocation per member', () => {
    const dto = buildCreateDto(
      baseState({
        totalAmount: '40000',
        allocation: { [STUDENT_A]: '25000', [STUDENT_B]: '15000' },
      }),
      'NPR',
    )
    const terms = dto.terms
    if (terms.agreementType !== 'fixed_total') throw new Error('wrong terms')
    expect(terms.totalAmount).toBe(40000)
    expect(terms.allocation).toEqual([
      { studentId: STUDENT_A, amount: 25000 },
      { studentId: STUDENT_B, amount: 15000 },
    ])
    expect(dto.currency).toBe('NPR')
  })
})

describe('validateStep1', () => {
  const keysOf = (state: WizardState) =>
    validateStep1(state).errors.map((e) => e.key)

  it('passes a valid step-1 state', () => {
    expect(validateStep1(baseState()).ok).toBe(true)
  })

  it('requires title and bounds it at 160', () => {
    expect(keysOf(baseState({ title: '  ' }))).toContain(
      'agreement.wizard.validation.titleRequired',
    )
    expect(keysOf(baseState({ title: 'x'.repeat(161) }))).toContain(
      'agreement.wizard.validation.titleMax',
    )
    expect(validateStep1(baseState({ title: 'x'.repeat(160) })).ok).toBe(true)
  })

  it('bounds payer name (120) and phone (20)', () => {
    expect(keysOf(baseState({ payerName: 'x'.repeat(121) }))).toContain(
      'agreement.wizard.validation.payerNameMax',
    )
    expect(keysOf(baseState({ payerPhone: '9'.repeat(21) }))).toContain(
      'agreement.wizard.validation.payerPhoneMax',
    )
  })

  it('rejects malformed emails but allows empty', () => {
    expect(keysOf(baseState({ payerEmail: 'not-an-email' }))).toContain(
      'agreement.wizard.validation.payerEmailInvalid',
    )
    expect(validateStep1(baseState({ payerEmail: '' })).ok).toBe(true)
    expect(validateStep1(baseState({ payerEmail: 'ram@example.com' })).ok).toBe(true)
  })

  it('requires familyId, when set, to be a UUID', () => {
    expect(keysOf(baseState({ familyId: 'family-42' }))).toContain(
      'agreement.wizard.validation.familyIdInvalid',
    )
    expect(validateStep1(baseState({ familyId: FAMILY_ID })).ok).toBe(true)
    expect(validateStep1(baseState({ familyId: '' })).ok).toBe(true)
  })
})

describe('validateStep2 — per_student matrix', () => {
  const keysOf = (state: WizardState) =>
    validateStep2(state).errors.map((e) => e.key)

  it('passes a complete positive matrix', () => {
    expect(validateStep2(perStudentState()).ok).toBe(true)
  })

  it('rejects a missing cell (F1 completeness)', () => {
    const state = perStudentState()
    delete state.cells[cellKey(STUDENT_B, 'transport')]
    expect(keysOf(state)).toContain('agreement.wizard.validation.matrixRequired')
  })

  it('rejects zero and empty amounts', () => {
    expect(
      keysOf(
        perStudentState({
          cells: {
            ...perStudentState().cells,
            [cellKey(STUDENT_A, 'tuition')]: '0',
          },
        }),
      ),
    ).toContain('agreement.wizard.validation.matrixRequired')
    expect(
      keysOf(
        perStudentState({
          cells: {
            ...perStudentState().cells,
            [cellKey(STUDENT_A, 'tuition')]: '',
          },
        }),
      ),
    ).toContain('agreement.wizard.validation.matrixRequired')
  })

  it('caps the matrix at 300 lines', () => {
    const members = Array.from({ length: 31 }, (_, i) => ({
      studentId: `${String(i).padStart(8, '0')}-0000-4000-8000-000000000000`,
      studentName: `Student ${i}`,
    }))
    const coveredFeeTypes = [
      'tuition', 'admission', 'exam', 'transport', 'library',
      'lab', 'hostel', 'uniform', 'miscellaneous', 'custom',
    ] as FeeType[]
    const cells: Record<string, string> = {}
    for (const m of members)
      for (const ft of coveredFeeTypes) cells[cellKey(m.studentId, ft)] = '100'
    const state = perStudentState({ members, coveredFeeTypes, cells })
    expect(keysOf(state)).toContain('agreement.wizard.validation.tooManyLines')
  })
})

describe('validateStep2 — fixed_total', () => {
  const keysOf = (state: WizardState) =>
    validateStep2(state).errors.map((e) => e.key)

  const fixedState = (overrides: Partial<WizardState> = {}) =>
    baseState({
      totalAmount: '40000',
      allocation: { [STUDENT_A]: '25000', [STUDENT_B]: '15000' },
      ...overrides,
    })

  it('passes a balanced allocation', () => {
    expect(validateStep2(fixedState()).ok).toBe(true)
  })

  it('rejects a zero allocation (backend amounts are strictly positive)', () => {
    expect(
      keysOf(fixedState({ allocation: { [STUDENT_A]: '40000', [STUDENT_B]: '0' } })),
    ).toContain('agreement.wizard.validation.allocationPositive')
  })

  it('uses the backend ±0.01 sum tolerance', () => {
    expect(AMOUNT_SUM_TOLERANCE).toBe(0.01)
    // within tolerance — passes
    expect(
      validateStep2(
        fixedState({
          allocation: { [STUDENT_A]: '25000.005', [STUDENT_B]: '15000' },
        }),
      ).ok,
    ).toBe(true)
    // beyond tolerance — flagged
    expect(
      keysOf(
        fixedState({
          allocation: { [STUDENT_A]: '25000.02', [STUDENT_B]: '15000' },
        }),
      ),
    ).toContain('agreement.wizard.validation.allocationSum')
  })

  it('requires a covered fee type selection', () => {
    expect(keysOf(fixedState({ coveredFeeTypes: [] }))).toContain(
      'agreement.wizard.validation.feeTypesRequired',
    )
  })
})

describe('pruneCells', () => {
  it('drops stale cells and seeds new pairs empty, keeping survivors', () => {
    const members = [{ studentId: STUDENT_A, studentName: 'Sita' }]
    const before = {
      [cellKey(STUDENT_A, 'tuition')]: '10000',
      [cellKey(STUDENT_B, 'tuition')]: '9000', // member removed
      [cellKey(STUDENT_A, 'exam')]: '500', // fee type deselected
    }
    const after = pruneCells(before, members, ['tuition', 'transport'] as FeeType[])
    expect(after).toEqual({
      [cellKey(STUDENT_A, 'tuition')]: '10000',
      [cellKey(STUDENT_A, 'transport')]: '',
    })
  })
})
