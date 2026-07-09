/**
 * AgreementCreateWizard (FB-2.9)
 *
 * 3-step wizard for creating a family-billing agreement draft:
 *   0 — family & members (title, payer, student picker)
 *   1 — terms (type, covered fee types, per-member amounts, effective dates)
 *   2 — review → create draft
 *
 * Step gating mirrors the BulkGenerateWizard state machine (step/maxReached,
 * canAdvance, goNext/goBack/gotoStep, inline Stepper, footer Back/Next/Submit).
 * The step-2 validation enforces the backend superRefine invariants
 * (allocation sums, per-member coverage, ≤30 students) client-side so the
 * operator sees the failing invariants before the 400.
 *
 * On submit the created draft's id is passed to onComplete, which navigates to
 * the detail page. The wizard submit is additionally disabled for callers
 * without billing:manage (nav already hides the entry point, but the direct
 * URL is defended here too).
 */

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, X, Check, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import { usePermission } from '@edforge/abac'
import { useCreateAgreement } from '@edforge/finance-services'
import { Step1FamilyMembers } from './Step1FamilyMembers'
import { Step2Terms } from './Step2Terms'
import { Step3Review } from './Step3Review'
import {
  initialWizardState,
  validateStep1,
  validateStep2,
  buildCreateDto,
  type WizardStep,
  type WizardState,
} from './wizard-types'

const STEP_LABEL_KEYS = [
  'agreement.wizard.steps.family',
  'agreement.wizard.steps.terms',
  'agreement.wizard.steps.review',
] as const

export interface AgreementCreateWizardProps {
  schoolId: string
  onComplete: (agreementId: string) => void
  onCancel: () => void
}

export function AgreementCreateWizard({
  schoolId,
  onComplete,
  onCancel,
}: AgreementCreateWizardProps) {
  const { t } = useTranslation('payments')
  const canManage = usePermission('manage', 'billing', schoolId)
  const createMutation = useCreateAgreement(schoolId)

  const [step, setStep] = useState<WizardStep>(0)
  const [maxReached, setMaxReached] = useState<WizardStep>(0)
  const [state, setState] = useState<WizardState>(initialWizardState)

  const patch = (p: Partial<WizardState>) =>
    setState((prev) => ({ ...prev, ...p }))

  const step1 = useMemo(() => validateStep1(state), [state])
  const step2 = useMemo(() => validateStep2(state), [state])

  const canAdvance: Record<WizardStep, boolean> = {
    0: step1.ok,
    1: step2.ok,
    2: true,
  }
  const currentErrors =
    step === 0 ? step1.errors : step === 1 ? step2.errors : []

  const goNext = () => {
    if (!canAdvance[step]) return
    const next = Math.min(2, step + 1) as WizardStep
    setStep(next)
    if (next > maxReached) setMaxReached(next)
  }
  const goBack = () => setStep((s) => (s === 0 ? 0 : ((s - 1) as WizardStep)))
  const gotoStep = (n: WizardStep) => {
    if (n <= maxReached) setStep(n)
  }

  const submit = async () => {
    if (!step1.ok || !step2.ok || !canManage) return
    try {
      const created = await createMutation.mutateAsync(buildCreateDto(state))
      toast.success(t('agreement.created'))
      onComplete(created.id)
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } } | undefined)
          ?.response?.data?.message ??
        (err as Error | undefined)?.message ??
        t('agreement.wizard.createFailed')
      toast.error(msg)
    }
  }

  return (
    <div className="space-y-6">
      <Stepper step={step} maxReached={maxReached} onGoto={gotoStep} />

      <div className="min-h-96">
        {step === 0 && (
          <Step1FamilyMembers
            schoolId={schoolId}
            title={state.title}
            familyId={state.familyId}
            payerName={state.payerName}
            payerPhone={state.payerPhone}
            payerEmail={state.payerEmail}
            members={state.members}
            onChange={patch}
          />
        )}
        {step === 1 && (
          <Step2Terms
            members={state.members}
            agreementType={state.agreementType}
            coveredFeeTypes={state.coveredFeeTypes}
            billingFrequency={state.billingFrequency}
            totalAmount={state.totalAmount}
            allocation={state.allocation}
            lines={state.lines}
            effectiveFrom={state.effectiveFrom}
            effectiveTo={state.effectiveTo}
            onChange={patch}
          />
        )}
        {step === 2 && <Step3Review state={state} />}
      </div>

      {/* Inline validation for the active step */}
      {currentErrors.length > 0 && (
        <ul className="space-y-1 rounded-lg border border-[rgb(var(--state-warning-border))] bg-[rgb(var(--state-warning-bg)/0.12)] px-3 py-2 text-xs text-[rgb(var(--text-secondary))]">
          {currentErrors.map((e) => (
            <li key={e.key}>{t(e.key, e.params)}</li>
          ))}
        </ul>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[rgb(var(--border-primary))] pt-4">
        {step === 0 ? (
          <Button variant="ghost" onClick={onCancel}>
            <X className="mr-1 h-4 w-4" /> {t('agreement.wizard.footer.cancel')}
          </Button>
        ) : (
          <Button variant="outline" onClick={goBack}>
            <ChevronLeft className="mr-1 h-4 w-4" />{' '}
            {t('agreement.wizard.footer.back')}
          </Button>
        )}

        {step < 2 ? (
          <Button onClick={goNext} disabled={!canAdvance[step]}>
            {t('agreement.wizard.footer.next')}{' '}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={() => void submit()}
            disabled={createMutation.isPending || !canManage || !step2.ok}
          >
            {createMutation.isPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-1 h-4 w-4" />
            )}
            {t('agreement.wizard.review.createDraft')}
          </Button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stepper (mirrors BulkGenerateWizard's inline stepper)
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
      {STEP_LABEL_KEYS.map((labelKey, i) => {
        const idx = i as WizardStep
        const label = t(labelKey)
        const isDone = i < step || (maxReached > i && step !== i)
        const isCurrent = step === i
        const reachable = i <= maxReached
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => reachable && onGoto(idx)}
              disabled={!reachable}
              className={[
                'flex items-center gap-2 rounded-md px-2 py-1 transition-colors',
                isCurrent
                  ? 'bg-[rgb(var(--accent-soft))] font-semibold text-[rgb(var(--accent-strong))]'
                  : isDone
                    ? 'text-[rgb(var(--accent-strong))]'
                    : 'text-[rgb(var(--text-tertiary))]',
                reachable && !isCurrent
                  ? 'hover:bg-[rgb(var(--background-secondary))]'
                  : '',
              ].join(' ')}
            >
              <span
                className={[
                  'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs',
                  isDone || isCurrent
                    ? 'bg-[rgb(var(--accent-strong))] text-[rgb(var(--action-primary-fg))]'
                    : 'bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-tertiary))]',
                ].join(' ')}
              >
                {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="truncate">{label}</span>
            </button>
            {i < STEP_LABEL_KEYS.length - 1 && (
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
