/**
 * #363 — the summary panel and the wizard footer must describe the same batch.
 *
 * The footer renders the server's `eligibleCount` verbatim
 * (BulkGenerateWizard.tsx `footerInfo`). The panel used to render
 * `computeBatch(...).perStudent`, which counts and prices every selected
 * student — including the ones the server has already decided not to bill.
 * The two numbers had no reason to agree, and on the live reproduction they
 * did not: a NPR 20,000 batch quoted from exactly the students the server
 * rejects, beside a footer offering three invoices that were not those.
 *
 * The fixtures below are the live reproduction from the issue: five students,
 * two of them blocked by the once-per-term agreement guard, three whose grades
 * no selected fee applies to.
 *
 * Render assertions on purpose — `compute.ts` is well covered for numbers, and
 * the whole defect is that a well-computed number was attached to the wrong
 * set of students on screen.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { UseQueryResult } from '@tanstack/react-query'
import type { BulkPreviewResponse } from '@edforge/finance-services'

vi.mock('@edforge/i18n', () => ({
  useTranslation: () => ({
    t: (k: string, o?: Record<string, unknown>) =>
      o && 'count' in o ? `${k}:${o.count}` : k,
    i18n: { language: 'en' },
  }),
  normalizePlatformLanguage: (l: string) => l,
}))

vi.mock('../../../../layouts/FinanceLayout', () => ({
  useFinanceSettings: () => ({
    currency: 'NPR',
    calendarSystem: 'gregorian',
    enableDualDateDisplay: false,
  }),
  useFinanceSettingsReady: () => true,
}))

vi.mock('@edforge/types/use-currency', () => ({
  useCurrency: () => ({
    format: (n: number) => `NPR ${n.toLocaleString()}`,
    formatCompact: (n: number) => String(n),
  }),
}))

import { Step4Review } from '../Step4Review'

// --- the live reproduction ---------------------------------------------------
// Two grade-scoped tuition fees; two siblings on a fixed-total agreement that
// already priced this term; three other students in grades neither fee covers.

const BLOCKED_A = 'stu-blocked-a'
const BLOCKED_B = 'stu-blocked-b'
const NOFIT_A = 'stu-nofit-a'
const NOFIT_B = 'stu-nofit-b'
const NOFIT_C = 'stu-nofit-c'

const feeFor = (id: string, grade: string, amount: number) => ({
  id,
  schoolId: 'school-1',
  name: `Grade ${grade} Annual School Fee`,
  amount,
  currency: 'NPR',
  feeType: 'tuition',
  frequency: 'annual',
  gradeLevels: [grade],
  taxRate: 0,
  isActive: true,
})

const studentFor = (studentId: string, fullName: string, grade: string) => ({
  studentId,
  fullName,
  currentGradeLevel: grade,
  status: 'active',
})

const reproStudents = [
  studentFor(BLOCKED_A, 'Blocked Sibling A', '2'),
  studentFor(BLOCKED_B, 'Blocked Sibling B', '3'),
  studentFor(NOFIT_A, 'Uncovered A', '9'),
  studentFor(NOFIT_B, 'Uncovered B', '9'),
  studentFor(NOFIT_C, 'Uncovered C', '5'),
] as never

const reproFees = [feeFor('fee-g2', '2', 10000), feeFor('fee-g3', '3', 10000)] as never

const reproPreviewStudents = [
  {
    studentId: BLOCKED_A,
    billingSource: 'agreement',
    suppressedFeeStructureIds: ['fee-g2'],
    agreementAmount: 10000,
    agreementBlocked: true,
  },
  {
    studentId: BLOCKED_B,
    billingSource: 'agreement',
    suppressedFeeStructureIds: ['fee-g3'],
    agreementAmount: 10000,
    agreementBlocked: true,
  },
] as never

function previewQuery(over: Partial<BulkPreviewResponse>): UseQueryResult<BulkPreviewResponse> {
  return {
    data: {
      studentCount: 5,
      eligibleCount: 0,
      duplicateCount: 0,
      studentsWithBalance: 0,
      studentsNewAdmission: 0,
      studentsNotBilledThisPeriod: 0,
      estimatedDurationSec: 2,
      students: [],
      ...over,
    },
    isLoading: false,
    isError: false,
    error: null,
  } as unknown as UseQueryResult<BulkPreviewResponse>
}

function renderStep(opts: {
  students?: unknown
  fees?: unknown
  selectedFees?: Record<string, true>
  skipZeroTotal?: boolean
  preview: Partial<BulkPreviewResponse>
}) {
  return render(
    <Step4Review
      students={(opts.students ?? reproStudents) as never}
      fees={(opts.fees ?? reproFees) as never}
      selectedFees={(opts.selectedFees ?? { 'fee-g2': true, 'fee-g3': true }) as never}
      customLines={[]}
      details={
        {
          academicYear: '2083-academic-year',
          billingPeriod: 'First Term',
          dueDate: '2026-08-15',
          notes: '',
          skipZeroTotal: opts.skipZeroTotal ?? false,
          showPreview: true,
        } as never
      }
      previewQuery={previewQuery(opts.preview)}
    />,
  )
}

/** Read the value cell of a summary-panel row by its label key. */
function panelValue(labelKey: string): string {
  const label = screen.getByText(labelKey)
  const row = label.parentElement as HTMLElement
  return (row.children[1] as HTMLElement).textContent ?? ''
}

