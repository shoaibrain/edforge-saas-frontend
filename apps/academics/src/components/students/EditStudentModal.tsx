/**
 * EditStudentModal Component
 *
 * Modal for editing student demographic and contact information.
 * Follows EditStaffModal pattern: react-hook-form + zodResolver,
 * @edforge/ui Modal, dirty form guard, field error mapping.
 *
 * Sprint 8 - EDIT-01
 *
 * Pilot Onboarding Hardening PD.3.4 — adds a Financial section gated
 * on the student's BillingAccount existing (accounts are lazy-created
 * on first invoice). Operator may set / revise the opening balance
 * (previous dues) inline; revisions trigger an explicit confirmation
 * because they emit an adjustment ledger entry that survives in the
 * audit trail.
 */

import { useEffect, useRef, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Save, Wallet } from 'lucide-react'
import { Modal, ModalFooter, Button, Field, Input, Select, DateInput } from '@edforge/ui'
import {
  useStudentAccounts,
  useSetOpeningBalance,
} from '@edforge/finance-services'
import type { StudentAccount } from '@edforge/types'
import { useUpdateStudent } from '../../hooks'
import { parseApiError } from '../../services/academics.service'
import { useActiveSchoolId } from '../../stores/app.store'
import { useSchoolEnabledGradeOptions } from '../../hooks/useGradeOptions'
import { GRADE_LEVEL_OPTIONS } from '../../schemas/course.form'
import type { StudentProfileResponseDto } from '@aibrains/shared-types'

// ============================================================================
// TYPES
// ============================================================================

export interface EditStudentModalProps {
  open: boolean
  onClose: () => void
  student: StudentProfileResponseDto
}

// ============================================================================
// FORM SCHEMA
// ============================================================================

const editStudentFormSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  middleName: z.string().max(50).optional().or(z.literal('')),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  currentGradeLevel: z.string().min(1, 'Grade level is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  // PD.3.4 — opening balance (previous dues). All three fields are
  // optional; the financial section is only submitted to the backend if
  // the operator changed at least one of them AND a BillingAccount
  // exists for this student.
  openingBalance: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .nonnegative('Amount must be ≥ 0')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  openingBalanceAsOf: z.string().optional().or(z.literal('')),
  openingBalanceNote: z
    .string()
    .max(500, 'Note must be at most 500 characters')
    .optional()
    .or(z.literal('')),
})

type EditStudentFormData = z.infer<typeof editStudentFormSchema>

// ============================================================================
// OPTIONS
// ============================================================================

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
] as const

// ============================================================================
// HELPERS
// ============================================================================

/** Find the BillingAccount belonging to `studentId` within the loaded
 *  search result. The list endpoint does not filter by studentId
 *  (see invoices.service comment B-2), so we search by name and
 *  resolve by studentId on the client. */
function pickAccountForStudent(
  items: StudentAccount[] | undefined,
  studentId: string,
): StudentAccount | null {
  if (!items) return null
  return items.find(a => a.studentId === studentId) ?? null
}

