/**
 * EditGuardianModal Component
 *
 * Modal for correcting an existing guardian/parent contact on a student's
 * profile. Mirrors AddGuardianModal, but hydrates from the guardian matched by
 * `guardianId` and replaces that entry in place instead of appending.
 */

import { useEffect, useMemo, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Users } from 'lucide-react'
import { Modal, ModalFooter, Button, Field, Input, Select, Checkbox } from '@edforge/ui'
import { useTenantContext } from '@edforge/forms'
import { phoneFormatForArchetype } from '@aibrains/shared-types'
import { useUpdateStudent } from '../../../hooks'
import { parseApiError } from '../../../services/academics.service'
import { useAcademicsI18n } from '../../../lib/i18n'
import type { StudentProfileResponseDto } from '@aibrains/shared-types'

// ============================================================================
// TYPES
// ============================================================================

export interface EditGuardianModalProps {
  open: boolean
  onClose: () => void
  student: StudentProfileResponseDto
  guardianId: string | null
}

// ============================================================================
// FORM SCHEMA
// ============================================================================

// Every value guardianRelationshipSchema accepts, so a guardian created through
// the enrolment form (which offers all eight) can still be hydrated and saved.
const RELATIONSHIP_VALUES = [
  'mother',
  'father',
  'guardian',
  'grandparent',
  'sibling',
  'aunt',
  'uncle',
  'other',
] as const

const guardianFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  relationship: z.enum(RELATIONSHIP_VALUES),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().min(1, 'Phone is required').max(20),
  isPrimary: z.boolean(),
  canPickup: z.boolean(),
})

type GuardianFormData = z.infer<typeof guardianFormSchema>

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EditGuardianModal({
  open,
  onClose,
  student,
  guardianId,
}: EditGuardianModalProps) {
  const { t } = useAcademicsI18n()
  const firstInputRef = useRef<HTMLInputElement>(null)
  const updateMutation = useUpdateStudent()

  const { archetype, country } = useTenantContext()
  const phoneFmt = phoneFormatForArchetype(archetype, country)

  const guardian = useMemo(
    () =>
      guardianId
        ? (student.guardians || []).find((g) => g.guardianId === guardianId)
        : undefined,
    [student.guardians, guardianId],
  )

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<GuardianFormData>({
    resolver: zodResolver(guardianFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      relationship: 'guardian',
      email: '',
      phone: '',
      isPrimary: false,
      canPickup: true,
    },
  })

  // Reset form from the selected guardian when the modal opens
  useEffect(() => {
    if (open && guardian) {
      reset({
        firstName: guardian.firstName,
        lastName: guardian.lastName,
        relationship: guardian.relationship,
        email: guardian.email || '',
        phone: guardian.phone || '',
        isPrimary: !!guardian.isPrimary,
        canPickup: !!guardian.canPickup,
      })
    }
  }, [open, guardian, reset])

  // Auto-focus first input
  useEffect(() => {
    if (open) {
      setTimeout(() => firstInputRef.current?.focus(), 100)
    }
  }, [open])

  const handleClose = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        t('studentProfile.guardian.unsavedChangesConfirm')
      )
      if (!confirmed) return
    }
    onClose()
  }

  const onSubmit = handleSubmit(async (data) => {
    if (!guardianId) return
    const existingGuardians = student.guardians || []

    // Spread the stored guardian first so guardianId, hasPortalAccess and every
    // field this form does not expose (address, occupation, alternatePhone…)
    // survive — the backend replaces the whole guardians array on write.
    const guardians = existingGuardians.map((g) =>
      g.guardianId === guardianId
        ? {
            ...g,
            firstName: data.firstName,
            lastName: data.lastName,
            relationship: data.relationship,
            email: data.email || undefined,
            phone: data.phone,
            isPrimary: data.isPrimary,
            canPickup: data.canPickup,
          }
        : g,
    )

    try {
      await updateMutation.mutateAsync({
        studentId: student.studentId,
        data: { guardians },
      })
      onClose()
    } catch (error) {
      const parsed = parseApiError(error)
      if (parsed.fieldErrors) {
        Object.entries(parsed.fieldErrors).forEach(([field, message]) => {
          setError(field as keyof GuardianFormData, { message })
        })
      }
    }
  })

  if (!guardian) return null

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t('studentProfile.guardian.editTitle')}
      description={t('studentProfile.guardian.editDescription', {
        guardian: `${guardian.firstName} ${guardian.lastName}`,
      })}
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Name Row */}
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('studentProfile.guardian.firstName')} required error={errors.firstName?.message}>
            <Input
              {...register('firstName')}
              ref={(e) => {
                register('firstName').ref(e)
                if (e) firstInputRef.current = e
              }}
              placeholder={t('studentProfile.guardian.firstNamePlaceholder')}
              disabled={isSubmitting}
            />
          </Field>
          <Field label={t('studentProfile.guardian.lastName')} required error={errors.lastName?.message}>
            <Input
              {...register('lastName')}
              placeholder={t('studentProfile.guardian.lastNamePlaceholder')}
              disabled={isSubmitting}
            />
          </Field>
        </div>

        {/* Relationship */}
        <Controller
          name="relationship"
          control={control}
          render={({ field, fieldState }) => (
            <Select
              label={t('studentProfile.guardian.relationship')}
              required
              value={field.value}
              onChange={field.onChange}
              disabled={isSubmitting}
              error={fieldState.error?.message}
              options={RELATIONSHIP_VALUES.map((value) => ({
                value,
                label: t(`studentProfile.guardian.relationships.${value}`),
              }))}
            />
          )}
        />

        {/* Contact Info */}
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('studentProfile.guardian.phone')} required error={errors.phone?.message}>
            <Input
              type="tel"
              {...register('phone')}
              prefix={
                <span className="border-r border-[rgb(var(--border-primary))] pr-2 text-[rgb(var(--text-secondary))]">
                  {phoneFmt.dialCode}
                </span>
              }
              placeholder={phoneFmt.placeholder}
              disabled={isSubmitting}
            />
          </Field>
          <Field label={t('studentProfile.guardian.email')} optionalText={null} error={errors.email?.message}>
            <Input
              type="email"
              {...register('email')}
              placeholder="guardian@example.com"
              disabled={isSubmitting}
            />
          </Field>
        </div>

        {/* Checkboxes */}
        <div className="flex items-center gap-6">
          <Controller
            name="isPrimary"
            control={control}
            render={({ field }) => (
              <Checkbox
                label={t('studentProfile.guardian.primaryContact')}
                checked={!!field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                disabled={isSubmitting}
              />
            )}
          />
          <Controller
            name="canPickup"
            control={control}
            render={({ field }) => (
              <Checkbox
                label={t('studentProfile.guardian.pickupAuthorized')}
                checked={!!field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                disabled={isSubmitting}
              />
            )}
          />
        </div>

        {isDirty && (
          <p className="text-sm text-[rgb(var(--state-warning-fg))]">
            {t('studentProfile.guardian.unsavedChanges')}
          </p>
        )}

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            {t('actions.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="min-w-32"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('actions.saving')}
              </>
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                {t('actions.saveGuardian')}
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
