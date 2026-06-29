/**
 * BulkGenerateWizard — top-level shell + state container.
 *
 * Replaces the old single-file `BulkInvoiceForm.tsx`. Implements the
 * operator-validated prototype from claude.ai/design (project
 * `019de553-4cad-797c-83c1-fc706ec63fac` → file `Bulk Generate Invoices.html`)
 * per .claude/plans/finance-module-bulk-mighty-honey.md §5b Phase 1 scope.
 *
 * Owns:
 *   - selection state (recipient set + segment chips + mode)
 *   - selectedFees + customLines + wizard details
 *   - step navigation + maxReachedStep
 *   - the bulk-generate mutation + the bulk-preview query (gated to Step 4)
 *   - the generated-batch result (success screen)
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
import { Button } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import {
  useEnrolledStudents,
  useBulkGenerateInvoices,
  useFeeStructures,
  useAcademicYears,
  useBulkPreview,
} from '@edforge/finance-services'
import type { BulkGenerateInvoiceDto } from '@edforge/finance-services'
import { Step1Recipients } from './Step1Recipients'
import { Step2FeeStructures } from './Step2FeeStructures'
import { Step3InvoiceDetails } from './Step3InvoiceDetails'
import { Step4Review } from './Step4Review'
import { GenerateSuccess, type GenerateResult } from './GenerateSuccess'
import {
  emptySelection,
  defaultDetails,
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

type Translate = (key: string, options?: Record<string, unknown>) => string

const WIZARD_STEP_LABEL_KEYS = [
  'bulkGenerate.steps.selectRecipients',
  'bulkGenerate.steps.feeStructures',
  'bulkGenerate.steps.invoiceDetails',
  'bulkGenerate.steps.reviewConfirm',
] as const

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
  const { t } = useTranslation('payments')
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

  // ---- Submit --------------------------------------------------------------
  const submit = () => {
    const dto: BulkGenerateInvoiceDto = {
      selectionMode: 'students',
      studentIds: [...selection.selectedIds],
      feeStructureIds: Object.keys(selectedFees),
      academicYear: details.academicYear,
      billingPeriod: details.billingPeriod || undefined,
      dueDate: details.dueDate,
      notes: details.notes || undefined,
      customLineItems: resolveCustomLineItems(customLines),
      skipZeroTotal: details.skipZeroTotal,
    }
    // Convert per-fee discount % into the BE-shaped discounts[] AFTER spread —
    // discounts isn't currently typed on BulkGenerateInvoiceDto but the BE
    // accepts it (existing generate.discounts path). Pass through as any.
    const discounts = resolveDiscounts(fees, selectedFees)
    const withDiscounts = discounts.length > 0 ? { ...dto, discounts } : dto

    generateMutation.mutate(withDiscounts as BulkGenerateInvoiceDto, {
      onSuccess: response => {
        // Client-side projection for the success-screen per-invoice list.
        // The BE's generated count is authoritative; the projection is just
        // the visible breakdown.
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
          response.skipped > 0
            ? t('bulkGenerate.toast.generatedWithSkipped', {
                count: response.generated,
                skipped: response.skipped,
              })
            : t('bulkGenerate.toast.generated', { count: response.generated }),
        )
      },
      onError: (err: any) => {
        // 413 from the SYNC_LIMIT_EXCEEDED contract surfaces here. For Phase 1
        // we just toast — Sprint E adds the async path the operator can pivot to.
        const code = err?.response?.data?.code
        if (code === 'BULK_GENERATE_SYNC_LIMIT_EXCEEDED') {
          toast.error(t('bulkGenerate.toast.syncLimitExceeded'))
          return
        }
        const msg = err?.response?.data?.message || err?.message || t('bulkGenerate.toast.failed')
        toast.error(msg)
      },
    })
  }

  const reset = () => {
    setResult(null)
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
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        {t('bulkGenerate.loadingRoster')}
      </div>
    )
  }

  if (result) {
    return (
      <GenerateSuccess
        result={result}
        onReset={reset}
        onClose={onComplete}
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
            <X className="w-4 h-4 mr-1" /> {t('actions.cancel')}
          </Button>
        ) : (
          <Button variant="outline" onClick={goBack}>
            <ChevronLeft className="w-4 h-4 mr-1" /> {t('actions.back')}
          </Button>
        )}

        <div className="flex items-center gap-4">
          <span className="text-xs text-[rgb(var(--text-tertiary))]">
            {footerInfo(
              step,
              selection.selectedIds.size,
              totalLineCount,
              previewQuery,
              t,
            )}
          </span>
          {step < 3 ? (
            <Button onClick={goNext} disabled={!canAdvanceFromStep[step]}>
              {t('actions.next')} <ChevronRight className="w-4 h-4 ml-1" />
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
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  {t('bulkGenerate.actions.generating')}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1" />
                  {t('bulkGenerate.actions.generateInvoices')}
                </>
              )}
            </Button>
          )}
        </div>
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
  const { t } = useTranslation('payments')
  return (
    <div className="flex items-center gap-2 text-xs">
      {WIZARD_STEP_LABEL_KEYS.map((labelKey, i) => {
        const idx = i as WizardStep
        const label = t(labelKey)
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
            {i < WIZARD_STEP_LABEL_KEYS.length - 1 && (
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
  t: Translate,
): string {
  if (step === 0) {
    if (selN === 0) return t('bulkGenerate.footer.selectStudent')
    return t('bulkGenerate.footer.studentsSelected', { count: selN })
  }
  if (step === 1) {
    if (lineN === 0) return t('bulkGenerate.footer.addFeeOrLine')
    return t('bulkGenerate.footer.lineItemsAndStudents', {
      lineCount: lineN,
      lineLabel: t(
        lineN === 1
          ? 'bulkGenerate.common.lineItem'
          : 'bulkGenerate.common.lineItem_plural',
      ),
      studentCount: selN,
      studentLabel: t(
        selN === 1
          ? 'bulkGenerate.common.student'
          : 'bulkGenerate.common.student_plural',
      ),
    })
  }
  if (step === 2) {
    return t('bulkGenerate.footer.invoicesConfigured', { count: selN })
  }
  if (previewQuery.isLoading || previewQuery.isFetching) {
    return t('bulkGenerate.footer.resolvingPreview')
  }
  const eligible = previewQuery.data?.eligibleCount ?? selN
  return t('bulkGenerate.footer.readyToGenerate', { count: eligible })
}