function formatNpr(amount: number | undefined): string {
  if (amount === undefined || amount === null) return 'NPR 0'
  return `NPR ${amount.toLocaleString('en-NP', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EditStudentModal({
  open,
  onClose,
  student,
}: EditStudentModalProps) {
  const firstInputRef = useRef<HTMLInputElement>(null)
  const updateMutation = useUpdateStudent()
  const schoolId = useActiveSchoolId()
  const { options: filteredGradeOptions } = useSchoolEnabledGradeOptions(schoolId)

  // PD.3.4 — lazy-fetch BillingAccount via name search (backend's only
  // supported filter), then client-side narrow to this studentId.
  // Disabled until the modal is open + schoolId is known so we don't
  // pre-fetch for every row in a closed list.
  const accountsQuery = useStudentAccounts(
    schoolId ?? '',
    open && schoolId
      ? { searchTerm: `${student.firstName} ${student.lastName}`.trim() }
      : undefined,
  )
  const billingAccount = useMemo(
    () => pickAccountForStudent(accountsQuery.data, student.studentId),
    [accountsQuery.data, student.studentId],
  )
  const accountId = billingAccount?.id ?? null
  const accountReady = !accountsQuery.isLoading
  const hasAccount = Boolean(billingAccount)

  const setOpeningBalanceMutation = useSetOpeningBalance(schoolId ?? '')

  // Include student's current grade even if outside school range
  const gradeOptions = useMemo(() => {
    const currentGrade = student.currentGradeLevel
    if (!currentGrade) return filteredGradeOptions
    if (filteredGradeOptions.some((o) => o.value === currentGrade)) return filteredGradeOptions
    const extraOpt = GRADE_LEVEL_OPTIONS.find((o) => o.value === currentGrade)
    return extraOpt ? [...filteredGradeOptions, extraOpt] : filteredGradeOptions
  }, [filteredGradeOptions, student.currentGradeLevel])

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EditStudentFormData>({
    resolver: zodResolver(editStudentFormSchema),
  })

  // Reset form when student or account changes. Re-running after
  // accountsQuery resolves prefills the financial fields without a
  // second mount.
  useEffect(() => {
    if (open && student) {
      reset({
        firstName: student.firstName,
        lastName: student.lastName,
        middleName: student.middleName || '',
        dateOfBirth: student.dateOfBirth || '',
        gender: student.gender as EditStudentFormData['gender'],
        currentGradeLevel: student.currentGradeLevel || '',
        email: student.contactInfo?.email || '',
        phone: student.contactInfo?.phone || '',
        openingBalance: billingAccount?.openingBalance,
        openingBalanceAsOf: billingAccount?.openingBalanceAsOf || '',
        openingBalanceNote: billingAccount?.openingBalanceNote || '',
      })
    }
  }, [open, student, billingAccount, reset])

  // Auto-focus first input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => firstInputRef.current?.focus(), 100)
    }
  }, [open])

  const handleClose = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      )
      if (!confirmed) return
    }
    onClose()
  }

  // PD.3.4 — detect a financial mutation. Comparing against the
  // prefilled BillingAccount values (NOT the local form's isDirty,
  // which fires on any field touch including non-financial).
  const isFinancialChanged = (data: EditStudentFormData): boolean => {
    if (!hasAccount) return false
    const amtCurrent = typeof data.openingBalance === 'number' ? data.openingBalance : undefined
    const amtOriginal = billingAccount?.openingBalance
    const asOfCurrent = data.openingBalanceAsOf || undefined
    const asOfOriginal = billingAccount?.openingBalanceAsOf
    const noteCurrent = data.openingBalanceNote || undefined
    const noteOriginal = billingAccount?.openingBalanceNote
    return (
      amtCurrent !== amtOriginal ||
      asOfCurrent !== asOfOriginal ||
      noteCurrent !== noteOriginal
    )
  }

  const onSubmit = handleSubmit(async (data) => {
    const financialChanged = isFinancialChanged(data)
    const isRevision =
      financialChanged &&
      billingAccount?.openingBalance !== undefined &&
      data.openingBalance !== billingAccount.openingBalance

    // PD.3.4 revision confirmation — gated on the AMOUNT changing
    // (not just the note or asOf). Operators expect a hard checkpoint
    // when money is being adjusted; a typo in the note shouldn't trip
    // the same dialog.
    if (isRevision) {
      const ok = window.confirm(
        `Revise opening balance from ${formatNpr(billingAccount.openingBalance)} ` +
          `to ${formatNpr(typeof data.openingBalance === 'number' ? data.openingBalance : 0)}?\n\n` +
          'This creates an audit-trailed adjustment ledger entry; the original ' +
          'opening-balance entry stays in the ledger.',
      )
      if (!ok) return
    }

    try {
      await updateMutation.mutateAsync({
        studentId: student.studentId,
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          middleName: data.middleName || undefined,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          currentGradeLevel: data.currentGradeLevel,
          contactInfo: {
            email: data.email || undefined,
            phone: data.phone || undefined,
          },
        },
      })

      // Run the opening-balance PUT only when financial fields actually
      // changed AND we have an accountId resolved. Sequential — student
      // update first (the visible "Save Changes" intent), then the
      // finance write.
      if (financialChanged && accountId) {
        const amount = typeof data.openingBalance === 'number' ? data.openingBalance : 0
        await setOpeningBalanceMutation.mutateAsync({
          accountId,
          payload: {
            amount,
            // backend defends asOf format + future date; fall back to
            // today when operator left it blank so the operator-time
            // intent is captured even without an explicit pick
            asOf: data.openingBalanceAsOf || new Date().toISOString().slice(0, 10),
            note: data.openingBalanceNote || undefined,
          },
        })
      }
      onClose()
    } catch (error) {
      const parsed = parseApiError(error as Error)
      if (parsed.fieldErrors) {
        Object.entries(parsed.fieldErrors).forEach(([field, message]) => {
          setError(field as keyof EditStudentFormData, { message })
        })
      }
    }
  })

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Edit Student"
      description={`Update information for ${student.fullName}`}
      size="2xl"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Student Number (read-only) */}
        {student.studentNumber && (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Student Number
            </label>
            <div className="px-3 py-2 rounded-lg border border-border-secondary bg-surface-tertiary text-text-secondary">
              {student.studentNumber}
            </div>
            <p className="mt-1 text-xs text-text-tertiary">
              Student number cannot be changed
            </p>
          </div>
        )}

        {/* Name Row */}
        <div className="grid grid-cols-3 gap-4">
          <Field label="First Name" required error={errors.firstName?.message}>
            <Input
              {...register('firstName')}
              ref={(e) => {
                register('firstName').ref(e)
                if (e) firstInputRef.current = e
              }}
              placeholder="First name"
              disabled={isSubmitting}
            />
          </Field>
          <Field label="Middle Name" optionalText={null} error={errors.middleName?.message}>
            <Input
              {...register('middleName')}
              placeholder="Middle name"
              disabled={isSubmitting}
            />
          </Field>
          <Field label="Last Name" required error={errors.lastName?.message}>
            <Input
              {...register('lastName')}
              placeholder="Last name"
              disabled={isSubmitting}
            />
          </Field>
        </div>

        {/* DOB + Gender */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date of Birth" required error={errors.dateOfBirth?.message}>
            <Input type="date" {...register('dateOfBirth')} disabled={isSubmitting} />
          </Field>
          <Controller
            name="gender"
            control={control}
            render={({ field, fieldState }) => (
              <Select
                label="Gender"
                required
                value={field.value}
                onChange={field.onChange}
                disabled={isSubmitting}
                error={fieldState.error?.message}
                options={GENDER_OPTIONS}
              />
            )}
          />
        </div>

        {/* Grade Level */}
        <Controller
          name="currentGradeLevel"
          control={control}
          render={({ field, fieldState }) => (
            <Select
              label="Grade Level"
              required
              value={field.value ?? ''}
              onChange={field.onChange}
              disabled={isSubmitting}
              error={fieldState.error?.message}
              placeholder="Select grade..."
              options={gradeOptions}
            />
          )}
        />

        {/* Contact Info */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email" optionalText={null} error={errors.email?.message}>
            <Input type="email" {...register('email')} placeholder="student@example.com" disabled={isSubmitting} />
          </Field>
          <Field label="Phone" optionalText={null} error={errors.phone?.message}>
            <Input type="tel" {...register('phone')} placeholder="+1 (555) 123-4567" disabled={isSubmitting} />
          </Field>
        </div>

        {/* PD.3.4 — Financial Section. Renders only when a BillingAccount
            already exists for this student (lazy-created on first invoice).
            Pre-account state shows a small advisory note instead. */}
        <div className="border-t border-border-secondary pt-4 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-4 h-4 text-text-secondary" />
            <h3 className="text-sm font-semibold text-text-primary">Financial</h3>
          </div>

          {!accountReady && (
            <p className="text-xs text-text-tertiary">Loading billing account…</p>
          )}

          {accountReady && !hasAccount && (
            <p className="text-xs text-text-tertiary">
              Billing account is created automatically when the first invoice is
              generated for this student. Opening balance becomes editable here
              after that.
            </p>
          )}

          {accountReady && hasAccount && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Opening Balance (NPR)"
                  optionalText={null}
                  error={errors.openingBalance?.message}
                >
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    disabled={isSubmitting}
                    {...register('openingBalance', { valueAsNumber: true })}
                  />
                </Field>
                <Controller
                  name="openingBalanceAsOf"
                  control={control}
                  render={({ field }) => (
                    <DateInput
                      label="As of"
                      value={field.value || undefined}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                      calendarSystem="bikram_sambat"
                      error={errors.openingBalanceAsOf?.message}
                    />
                  )}
                />
              </div>
              <Field
                label="Note"
                optionalText={null}
                error={errors.openingBalanceNote?.message}
              >
                <Input
                  type="text"
                  placeholder="e.g. BS 2082 carry-forward"
                  disabled={isSubmitting}
                  {...register('openingBalanceNote')}
                />
              </Field>
              {billingAccount?.openingBalanceLastSetAt && (
                <p className="text-xs text-text-tertiary">
                  Last set: {new Date(billingAccount.openingBalanceLastSetAt).toLocaleString()}
                  {billingAccount.openingBalanceLastSetBy
                    ? ` by ${billingAccount.openingBalanceLastSetBy}`
                    : ''}
                </p>
              )}
              {billingAccount?.openingBalanceRemaining !== undefined && (
                <p className="text-xs text-text-secondary">
                  Remaining unsettled: {formatNpr(billingAccount.openingBalanceRemaining)}
                </p>
              )}
            </div>
          )}
        </div>

        {isDirty && (
          <p className="text-sm text-[rgb(var(--state-warning-fg))]">
            You have unsaved changes
          </p>
        )}

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="min-w-24"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