describe('Step4Review — panel/footer count reconciliation (#363)', () => {
  it('counts the invoices the server says are eligible, not the ones it rejects', () => {
    // The footer renders exactly this number, so the panel must too.
    const eligibleCount = 0
    renderStep({
      preview: {
        eligibleCount,
        duplicateCount: 0,
        agreementBlockedCount: 2,
        noApplicableFeesCount: 3,
        students: reproPreviewStudents,
      },
    })

    expect(panelValue('bulkGenerate.step4.invoices')).toBe(String(eligibleCount))
    // The intro sentence above the summary card is the third place the same
    // number appeared, and it disagreed with both of the others.
    expect(screen.getByText(`bulkGenerate.step4.verifyIntro:${eligibleCount}.`)).toBeTruthy()
  })

  it('does not quote a grand total made of students the server rejects', () => {
    renderStep({
      preview: {
        eligibleCount: 0,
        duplicateCount: 0,
        agreementBlockedCount: 2,
        noApplicableFeesCount: 3,
        students: reproPreviewStudents,
      },
    })

    // The NPR 20,000 the operator used to confirm was the two agreement
    // students priced at their agreement amount. None of it is ever billed.
    expect(panelValue('bulkGenerate.step4.grandTotal')).toBe('NPR 0')
    expect(panelValue('bulkGenerate.step4.avgPerStudent')).toBe('NPR 0')
  })

  it('reconciles on a partly billable batch, and keeps the money to the billable rows', () => {
    const students = [
      studentFor('stu-blocked', 'Blocked Student', '3'),
      studentFor('stu-a', 'Billable A', '3'),
      studentFor('stu-b', 'Billable B', '3'),
    ] as never
    const fees = [feeFor('fee-g3', '3', 18000)] as never
    const eligibleCount = 2

    renderStep({
      students,
      fees,
      selectedFees: { 'fee-g3': true },
      preview: {
        studentCount: 3,
        eligibleCount,
        duplicateCount: 0,
        agreementBlockedCount: 1,
        noApplicableFeesCount: 0,
        students: [
          {
            studentId: 'stu-blocked',
            billingSource: 'agreement',
            suppressedFeeStructureIds: ['fee-g3'],
            agreementAmount: 12000,
            agreementBlocked: true,
          },
        ] as never,
      },
    })

    expect(panelValue('bulkGenerate.step4.invoices')).toBe(String(eligibleCount))
    expect(panelValue('bulkGenerate.step4.grandTotal')).toBe('NPR 36,000')
    expect(panelValue('bulkGenerate.step4.avgPerStudent')).toBe('NPR 18,000')
  })

  it('keeps the excluded agreement students on screen with their badge', () => {
    renderStep({
      preview: {
        eligibleCount: 0,
        duplicateCount: 0,
        agreementBlockedCount: 2,
        noApplicableFeesCount: 3,
        students: reproPreviewStudents,
      },
    })

    // Dropping them from the total must not drop them from the operator's
    // view — the badge is the only place the reason is named per student.
    expect(screen.getByText('Blocked Sibling A')).toBeTruthy()
    expect(screen.getByText('Blocked Sibling B')).toBeTruthy()
    expect(screen.getAllByText('bulkGenerate.step4.agreementBlockedBadge')).toHaveLength(2)
  })

  it('excludes an agreement-blocked student even when nothing was suppressed', () => {
    // The guard fires on the agreement having priced the term, not on the
    // operator having selected a fee the agreement covers. With no overlap
    // there is no suppression and no agreement amount — and the student is
    // still rejected at generation.
    const students = [
      studentFor('stu-blocked', 'Blocked Student', '3'),
      studentFor('stu-a', 'Billable A', '3'),
    ] as never
    const eligibleCount = 1

    renderStep({
      students,
      fees: [feeFor('fee-g3', '3', 18000)] as never,
      selectedFees: { 'fee-g3': true },
      preview: {
        studentCount: 2,
        eligibleCount,
        duplicateCount: 0,
        agreementBlockedCount: 1,
        noApplicableFeesCount: 0,
        students: [
          { studentId: 'stu-blocked', billingSource: 'standard', agreementBlocked: true },
        ] as never,
      },
    })

    expect(panelValue('bulkGenerate.step4.invoices')).toBe(String(eligibleCount))
    expect(panelValue('bulkGenerate.step4.grandTotal')).toBe('NPR 18,000')
  })

  it('reconciles with the zero-total skip on as well as off', () => {
    const eligibleCount = 0
    renderStep({
      skipZeroTotal: true,
      preview: {
        eligibleCount,
        duplicateCount: 0,
        agreementBlockedCount: 2,
        noApplicableFeesCount: 3,
        students: reproPreviewStudents,
      },
    })

    expect(panelValue('bulkGenerate.step4.invoices')).toBe(String(eligibleCount))
  })

  it('leaves the batch alone when the backend reports no such students', () => {
    // shoaibrain/edforge#477 is what makes the server skip these; against a
    // backend that reports none, the client must not invent the exclusion.
    // Five students, two agreement-blocked → the server's own eligibleCount.
    const eligibleCount = 3
    renderStep({
      preview: {
        eligibleCount,
        duplicateCount: 0,
        agreementBlockedCount: 2,
        noApplicableFeesCount: 0,
        students: reproPreviewStudents,
      },
    })

    expect(panelValue('bulkGenerate.step4.invoices')).toBe(String(eligibleCount))
  })

  it('leaves the batch alone when the backend omits the field entirely', () => {
    const eligibleCount = 3
    renderStep({
      preview: {
        eligibleCount,
        duplicateCount: 0,
        agreementBlockedCount: 2,
        students: reproPreviewStudents,
      },
    })

    expect(panelValue('bulkGenerate.step4.invoices')).toBe(String(eligibleCount))
  })
})

