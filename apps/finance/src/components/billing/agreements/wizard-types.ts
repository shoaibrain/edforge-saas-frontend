/**
 * AgreementCreateWizard — shared state shape + client-side invariant checks.
 *
 * The validation mirrors the backend `createBillingAgreementSchema`
 * superRefine (shared-types finance/billing-agreement.schema.ts) so operators
 * get immediate feedback before the 400:
 *   - fixed_total: allocations strictly positive, sum == total (±0.01 — the
 *     backend tolerance), every member allocated
 *   - per_student: a strictly-positive line for EVERY (member × covered
 *     feeType) pair — the F1 completeness invariant — capped at 300 lines
 *   - ≤30 students, ≥1 covered fee type, strict effectiveFrom < effectiveTo
 */

import type {
  AgreementType,
  CreateAgreementDto,
  AgreementTerms,
  FeeType,
  FeeFrequency,
} from '@edforge/types'

/** Max students an agreement may cover (backend invariant). */
export const MAX_AGREEMENT_STUDENTS = 30
/** Max per_student lines (backend invariant: 30 students × 10 fee types). */
export const MAX_AGREEMENT_LINES = 300
/** Allocation-sum tolerance — matches the backend's ±0.01 (SPEC-14). */
export const AMOUNT_SUM_TOLERANCE = 0.01
export const MAX_TITLE_LENGTH = 160
export const MAX_PAYER_NAME_LENGTH = 120
export const MAX_PAYER_PHONE_LENGTH = 20
export const MAX_NOTES_LENGTH = 500

/** The backend feeFrequencyEnum, monthly-first for the operator default. */
export const BILLING_FREQUENCIES: FeeFrequency[] = [
  'monthly',
  'quarterly',
  'annual',
  'one_time',
]

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
  coveredFeeTypes: FeeType[]
  billingFrequency: FeeFrequency
  totalAmount: string
  /** studentId → amount string (fixed_total allocation). */
  allocation: Record<string, string>
  /**
   * `${studentId}|${feeType}` → amount string (per_student matrix). The
   * backend F1 invariant requires a line per (member × coveredFeeType) pair,
   * so the editor is a full matrix, not one line per student.
   */
  cells: Record<string, string>
  effectiveFrom: string
  effectiveTo: string
  notes: string
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
    cells: {},
    effectiveFrom: '',
    effectiveTo: '',
    notes: '',
  }
}

export function cellKey(studentId: string, feeType: string): string {
  return `${studentId}|${feeType}`
}

/**
 * Re-key the per_student matrix after members / coveredFeeTypes change:
 * stale cells are dropped, new pairs start empty, surviving values persist.
 */
export function pruneCells(
  cells: Record<string, string>,
  members: WizardMember[],
  coveredFeeTypes: FeeType[],
): Record<string, string> {
  const next: Record<string, string> = {}
  for (const member of members) {
    for (const feeType of coveredFeeTypes) {
      const key = cellKey(member.studentId, feeType)
      next[key] = cells[key] ?? ''
    }
  }
  return next
}

/** Parse a form amount string to a number (empty/NaN → 0). */
export function parseAmount(v: string | undefined): number {
  const n = Number.parseFloat((v ?? '').trim())
  return Number.isFinite(n) ? n : 0
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface StepValidation {
  ok: boolean
  /** i18n keys (payments namespace) for each failing invariant. */
  errors: Array<{ key: string; params?: Record<string, unknown> }>
}

export function validateStep1(state: WizardState): StepValidation {
  const errors: StepValidation['errors'] = []
  if (!state.title.trim()) errors.push({ key: 'agreement.wizard.validation.titleRequired' })
  else if (state.title.trim().length > MAX_TITLE_LENGTH)
    errors.push({ key: 'agreement.wizard.validation.titleMax' })
  if (!state.payerName.trim())
    errors.push({ key: 'agreement.wizard.validation.payerRequired' })
  else if (state.payerName.trim().length > MAX_PAYER_NAME_LENGTH)
    errors.push({ key: 'agreement.wizard.validation.payerNameMax' })
  if (state.payerPhone.trim().length > MAX_PAYER_PHONE_LENGTH)
    errors.push({ key: 'agreement.wizard.validation.payerPhoneMax' })
  if (state.payerEmail.trim() && !EMAIL_PATTERN.test(state.payerEmail.trim()))
    errors.push({ key: 'agreement.wizard.validation.payerEmailInvalid' })
  if (state.familyId.trim() && !UUID_PATTERN.test(state.familyId.trim()))
    errors.push({ key: 'agreement.wizard.validation.familyIdInvalid' })
  if (state.members.length === 0)
    errors.push({ key: 'agreement.wizard.validation.membersRequired' })
  if (state.members.length > MAX_AGREEMENT_STUDENTS)
    errors.push({ key: 'agreement.wizard.validation.tooManyStudents' })
  return { ok: errors.length === 0, errors }
}

export function validateStep2(state: WizardState): StepValidation {
  const errors: StepValidation['errors'] = []

  if (state.coveredFeeTypes.length === 0)
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

    // Backend allocation amounts are strictly positive — a zero splits into
    // a 400, so flag it here.
    const allPositive = state.members.every(
      (m) =>
        (state.allocation[m.studentId] ?? '').trim() === '' ||
        parseAmount(state.allocation[m.studentId]) > 0,
    )
    if (!allPositive)
      errors.push({ key: 'agreement.wizard.validation.allocationPositive' })

    const sum = state.members.reduce(
      (acc, m) => acc + parseAmount(state.allocation[m.studentId]),
      0,
    )
    // Only flag a mismatch once a total is set and every member has a value —
    // otherwise the coverage/total errors already tell the operator what to fix.
    if (total > 0 && covered && Math.abs(sum - total) > AMOUNT_SUM_TOLERANCE)
      errors.push({
        key: 'agreement.wizard.validation.allocationSum',
        params: { sum, total },
      })
  } else {
    // F1 completeness: every (member × coveredFeeType) cell must carry a
    // strictly positive amount.
    const complete =
      state.coveredFeeTypes.length > 0 &&
      state.members.every((m) =>
        state.coveredFeeTypes.every(
          (ft) => parseAmount(state.cells[cellKey(m.studentId, ft)]) > 0,
        ),
      )
    if (!complete)
      errors.push({ key: 'agreement.wizard.validation.matrixRequired' })

    if (state.members.length * state.coveredFeeTypes.length > MAX_AGREEMENT_LINES)
      errors.push({ key: 'agreement.wizard.validation.tooManyLines' })
  }

  return { ok: errors.length === 0, errors }
}

/** Build the CreateAgreementDto from a fully-validated wizard state. */
export function buildCreateDto(
  state: WizardState,
  currency: string,
): CreateAgreementDto {
  const studentIds = state.members.map((m) => m.studentId)

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
          // The full studentIds × coveredFeeTypes matrix (backend F1).
          lines: state.members.flatMap((m) =>
            state.coveredFeeTypes.map((feeType) => ({
              studentId: m.studentId,
              feeType,
              amount: parseAmount(state.cells[cellKey(m.studentId, feeType)]),
            })),
          ),
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
    coveredFeeTypes: state.coveredFeeTypes,
    billingFrequency: state.billingFrequency,
    currency,
    effectiveFrom: state.effectiveFrom,
    effectiveTo: state.effectiveTo,
    ...(state.notes.trim() ? { notes: state.notes.trim() } : {}),
    ...(state.familyId.trim() ? { familyId: state.familyId.trim() } : {}),
  }
}
