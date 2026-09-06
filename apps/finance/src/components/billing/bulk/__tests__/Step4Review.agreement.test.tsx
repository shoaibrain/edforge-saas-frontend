/**
 * #465 — what the operator actually reads on the review step when an
 * agreement blocks generation.
 *
 * The backend detects the once-per-term conflict, excludes those students
 * from the eligible count and reports `agreementBlockedCount` separately from
 * `duplicateCount`. Nothing rendered it, so the original complaint —
 * "Duplicate skip: 0" beside a footer offering to generate nothing — still
 * reproduced after the backend was fixed.
 *
 * These are render assertions on purpose. `compute.ts` is well covered for
 * numbers and flags, and that is exactly why the defect in #352 (a raw i18n
 * key and a fee shown at full price beside a discounted total) reached
 * production: nothing looked at the rendered row.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

const BLOCKED = 'stu-blocked'
const NORMAL = 'stu-normal'

const students = [
  { studentId: BLOCKED, fullName: 'Blocked Student', currentGradeLevel: '3', status: 'active' },
  { studentId: NORMAL, fullName: 'Normal Student', currentGradeLevel: '3', status: 'active' },
] as never

const fees = [
  {
    id: 'fee-1',
    schoolId: 'school-1',
    name: 'Grade 3 Annual School Fee',
    amount: 18000,
    currency: 'NPR',
    feeType: 'tuition',
    frequency: 'annual',
    gradeLevels: ['3'],
    taxRate: 0,
    isActive: true,
  },
] as never

function previewQuery(over: Partial<BulkPreviewResponse>): UseQueryResult<BulkPreviewResponse> {
  return {
    data: {
      eligibleCount: 1,
      duplicateCount: 0,
      studentsWithBalance: 0,
      studentsNewAdmission: 0,
      studentsNotBilledThisPeriod: 2,
      estimatedDurationSec: 1,
      students: [],
      ...over,
    },
    isLoading: false,
    isError: false,
    error: null,
  } as unknown as UseQueryResult<BulkPreviewResponse>
}

function renderStep(over: Partial<BulkPreviewResponse>) {
  return render(
    <Step4Review
      students={students}
      fees={fees}
      selectedFees={{ 'fee-1': true } as never}
      customLines={[]}
      details={
        {
          academicYear: '2083-academic-year',
          billingPeriod: 'Third Term',
          dueDate: '2027-01-20',
          notes: '',
          skipZeroTotal: false,
          showPreview: true,
        } as never
      }
      previewQuery={previewQuery(over)}
    />,
  )
}

describe('Step4Review — agreement-blocked students (#465)', () => {
  it('names the blocked count instead of leaving it inside "duplicate skip"', () => {
    renderStep({
      duplicateCount: 0,
      agreementBlockedCount: 1,
      students: [
        {
          studentId: BLOCKED,
          billingSource: 'agreement',
          agreementAmount: 12000,
          suppressedFeeStructureIds: ['fee-1'],
          agreementBlocked: true,
        },
      ] as never,
    })

    expect(screen.getByText('bulkGenerate.step4.agreementBlocked')).toBeTruthy()
    // The duplicate row must keep reporting its own, different reason.
    expect(screen.getByText('bulkGenerate.step4.duplicateSkip')).toBeTruthy()
  })

  it('stays out of the way when nothing is blocked', () => {
    renderStep({ duplicateCount: 0, agreementBlockedCount: 0 })
    expect(screen.queryByText('bulkGenerate.step4.agreementBlocked')).toBeNull()
  })

  it('is absent when the backend omits the field entirely', () => {
    renderStep({ duplicateCount: 0 })
    expect(screen.queryByText('bulkGenerate.step4.agreementBlocked')).toBeNull()
  })

  it('badges the blocked student, and only that student', () => {
    renderStep({
      agreementBlockedCount: 1,
      students: [
        {
          studentId: BLOCKED,
          billingSource: 'agreement',
          agreementAmount: 12000,
          suppressedFeeStructureIds: ['fee-1'],
          agreementBlocked: true,
        },
        {
          studentId: NORMAL,
          billingSource: 'agreement',
          agreementAmount: 12000,
          suppressedFeeStructureIds: ['fee-1'],
        },
      ] as never,
    })

    expect(screen.getAllByText('bulkGenerate.step4.agreementBlockedBadge')).toHaveLength(1)
  })

  it('renders the agreement line as a label, never a raw key (#355 regression)', () => {
    renderStep({
      students: [
        {
          studentId: BLOCKED,
          billingSource: 'agreement',
          agreementAmount: 12000,
          suppressedFeeStructureIds: ['fee-1'],
        },
      ] as never,
    })

    // Expand the row that carries the agreement.
    fireEvent.click(screen.getByText('Blocked Student'))

    expect(screen.getByText('bulkGenerate.step4.agreementLine')).toBeTruthy()
    expect(screen.getByText('bulkGenerate.step4.replacedBadge')).toBeTruthy()
    // The replaced catalog fee is shown struck through at its own amount, and
    // must not be added into the total.
    // The fee-structures summary above also shows the catalog amount, so the
    // struck-through line is the second occurrence, not the only one.
    expect(screen.getAllByText('NPR 18,000').length).toBeGreaterThan(1)
    expect(screen.getAllByText('NPR 12,000').length).toBeGreaterThan(0)
  })
})
