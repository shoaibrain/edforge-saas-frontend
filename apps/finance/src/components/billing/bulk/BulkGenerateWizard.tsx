/**
 * BulkGenerateWizard — top-level shell + state container.
 *
 * Replaces the old single-file `BulkInvoiceForm.tsx`. Implements the
 * operator-validated prototype from claude.ai/design (project
 * `019de553-4cad-797c-83c1-fc706ec63fac` → file `Bulk Generate Invoices.html`)
 * per .claude/plans/finance-module-bulk-mighty-honey.md §5b Phase 1 scope.
 *
 * Sprint E.5 — wires the async worker branch on bulk-generate. The BE
 * returns 200 + counters when studentCount ≤ 25 (sync path; existing
 * behavior), or 202 + jobId when studentCount > 25 OR caller opted in
 * with ?async=true. The async branch creates DRAFT invoices (operator-
 * review by design); the wizard polls via `useAsyncBulkJob` until terminal
 * and surfaces success / failure summaries built from the job's counters.
 *
 * Owns:
 *   - selection state (recipient set + segment chips + mode)
 *   - selectedFees + customLines + wizard details
 *   - step navigation + maxReachedStep
 *   - the bulk-generate mutation + the bulk-preview query (gated to Step 4)
 *   - sync result (success screen)
 *   - async jobId + polling state (Sprint E.5)
 *   - studentCount > 100 confirmation modal
 *
 * Renders one Step* component at a time + Stepper + nav footer.
 */

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  X,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { Button, Modal, ModalFooter } from '@edforge/ui'
import {
  useEnrolledStudents,
  useBulkGenerateInvoices,
  useFeeStructures,
  useAcademicYears,
  useBulkPreview,
  useAsyncBulkJob,
} from '@edforge/finance-services'
import type {
  BulkGenerateInvoiceDto,
  BulkGenerateResult,
} from '@edforge/finance-services'
import { Step1Recipients } from './Step1Recipients'
import { Step2FeeStructures } from './Step2FeeStructures'
import { Step3InvoiceDetails } from './Step3InvoiceDetails'
import { Step4Review } from './Step4Review'
import { GenerateSuccess, type GenerateResult } from './GenerateSuccess'
import { AsyncGenerateSuccess } from './AsyncGenerateSuccess'
import { AsyncJobProgress } from '../AsyncJobProgress'
import {
  emptySelection,
  defaultDetails,
  WIZARD_STEP_LABELS,
  type SelectedFeesMap,
  type CustomLine,
  type WizardDetails,
  type WizardStep,
  type SelectionState,
} from './types'
import {
  buildNumberPreview,
  resolveDiscounts,
  resolveCustomLineItems,
  computeBatch,
} from './compute'

/**
 * Operator-protection threshold from the plan §3 C.5: any bulk-generate
 * touching more than this many students gets a confirmation modal so the
 * operator can back out. Applies to BOTH sync and async paths defensively
 * (sync is capped at 25 today, so in practice this only fires on async).
 */
export const BULK_GENERATE_CONFIRM_THRESHOLD = 100

export interface BulkGenerateWizardProps {
  schoolId: string
  /** Operator-facing school short-code for the invoice-number prefix preview. */
  schoolCode?: string
  onComplete?: () => void
  onCancel?: () => void
}