describe('Step4Review — no-applicable-fee row (#363)', () => {
  it('names the reason separately from duplicate skip and agreement blocked', () => {
    renderStep({
      preview: {
        eligibleCount: 0,
        duplicateCount: 0,
        agreementBlockedCount: 2,
        noApplicableFeesCount: 3,
        students: reproPreviewStudents,
      },
    })

    expect(screen.getByText('bulkGenerate.step4.noApplicableFees')).toBeTruthy()
    expect(screen.getByText('bulkGenerate.step4.agreementBlocked')).toBeTruthy()
    expect(screen.getByText('bulkGenerate.step4.duplicateSkip')).toBeTruthy()
  })

  it('reports the server count, not a client re-derivation', () => {
    renderStep({
      preview: {
        eligibleCount: 0,
        duplicateCount: 0,
        agreementBlockedCount: 2,
        noApplicableFeesCount: 3,
        students: reproPreviewStudents,
      },
    })

    const label = screen.getByText('bulkGenerate.step4.noApplicableFees')
    const row = label.parentElement as HTMLElement
    expect((row.children[1] as HTMLElement).textContent).toBe('3')
  })

  it('stays out of the way when the count is zero', () => {
    renderStep({
      preview: { eligibleCount: 3, duplicateCount: 0, noApplicableFeesCount: 0 },
    })
    expect(screen.queryByText('bulkGenerate.step4.noApplicableFees')).toBeNull()
  })

  it('is absent when the backend omits the field entirely', () => {
    renderStep({ preview: { eligibleCount: 3, duplicateCount: 0 } })
    expect(screen.queryByText('bulkGenerate.step4.noApplicableFees')).toBeNull()
  })
})
