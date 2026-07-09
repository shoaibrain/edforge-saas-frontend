/**
 * AgreementCreateWizard — shared state shape + client-side invariant checks.
 *
 * The validation mirrors the backend agreement `superRefine` so operators get
 * immediate feedback before the 400: allocations must sum to the total, every
 * member must be covered, and an agreement covers at most 30 students.
 */

import type {
  AgreementType,
  CreateAgreementDto,
  AgreementTerms,
} from '@edforge/types'

/** Max students an agreement may cover (backend invariant). */
export const MAX_AGREEMENT_STUDENTS = 30

export type WizardStep = 0 | 1 | 2

export interface WizardMember {
  studentId: string
  studentName: string
}

export interface WizardState {
  // Step 1 — family & members
  title: string
  familyId: string
  payerName: string
  payerPhone: string
  payerEmail: string
  members: WizardMember[]
  // Step 2 — terms
  agreementType: AgreementType
  coveredFeeTypes: string[]
  billingFrequency: string
  totalAmount: string
  /** studentId → amount string (fixed_total allocation). */
  allocation: Record<string, string>
  /** studentId → { amount, feeType } (per_student lines). */
  lines: Record<string, { amount: string; feeType: string }>
  effectiveFrom: string
  effectiveTo: string
}

export function initialWizardState(): WizardState {
  return {
    title: '',
    familyId: '',
    payerName: '',
    payerPhone: '',
    payerEmail: '',
    members: [],
    agreementType: 'fixed_total',
    coveredFeeTypes: [],
    billingFrequency: 'monthly',
    totalAmount: '',
    allocation: {},
    lines: {},
    effectiveFrom: '',
    effectiveTo: '',
  }
}

export const BILLING_FREQUENCIES = [
  'monthly',
  'quarterly',
  'termly',
  'annually',
  'one_time',
] as const

/** Parse a form amount string to a number (empty/NaN → 0). */
export function parseAmount(v: string | undefined): number {
  const n = Number.parseFloat((v ?? '').trim())
  return Number.isFinite(n) ? n : 0
}

export interface StepValidation {
  ok: boolean
  /** i18n keys (payments namespace) for each failing invariant. */
  errors: Array<{ key: string; params?: Record<string, unknown> }>
}

export function validateStep1(state: WizardState): StepValidation {
  const errors: StepValidation['errors'] = []
  if (!state.title.trim()) errors.push({ key: 'agreement.wizard.validation.titleRequired' })
  if (!state.payerName.trim())
    errors.push({ key: 'agreement.wizard.validation.payerRequired' })
  if (state.members.length === 0)
    errors.push({ key: 'agreement.wizard.validation.membersRequired' })
  if (state.members.length > MAX_AGREEMENT_STUDENTS)
    errors.push({ key: 'agreement.wizard.validation.tooManyStudents' })
  return { ok: errors.length === 0, errors }
}

export function validateStep2(state: WizardState): StepValidation {
  const errors: StepValidation['errors'] = []

  if (state.coveredFeeTypes.filter((f) => f.trim()).length === 0)
    errors.push({ key: 'agreement.wizard.validation.feeTypesRequired' })

  if (!state.effectiveFrom || !state.effectiveTo)
    errors.push({ key: 'agreement.wizard.validation.datesRequired' })
  else if (state.effectiveTo <= state.effectiveFrom)
    errors.push({ key: 'agreement.wizard.validation.dateOrder' })

  if (state.agreementType === 'fixed_total') {
    const total = parseAmount(state.totalAmount)
    if (total <= 0)
      errors.push({ key: 'agreement.wizard.validation.totalRequired' })

    const covered = state.members.every(
      (m) => (state.allocation[m.studentId] ?? '').trim() !== '',
    )
    if (!covered)
      errors.push({ key: 'agreement.wizard.validation.allocationCoverage' })

    const sum = state.members.reduce(
      (acc, m) => acc + parseAmount(state.allocation[m.studentId]),
      0,
    )
    // Only flag a mismatch once a total is set and every member has a value —
    // otherwise the coverage/total errors already tell the operator what to fix.
    if (total > 0 && covered && Math.abs(sum - total) > 0.001)
      errors.push({
        key: 'agreement.wizard.validation.allocationSum',
        params: { sum, total },
      })
  } else {
    const allSet = state.members.every(
      (m) => parseAmount(state.lines[m.studentId]?.amount) > 0,
    )
    if (!allSet)
      errors.push({ key: 'agreement.wizard.validation.linesRequired' })
  }

  return { ok: errors.length === 0, errors }
}

/** Build the CreateAgreementDto from a fully-validated wizard state. */
export function buildCreateDto(state: WizardState): CreateAgreementDto {
  const studentIds = state.members.map((m) => m.studentId)
  const coveredFeeTypes = state.coveredFeeTypes
    .map((f) => f.trim())
    .filter(Boolean)

  const terms: AgreementTerms =
    state.agreementType === 'fixed_total'
      ? {
          agreementType: 'fixed_total',
          totalAmount: parseAmount(state.totalAmount),
          allocation: state.members.map((m) => ({
            studentId: m.studentId,
            amount: parseAmount(state.allocation[m.studentId]),
          })),
        }
      : {
          agreementType: 'per_student',
          lines: state.members.map((m) => {
            const line = state.lines[m.studentId]
            const feeType = line?.feeType?.trim()
            return {
              studentId: m.studentId,
              amount: parseAmount(line?.amount),
              ...(feeType ? { feeType } : {}),
            }
          }),
        }

  return {
    title: state.title.trim(),
    payer: {
      name: state.payerName.trim(),
      ...(state.payerPhone.trim() ? { phone: state.payerPhone.trim() } : {}),
      ...(state.payerEmail.trim() ? { email: state.payerEmail.trim() } : {}),
    },
    studentIds,
    agreementType: state.agreementType,
    terms,
    coveredFeeTypes,
    billingFrequency: state.billingFrequency,
    effectiveFrom: state.effectiveFrom,
    effectiveTo: state.effectiveTo,
    ...(state.familyId.trim() ? { familyId: state.familyId.trim() } : {}),
  }
}
