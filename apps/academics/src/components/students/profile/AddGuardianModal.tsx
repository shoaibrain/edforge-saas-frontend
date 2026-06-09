/**
 * AddGuardianModal Component
 *
 * Modal for adding a guardian/parent contact to a student's profile.
 * Follows EditStaffModal pattern: react-hook-form + zodResolver,
 * @edforge/ui Modal, dirty form guard.
 *
 * Sprint 8 - FAM-01
 */

import { useEffect, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Users } from 'lucide-react'
import { Modal, ModalFooter, Button, Field, Input, Select, Checkbox } from '@edforge/ui'
import { useTenantContext } from '@edforge/forms'
import { phoneFormatForArchetype } from '@aibrains/shared-types'
import { useUpdateStudent } from '../../../hooks'
import { parseApiError } from '../../../services/academics.service'
import type { StudentProfileResponseDto } from '@aibrains/shared-types'

// ============================================================================
// TYPES
// ============================================================================

export interface AddGuardianModalProps {
  open: boolean
  onClose: () => void
  student: StudentProfileResponseDto
}

// ============================================================================
// FORM SCHEMA
// ============================================================================

const guardianFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  relationship: z.enum(['mother', 'father', 'guardian', 'grandparent', 'other']),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().min(1, 'Phone is required').max(20),
  isPrimary: z.boolean(),
  canPickup: z.boolean(),
})

type GuardianFormData = z.infer<typeof guardianFormSchema>

// ============================================================================
// OPTIONS
// ============================================================================

const RELATIONSHIP_OPTIONS = [
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'guardian', label: 'Legal Guardian' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'other', label: 'Other' },
] as const

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AddGuardianModal({
  open,
  onClose,
  student,
}: AddGuardianModalProps) {
  const firstInputRef = useRef<HTMLInputElement>(null)
  const updateMutation = useUpdateStudent()

  // Sprint A.15 — archetype-aware phone format hint (e.g., +977 for PABSON).
  const { archetype, country } = useTenantContext()
  const phoneFmt = phoneFormatForArchetype(archetype, country)

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

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      reset({
        firstName: '',
        lastName: '',
        relationship: 'guardian',
        email: '',
        phone: '',
        isPrimary: false,
        canPickup: true,
      })
    }
  }, [open, reset])

  // Auto-focus first input
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

  const onSubmit = handleSubmit(async (data) => {
    const existingGuardians = student.guardians || []
    const newGuardian = {
      firstName: data.firstName,
      lastName: data.lastName,
      relationship: data.relationship,
      email: data.email || undefined,
      phone: data.phone,
      isPrimary: data.isPrimary,
      canPickup: data.canPickup,
      hasPortalAccess: false,
    }

    try {
      await updateMutation.mutateAsync({
        studentId: student.studentId,
        data: {
          guardians: [...existingGuardians, newGuardian],
        },
      })
      onClose()
    } catch (error) {
      const parsed = parseApiError(error as Error)
      if (parsed.fieldErrors) {
        Object.entries(parsed.fieldErrors).forEach(([field, message]) => {
          setError(field as keyof GuardianFormData, { message })
        })
      }
    }
  })

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Guardian"
      description={`Add a parent or guardian to ${student.fullName}'s profile`}
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Name Row */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="First Name" required error={errors.firstName?.message}>
            <Input
              {...register('firstName')}
              ref={(e) => {
                register('firstName').ref(e)
                if (e) firstInputRef.current = e
              }}
              placeholder="Guardian first name"
              disabled={isSubmitting}
            />
          </Field>
          <Field label="Last Name" required error={errors.lastName?.message}>
            <Input
              {...register('lastName')}
              placeholder="Guardian last name"
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
              label="Relationship"
              required
              value={field.value}
              onChange={field.onChange}
              disabled={isSubmitting}
              error={fieldState.error?.message}
              options={RELATIONSHIP_OPTIONS}
            />
          )}
        />

        {/* Contact Info */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone" required error={errors.phone?.message}>
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
          <Field label="Email" optionalText={null} error={errors.email?.message}>
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
                label="Primary Contact"
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
                label="Pickup Authorized"
                checked={!!field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                disabled={isSubmitting}
              />
            )}
          />
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
            className="min-w-32"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                Add Guardian
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