export function BulkGenerateWizard({
  schoolId,
  schoolCode,
  onComplete,
  onCancel,
}: BulkGenerateWizardProps) {
  // ---- Data sources --------------------------------------------------------
  const studentsQuery = useEnrolledStudents(schoolId)
  const feesQuery = useFeeStructures(schoolId)
  const academicYearsQuery = useAcademicYears(schoolId)
  const generateMutation = useBulkGenerateInvoices(schoolId)

  const students = studentsQuery.data ?? []
  const fees = feesQuery.data ?? []
  const academicYears = academicYearsQuery.data ?? []

  // ---- Wizard state --------------------------------------------------------
  const [step, setStep] = useState<WizardStep>(0)
  const [maxReached, setMaxReached] = useState<WizardStep>(0)
  const [selection, setSelection] = useState<SelectionState>(emptySelection)
  const [selectedFees, setSelectedFees] = useState<SelectedFeesMap>({})
  const [customLines, setCustomLines] = useState<CustomLine[]>([])
  const [details, setDetails] = useState<WizardDetails>(() => {
    const d = defaultDetails()
    return { ...d, academicYear: academicYears[0]?.name ?? '' }
  })
  const [result, setResult] = useState<GenerateResult | null>(null)

  // Sprint E.5 — async branch: jobId is set when the mutation returns 202.
  // The polling hook keys off jobId; passing null disables the poll.
  const [asyncJobId, setAsyncJobId] = useState<string | null>(null)
  const asyncJobQuery = useAsyncBulkJob(schoolId, 'invoices', asyncJobId)
  const asyncJob = asyncJobQuery.data

  // Sprint E.5 — toast-once gate so the terminal-status useState transition
  // (queued → running → succeeded) doesn't double-fire on each render. We
  // key by jobId so a fresh retry-failed job re-arms it.
  const [toastedJobId, setToastedJobId] = useState<string | null>(null)
  if (
    asyncJob &&
    asyncJobId &&
    toastedJobId !== asyncJobId &&
    (asyncJob.status === 'succeeded' || asyncJob.status === 'failed')
  ) {
    if (asyncJob.status === 'succeeded') {
      const parts = [
        `${asyncJob.succeeded} invoice${asyncJob.succeeded === 1 ? '' : 's'} created as draft${asyncJob.succeeded === 1 ? '' : 's'}`,
      ]
      if (asyncJob.skipped > 0) parts.push(`${asyncJob.skipped} skipped`)
      if (asyncJob.failed > 0) parts.push(`${asyncJob.failed} failed`)
      if (asyncJob.failed > 0) toast.error(parts.join(' · '))
      else toast.success(parts.join(' · '))
    } else {
      toast.error(asyncJob.error ?? 'Bulk invoice generation failed.')
    }
    setToastedJobId(asyncJobId)
  }

  // Auto-bind academicYear when the dropdown data lands and the form was
  // initialized with no AY (first render before the query resolved).
  if (!details.academicYear && academicYears[0]?.name) {
    setDetails(d => ({ ...d, academicYear: academicYears[0].name }))
  }

  // ---- Derived state -------------------------------------------------------
  const selectedStudents = useMemo(
    () => students.filter(s => selection.selectedIds.has(s.studentId)),
    [students, selection.selectedIds],
  )
  const feeCount = Object.keys(selectedFees).length
  const customLineCount = customLines.filter(l => l.name || l.amount).length
  const totalLineCount = feeCount + customLineCount

  const numberPreview = useMemo(
    () =>
      buildNumberPreview({
        schoolCode: schoolCode ?? '',
        academicYear: details.academicYear,
        billingPeriod: details.billingPeriod,
        studentCount: selection.selectedIds.size,
      }),
    [
      schoolCode,
      details.academicYear,
      details.billingPeriod,
      selection.selectedIds.size,
    ],
  )

  // ---- Bulk preview (Step 4 only) -----------------------------------------
  const previewParams = useMemo(
    () => ({
      selectionMode: 'students' as const,
      studentIds: [...selection.selectedIds],
      feeStructureIds: Object.keys(selectedFees),
      billingPeriod: details.billingPeriod || undefined,
    }),
    [selection.selectedIds, selectedFees, details.billingPeriod],
  )
  const previewQuery = useBulkPreview(schoolId, previewParams, {
    enabled:
      step === 3 &&
      selection.selectedIds.size > 0 &&
      Object.keys(selectedFees).length > 0,
  })

  // ---- Step gating ---------------------------------------------------------
  const canAdvanceFromStep: Record<WizardStep, boolean> = {
    0: selection.selectedIds.size > 0,
    1: totalLineCount > 0,
    2: !!details.academicYear && !!details.dueDate,
    3: true,
  }

  const goNext = () => {
    const cur = step
    if (!canAdvanceFromStep[cur]) return
    const next = Math.min(3, cur + 1) as WizardStep
    setStep(next)
    if (next > maxReached) setMaxReached(next)
  }
  const goBack = () => setStep(s => (s === 0 ? 0 : ((s - 1) as WizardStep)))
  const gotoStep = (n: WizardStep) => {
    if (n <= maxReached) setStep(n)
  }

  // ---- Submit + confirmation modal -----------------------------------------
  const [confirmOpen, setConfirmOpen] = useState(false)

  /**
   * Build the bulk-generate DTO from the current wizard state. Pure so the
   * confirmation flow can dispatch the same payload the inline-submit
   * builds. `restrictToStudentIds` lets the retry-failed-only flow narrow
   * the recipient set without touching the rest of the wizard state.
   */
  const buildSubmitDto = (
    restrictToStudentIds?: string[],
  ): BulkGenerateInvoiceDto & { discounts?: ReturnType<typeof resolveDiscounts> } => {
    const dto: BulkGenerateInvoiceDto = {
      selectionMode: 'students',
      studentIds: restrictToStudentIds ?? [...selection.selectedIds],
      feeStructureIds: Object.keys(selectedFees),
      academicYear: details.academicYear,
      billingPeriod: details.billingPeriod || undefined,
      dueDate: details.dueDate,
      notes: details.notes || undefined,
      customLineItems: resolveCustomLineItems(customLines),
      skipZeroTotal: details.skipZeroTotal,
    }
    const discounts = resolveDiscounts(fees, selectedFees)
    return discounts.length > 0 ? { ...dto, discounts } : dto
  }

  const handleSubmitResult = (response: BulkGenerateResult) => {
    if (response.mode === 'async') {
      // Reset the toast gate so the new job's terminal toast fires.
      setToastedJobId(null)
      setAsyncJobId(response.jobId)
      return
    }
    // Sync path — unchanged behaviour from Sprint C.
    const projection = computeBatch(
      selectedStudents,
      fees,
      selectedFees,
      customLines,
      { skipZeroTotal: details.skipZeroTotal },
    )
    const billableRows = projection.perStudent.filter(p =>
      details.skipZeroTotal ? p.total > 0 : true,
    )
    const invoices = billableRows.map((p, i) => ({
      number: numberPreview.prefix + String(i + 1).padStart(4, '0'),
      studentId: p.studentId,
      studentName: p.studentName,
      gradeLevel: p.gradeLevel,
      total: p.total,
    }))
    setResult({
      count: response.generated,
      skipped: response.skipped,
      total: projection.billableTotal,
      billingPeriod: details.billingPeriod,
      invoices,
    })
    toast.success(
      `${response.generated} invoice${response.generated === 1 ? '' : 's'} generated` +
        (response.skipped > 0 ? ` · ${response.skipped} skipped` : ''),
    )
  }

  const handleSubmitError = (err: any) => {
    // 413 from the SYNC_LIMIT_EXCEEDED contract surfaces here. Sprint E
    // adds the auto-async behaviour BE-side so this branch should be rare
    // post-deploy — kept as defense for staggered rollouts.
    const code = err?.response?.data?.code
    if (code === 'BULK_GENERATE_SYNC_LIMIT_EXCEEDED') {
      toast.error(
        'Too many students for synchronous generation. Try again — the ' +
          'system will switch to the async worker automatically.',
      )
      return
    }
    const msg = err?.response?.data?.message || err?.message || 'Bulk generation failed.'
    toast.error(msg)
  }

  const dispatchSubmit = (restrictToStudentIds?: string[]) => {
    const dto = buildSubmitDto(restrictToStudentIds)
    generateMutation.mutate(dto as BulkGenerateInvoiceDto, {
      onSuccess: handleSubmitResult,
      onError: handleSubmitError,
    })
  }

  const submit = () => {
    if (selection.selectedIds.size > BULK_GENERATE_CONFIRM_THRESHOLD) {
      setConfirmOpen(true)
      return
    }
    dispatchSubmit()
  }

  const reset = () => {
    setResult(null)
    setAsyncJobId(null)
    setToastedJobId(null)
    setStep(0)
    setMaxReached(0)
    setSelection(emptySelection())
    setSelectedFees({})
    setCustomLines([])
    setDetails(d => ({ ...defaultDetails(), academicYear: d.academicYear }))
  }

  // ---- Render --------------------------------------------------------------
  if (studentsQuery.isLoading || feesQuery.isLoading || academicYearsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-[rgb(var(--text-tertiary))]">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading school roster…
      </div>
    )
  }

  // Sync-success screen wins first because the sync path resolves before
  // any async path takes over.
  if (result) {
    return (
      <GenerateSuccess
        result={result}
        onReset={reset}
        onClose={onComplete}
      />
    )
  }

  // Async terminal-success / terminal-failure. Both branches gate on
  // `asyncJobId` being set — otherwise a stale cached job result (or a
  // test mock returning a job for a never-set jobId) would short-circuit
  // the wizard into the success view on mount.
  if (asyncJobId && asyncJob && asyncJob.status === 'succeeded') {
    return (
      <AsyncGenerateSuccess
        job={asyncJob}
        billingPeriod={details.billingPeriod}
        onReset={reset}
        onClose={onComplete}
        onRetryFailed={(failedStudentIds) => {
          setAsyncJobId(null)
          setToastedJobId(null)
          dispatchSubmit(failedStudentIds)
        }}
        retryPending={generateMutation.isPending}
      />
    )
  }

  // In-flight async job (queued / running) → drawer-style progress card.
  if (asyncJobId && (!asyncJob || asyncJob.status === 'queued' || asyncJob.status === 'running' || asyncJob.status === 'failed')) {
    return (
      <AsyncJobInProgress
        job={asyncJob}
        studentCount={selection.selectedIds.size}
        onRunInBackground={() => {
          // The wizard component unmounts when `onComplete` navigates away,
          // which stops the polling subscription. The cache holds the last
          // result for 60s (gcTime) but no further polls fire. A follow-up
          // can move the active jobId into a shell-mounted global watcher;
          // for now "Run in background" = "close and trust your inbox /
          // come back to the invoices list to see the drafts land."
          onComplete?.()
        }}
        onReset={reset}
      />
    )
  }

  return (
    <div className="space-y-6">
      <Stepper step={step} maxReached={maxReached} onGoto={gotoStep} />

      <div className="min-h-[420px]">
        {step === 0 && (
          <Step1Recipients
            students={students}
            selection={selection}
            setSelection={setSelection}
            previewCounters={undefined}
          />
        )}
        {step === 1 && (
          <Step2FeeStructures
            students={selectedStudents}
            fees={fees}
            selectedFees={selectedFees}
            setSelectedFees={setSelectedFees}
            customLines={customLines}
            setCustomLines={setCustomLines}
          />
        )}
        {step === 2 && (
          <Step3InvoiceDetails
            studentCount={selection.selectedIds.size}
            details={details}
            setDetails={setDetails}
            academicYears={academicYears.map(a => a.name)}

            numberPreview={numberPreview}
          />
        )}
        {step === 3 && (
          <Step4Review
            students={selectedStudents}
            fees={fees}
            selectedFees={selectedFees}
            customLines={customLines}
            details={details}
            previewQuery={previewQuery}
            schoolCode={schoolCode}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[rgb(var(--border-primary))]">
        {step === 0 ? (
          <Button variant="ghost" onClick={onCancel}>
            <X className="w-4 h-4 mr-1" /> Cancel
          </Button>
        ) : (
          <Button variant="outline" onClick={goBack}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        )}

        <div className="flex items-center gap-4">
          <span className="text-xs text-[rgb(var(--text-tertiary))]">
            {footerInfo(
              step,
              selection.selectedIds.size,
              totalLineCount,
              previewQuery,
            )}
          </span>
          {step < 3 ? (
            <Button onClick={goNext} disabled={!canAdvanceFromStep[step]}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={submit}
              disabled={
                generateMutation.isPending ||
                previewQuery.isLoading ||
                previewQuery.isFetching ||
                selection.selectedIds.size === 0 ||
                Object.keys(selectedFees).length === 0
              }
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1" /> Generate invoices
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Confirmation modal for studentCount > BULK_GENERATE_CONFIRM_THRESHOLD */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Generate invoices?"
        description={`Generate ${selection.selectedIds.size} invoices? This cannot be undone.`}
      >
        <div className="text-sm text-[rgb(var(--text-secondary))] space-y-2">
          <p>
            Invoices for {selection.selectedIds.size} students will be created
            as drafts. You can review and issue them from the invoices list.
          </p>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setConfirmOpen(false)
              dispatchSubmit()
            }}
          >
            Generate {selection.selectedIds.size}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AsyncJobInProgress — drawer-style screen while the worker churns.
// ---------------------------------------------------------------------------

function AsyncJobInProgress({
  job,
  studentCount,
  onRunInBackground,
  onReset,
}: {
  job: ReturnType<typeof useAsyncBulkJob>['data']
  studentCount: number
  onRunInBackground: () => void
  onReset: () => void
}) {
  const isFailed = job?.status === 'failed'
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2 py-4">
        <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
          {isFailed ? 'Bulk generation failed' : 'Generating invoices…'}
        </h2>
        <p className="text-sm text-[rgb(var(--text-secondary))]">
          {isFailed
            ? 'The worker reported a job-level failure before any (or all) invoices were created.'
            : `Creating draft invoices for ${studentCount} students. This typically completes in under 90 seconds.`}
        </p>
      </div>

      <AsyncJobProgress job={job} verbingNoun="Generating invoices" />

      <div className="flex items-center justify-center gap-3">
        {isFailed ? (
          <Button variant="outline" onClick={onReset}>
            Start over
          </Button>
        ) : (
          <Button variant="outline" onClick={onRunInBackground}>
            Run in background
          </Button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stepper
// ---------------------------------------------------------------------------

function Stepper({
  step,
  maxReached,
  onGoto,
}: {
  step: WizardStep
  maxReached: WizardStep
  onGoto: (n: WizardStep) => void
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {WIZARD_STEP_LABELS.map((label, i) => {
        const idx = i as WizardStep
        const isDone = i < step || (maxReached > i && step !== i)
        const isCurrent = step === i
        const reachable = i <= maxReached
        return (
          <div key={label} className="flex items-center gap-2 flex-1">
            <button
              type="button"
              onClick={() => reachable && onGoto(idx)}
              disabled={!reachable}
              className={[
                'flex items-center gap-2 px-2 py-1 rounded-md transition-colors',
                isCurrent
                  ? 'bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent-strong))] font-semibold'
                  : isDone
                  ? 'text-[rgb(var(--accent-strong))]'
                  : 'text-[rgb(var(--text-tertiary))]',
                reachable && !isCurrent ? 'hover:bg-[rgb(var(--background-secondary))]' : '',
              ].join(' ')}
            >
              <span
                className={[
                  'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs',
                  isDone
                    ? 'bg-[rgb(var(--accent-strong))] text-white'
                    : isCurrent
                    ? 'bg-[rgb(var(--accent-strong))] text-white'
                    : 'bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-tertiary))]',
                ].join(' ')}
              >
                {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
              </span>
              <span className="truncate">{label}</span>
            </button>
            {i < WIZARD_STEP_LABELS.length - 1 && (
              <span
                className={[
                  'h-px flex-1',
                  isDone
                    ? 'bg-[rgb(var(--accent-strong))]'
                    : 'bg-[rgb(var(--border-primary))]',
                ].join(' ')}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function footerInfo(
  step: WizardStep,
  selN: number,
  lineN: number,
  previewQuery: ReturnType<typeof useBulkPreview>,
): string {
  if (step === 0) {
    if (selN === 0) return 'Select at least one student to continue'
    return `${selN} student${selN === 1 ? '' : 's'} selected`
  }
  if (step === 1) {
    if (lineN === 0) return 'Add at least one fee or custom line'
    return `${lineN} line item${lineN === 1 ? '' : 's'} · ${selN} students`
  }
  if (step === 2) {
    return `${selN} invoice${selN === 1 ? '' : 's'} will be configured`
  }
  if (previewQuery.isLoading || previewQuery.isFetching) return 'Resolving preview…'
  const eligible = previewQuery.data?.eligibleCount ?? selN
  return `Ready to generate ${eligible} invoice${eligible === 1 ? '' : 's'}`
}
