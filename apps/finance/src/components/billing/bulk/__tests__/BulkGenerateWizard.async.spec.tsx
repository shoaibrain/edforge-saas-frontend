/**
 * Sprint E.5 — wizard async-submit UX.
 *
 * Validates the four user-visible behaviour changes layered on top of the
 * sync-only Sprint C wizard:
 *
 *   1. Mutation returning { mode: 'async', jobId } stashes jobId and
 *      switches the wizard into in-progress mode (AsyncJobProgress).
 *
 *   2. Job polling reaching status='succeeded' renders AsyncGenerateSuccess
 *      with the JOB's counters (not a client-side projection).
 *
 *   3. studentCount > 100 routes submit through a confirmation modal;
 *      cancel-from-modal does NOT dispatch the mutation; confirm-from-modal
 *      dispatches the same DTO the inline submit would have.
 *
 *   4. "Run in background" on the progress view calls onComplete (which the
 *      parent uses to navigate away). Polling subscription drops when the
 *      wizard unmounts — this is the documented Sprint E.5 limitation.
 *
 * The wizard composes 4 step components, a settings context, several React
 * Query hooks, and a toast lib — mocking the child Step* components and
 * the data hooks lets the test drive submit-time behaviour directly
 * without simulating four wizard pages of operator UI.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, cleanup, render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

// ---- Mock the step components to expose simple deterministic UI ----------
//
// The real Step1Recipients drives selection via a dense student/grade
// picker. For the async-branch test we don't care HOW the selection got
// populated — only that the wizard's submit/render branches behave
// correctly given a selection. The mock exposes "select N" buttons.

vi.mock('../Step1Recipients', () => ({
  Step1Recipients: ({ selection, setSelection }: any) => (
    <div data-testid="step-1">
      <button
        type="button"
        data-testid="select-1-student"
        onClick={() =>
          setSelection({
            ...selection,
            selectedIds: new Set(['s-1']),
          })
        }
      >
        Select 1
      </button>
      <button
        type="button"
        data-testid="select-150-students"
        onClick={() => {
          const ids = new Set<string>()
          for (let i = 0; i < 150; i++) ids.add(`s-${i}`)
          setSelection({ ...selection, selectedIds: ids })
        }}
      >
        Select 150
      </button>
      <div data-testid="selected-count">{selection.selectedIds.size}</div>
    </div>
  ),
}))

vi.mock('../Step2FeeStructures', () => ({
  Step2FeeStructures: ({ setSelectedFees }: any) => (
    <div data-testid="step-2">
      <button
        type="button"
        data-testid="select-fee"
        onClick={() => setSelectedFees({ 'fee-1': true })}
      >
        Pick fee
      </button>
    </div>
  ),
}))

vi.mock('../Step3InvoiceDetails', () => ({
  Step3InvoiceDetails: ({ setDetails, details }: any) => (
    <div data-testid="step-3">
      <button
        type="button"
        data-testid="set-defaults"
        onClick={() =>
          setDetails({
            ...details,
            academicYear: '2026-27',
            dueDate: '2026-08-15',
          })
        }
      >
        Set details
      </button>
    </div>
  ),
}))

vi.mock('../Step4Review', () => ({
  Step4Review: () => <div data-testid="step-4">Review</div>,
}))

vi.mock('@edforge/i18n', () => {
  const messages: Record<string, string> = {
    'actions.cancel': 'Cancel',
    'actions.back': 'Back',
    'actions.next': 'Next',
    'actions.close': 'Close',
    'bulkGenerate.steps.selectRecipients': 'Select recipients',
    'bulkGenerate.steps.feeStructures': 'Fee structures',
    'bulkGenerate.steps.invoiceDetails': 'Invoice details',
    'bulkGenerate.steps.reviewConfirm': 'Review & confirm',
    'bulkGenerate.actions.generating': 'Generating...',
    'bulkGenerate.actions.generateInvoices': 'Generate invoices',
    'bulkGenerate.footer.studentsSelected': '{{count}} students selected',
    'bulkGenerate.footer.lineItemsAndStudents': '{{lineCount}} {{lineLabel}} · {{studentCount}} {{studentLabel}}',
    'bulkGenerate.footer.invoicesConfigured': '{{count}} invoices will be configured',
    'bulkGenerate.footer.readyToGenerate': 'Ready to generate {{count}} invoices',
    'bulkGenerate.common.lineItem': 'line item',
    'bulkGenerate.common.lineItem_plural': 'line items',
    'bulkGenerate.common.student': 'student',
    'bulkGenerate.common.student_plural': 'students',
    'bulkGenerate.confirm.title': 'Generate invoices?',
    'bulkGenerate.confirm.description': 'Generate {{count}} invoices? This cannot be undone.',
    'bulkGenerate.confirm.body': 'Invoices for {{count}} students will be created as drafts. You can review and issue them from the invoices list.',
    'bulkGenerate.confirm.generateCount': 'Generate {{count}}',
    'bulkGenerate.async.inProgressTitle': 'Generating invoices...',
    'bulkGenerate.async.runningDescription': 'Creating draft invoices for {{count}} students. This typically completes in under 90 seconds.',
    'bulkGenerate.async.progressVerb': 'Generating invoices',
    'bulkGenerate.async.runInBackground': 'Run in background',
    'bulkGenerate.async.toastSucceeded': '{{count}} draft invoices created',
    'bulkGenerate.async.toastSkipped': '{{count}} skipped',
    'bulkGenerate.async.toastFailed': '{{count}} failed',
    'bulkGenerate.asyncSuccess.title': '{{count}} invoices created as drafts',
    'bulkGenerate.asyncSuccess.periodNotice': 'For {{billingPeriod}}. Click Issue on each invoice, or use bulk-issue, to send them to families.',
    'bulkGenerate.asyncSuccess.created': 'Created',
    'bulkGenerate.asyncSuccess.skipped': 'Skipped',
    'bulkGenerate.asyncSuccess.failed': 'Failed',
    'bulkGenerate.asyncSuccess.retryFailed': 'Retry failed ({{count}})',
    'bulkGenerate.asyncSuccess.failureCount': '{{count}} failures',
    'bulkGenerate.asyncSuccess.showingFirst': '(showing first {{count}})',
    'bulkGenerate.success.newBatch': 'New batch',
    'bulkGenerate.toast.generated': '{{count}} invoices generated',
    'bulkGenerate.toast.generatedWithSkipped': '{{count}} invoices generated · {{skipped}} skipped',
    'bulkGenerate.toast.syncLimitExceeded': 'Too many students (>25) for synchronous generation. For now, narrow the selection or pick a single grade and try again.',
    'bulkGenerate.toast.failed': 'Bulk generation failed.',
  }

  return {
    useTranslation: () => ({
      t: (key: string, options?: Record<string, unknown>) => {
        let value = messages[key] ?? key
        for (const [token, replacement] of Object.entries(options ?? {})) {
          value = value.replaceAll(`{{${token}}}`, String(replacement))
        }
        return value
      },
    }),
  }
})

// ---- Mock the data hooks ------------------------------------------------
//
// vi.hoisted() lets the mock factory reach state defined in the spec file
// itself — vi.mock() runs before the file body, so a top-level
// `const fn = vi.fn()` referenced inside the factory throws
// `Cannot access ... before initialization`. The hoisted block runs in the
// same hoisted phase as vi.mock, so its bindings are available.

const { generateMutate, generateMutationState, useAsyncBulkJobMock, toastSuccess, toastError } =
  vi.hoisted(() => {
    const generateMutate = vi.fn()
    return {
      generateMutate,
      generateMutationState: { isPending: false, mutate: generateMutate },
      useAsyncBulkJobMock: vi.fn(),
      toastSuccess: vi.fn(),
      toastError: vi.fn(),
    }
  })

vi.mock('@edforge/finance-services', async () => {
  const actual = await vi.importActual<any>('@edforge/finance-services')
  return {
    ...actual,
    useEnrolledStudents: () => ({
      data: [
        { studentId: 's-1', firstName: 'A', lastName: 'B', fullName: 'A B', currentGradeLevel: '1', status: 'active' },
      ],
      isLoading: false,
    }),
    useFeeStructures: () => ({
      data: [
        { id: 'fee-1', name: 'Tuition', amount: 1000, applicableGrades: [] },
      ],
      isLoading: false,
    }),
    useAcademicYears: () => ({
      data: [{ name: '2026-27' }],
      isLoading: false,
    }),
    useBulkGenerateInvoices: () => generateMutationState,
    useBulkPreview: () => ({
      data: { studentCount: 1, eligibleCount: 1, duplicateCount: 0, estimatedDurationSec: 1 },
      isLoading: false,
      isFetching: false,
    }),
    useAsyncBulkJob: (...args: unknown[]) => useAsyncBulkJobMock(...args),
  }
})

vi.mock('sonner', () => ({
  toast: { success: toastSuccess, error: toastError },
}))

import { BulkGenerateWizard } from '../BulkGenerateWizard'

function wrap(children: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

function advanceToStep4() {
  fireEvent.click(screen.getByTestId('select-1-student'))
  fireEvent.click(screen.getByText(/^Next/))
  fireEvent.click(screen.getByTestId('select-fee'))
  fireEvent.click(screen.getByText(/^Next/))
  fireEvent.click(screen.getByTestId('set-defaults'))
  fireEvent.click(screen.getByText(/^Next/))
}

function advanceWithLargeSelection() {
  fireEvent.click(screen.getByTestId('select-150-students'))
  fireEvent.click(screen.getByText(/^Next/))
  fireEvent.click(screen.getByTestId('select-fee'))
  fireEvent.click(screen.getByText(/^Next/))
  fireEvent.click(screen.getByTestId('set-defaults'))
  fireEvent.click(screen.getByText(/^Next/))
}

beforeEach(() => {
  // Use mockReset to clear BOTH call history and any mockReturnValue from
  // the prior test — vi.clearAllMocks() only clears history.
  generateMutate.mockReset()
  useAsyncBulkJobMock.mockReset()
  toastSuccess.mockReset()
  toastError.mockReset()
  // Default — no in-flight job. Tests override via mockReturnValueOnce.
  useAsyncBulkJobMock.mockReturnValue({ data: undefined })
})

// The finance app's vitest config doesn't ship global auto-cleanup, so
// previous-test DOM persists into the next test's render unless we
// explicitly unmount.
afterEach(() => {
  cleanup()
})

describe('BulkGenerateWizard — Sprint E.5 async-submit branching', () => {
  it('mutation returning { mode: "async", jobId } switches to in-progress view', () => {
    // Arrange — capture the onSuccess passed to mutate() so we can fire it
    // with the async-shaped response.
    let capturedOnSuccess: ((res: any) => void) | undefined
    generateMutate.mockImplementation((_dto, opts) => {
      capturedOnSuccess = opts?.onSuccess
    })
    // First render — no job. Subsequent render after setAsyncJobId — running.
    useAsyncBulkJobMock
      .mockReturnValueOnce({ data: undefined })
      .mockReturnValue({
        data: {
          jobId: 'job-1',
          status: 'running',
          totalRecords: 1,
          succeeded: 0,
          failed: 0,
          skipped: 0,
          createdAt: '2026-06-28T00:00:00.000Z',
          updatedAt: '2026-06-28T00:00:00.000Z',
        },
      })

    render(wrap(<BulkGenerateWizard schoolId="sch-1" />))
    advanceToStep4()
    fireEvent.click(screen.getByText(/Generate invoices/))

    // Act — fire the async-result the mutation would have resolved with.
    act(() => {
      capturedOnSuccess?.({ mode: 'async', jobId: 'job-1' })
    })

    // Assert — wizard switches to in-progress view; AsyncJobProgress renders.
    // "Generating invoices" appears in both the wizard h2 and the
    // AsyncJobProgress card's verbingNoun, so use getAllByText.
    expect(screen.getAllByText(/Generating invoices/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Run in background/)).toBeInTheDocument()
  })

  it('async job transitioning to succeeded renders AsyncGenerateSuccess with job counters', () => {
    let capturedOnSuccess: ((res: any) => void) | undefined
    generateMutate.mockImplementation((_dto, opts) => {
      capturedOnSuccess = opts?.onSuccess
    })
    useAsyncBulkJobMock
      .mockReturnValueOnce({ data: undefined })
      .mockReturnValue({
        data: {
          jobId: 'job-1',
          status: 'succeeded',
          totalRecords: 7,
          succeeded: 5,
          failed: 1,
          skipped: 1,
          failures: [{ recordId: 's-99', reason: 'duplicate invoice' }],
          createdAt: '2026-06-28T00:00:00.000Z',
          updatedAt: '2026-06-28T00:00:00.000Z',
        },
      })

    render(wrap(<BulkGenerateWizard schoolId="sch-1" />))
    advanceToStep4()
    fireEvent.click(screen.getByText(/Generate invoices/))
    act(() => {
      capturedOnSuccess?.({ mode: 'async', jobId: 'job-1' })
    })

    // AsyncGenerateSuccess copy — draft state by design.
    expect(screen.getByText(/5 invoices created as drafts/i)).toBeInTheDocument()
    // Per-record failure shown.
    expect(screen.getByText(/duplicate invoice/)).toBeInTheDocument()
    // Retry-failed button gated on failures sample being non-empty.
    expect(screen.getByText(/Retry failed \(1\)/)).toBeInTheDocument()
    // Toast for terminal-succeeded with failures present uses error variant.
    expect(toastError).toHaveBeenCalled()
  })

  it('Run in background button calls onComplete', () => {
    const onComplete = vi.fn()
    let capturedOnSuccess: ((res: any) => void) | undefined
    generateMutate.mockImplementation((_dto, opts) => {
      capturedOnSuccess = opts?.onSuccess
    })
    useAsyncBulkJobMock
      .mockReturnValueOnce({ data: undefined })
      .mockReturnValue({
        data: {
          jobId: 'job-1',
          status: 'running',
          totalRecords: 1,
          succeeded: 0,
          failed: 0,
          skipped: 0,
          createdAt: '2026-06-28T00:00:00.000Z',
          updatedAt: '2026-06-28T00:00:00.000Z',
        },
      })

    render(wrap(<BulkGenerateWizard schoolId="sch-1" onComplete={onComplete} />))
    advanceToStep4()
    fireEvent.click(screen.getByText(/Generate invoices/))
    act(() => {
      capturedOnSuccess?.({ mode: 'async', jobId: 'job-1' })
    })

    fireEvent.click(screen.getByText(/Run in background/))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('studentCount > 100 routes submit through the confirmation modal', () => {
    render(wrap(<BulkGenerateWizard schoolId="sch-1" />))
    advanceWithLargeSelection()
    fireEvent.click(screen.getByText(/Generate invoices/))

    // Mutation NOT dispatched yet — gated behind confirmation.
    expect(generateMutate).not.toHaveBeenCalled()
    // Confirm modal copy.
    expect(
      screen.getByText(/Generate 150 invoices\? This cannot be undone\./),
    ).toBeInTheDocument()
  })

  it('confirmation modal Cancel button dismisses without dispatching', () => {
    render(wrap(<BulkGenerateWizard schoolId="sch-1" />))
    advanceWithLargeSelection()
    fireEvent.click(screen.getByText(/Generate invoices/))

    // The modal renders Cancel + Generate buttons. Click Cancel.
    const buttons = screen.getAllByRole('button', { name: /Cancel/ })
    fireEvent.click(buttons[buttons.length - 1])

    expect(generateMutate).not.toHaveBeenCalled()
  })

  it('confirmation modal Generate dispatches the same DTO', () => {
    render(wrap(<BulkGenerateWizard schoolId="sch-1" />))
    advanceWithLargeSelection()
    fireEvent.click(screen.getByText(/Generate invoices/))

    fireEvent.click(screen.getByRole('button', { name: /Generate 150/ }))

    expect(generateMutate).toHaveBeenCalledTimes(1)
    const [dto] = generateMutate.mock.calls[0]
    expect(dto.selectionMode).toBe('students')
    expect(dto.studentIds).toHaveLength(150)
    expect(dto.feeStructureIds).toEqual(['fee-1'])
    expect(dto.academicYear).toBe('2026-27')
  })

  it('studentCount ≤ 100 submits inline (no confirmation modal)', () => {
    render(wrap(<BulkGenerateWizard schoolId="sch-1" />))
    advanceToStep4()
    fireEvent.click(screen.getByText(/Generate invoices/))

    expect(generateMutate).toHaveBeenCalledTimes(1)
    // No modal text.
    expect(
      screen.queryByText(/This cannot be undone/),
    ).not.toBeInTheDocument()
  })
})
