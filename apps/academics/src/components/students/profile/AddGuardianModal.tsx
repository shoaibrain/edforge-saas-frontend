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
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Users } from 'lucide-react'
import { Modal, ModalFooter, Button } from '@edforge/ui'
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

  const inputClass = (hasError: boolean) => `
    w-full px-3 py-2 rounded-lg border
    bg-surface-secondary text-text-primary
    placeholder:text-text-tertiary
    focus:outline-none focus:ring-2 focus:ring-accent-primary/20
    transition-colors
    ${hasError ? 'border-[rgb(var(--state-danger-border))]' : 'border-border-secondary'}
  `

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
          <div>
            <label htmlFor="guardianFirstName" className="block text-sm font-medium text-text-primary mb-1.5">
              First Name <span className="text-[rgb(var(--state-danger-fg))]">*</span>
            </label>
            <input
              id="guardianFirstName"
              type="text"
              {...register('firstName')}
              ref={(e) => {
                register('firstName').ref(e)
                if (e) firstInputRef.current = e
              }}
              className={inputClass(!!errors.firstName)}
              placeholder="Guardian first name"
              disabled={isSubmitting}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-[rgb(var(--state-danger-fg))]">{errors.firstName.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="guardianLastName" className="block text-sm font-medium text-text-primary mb-1.5">
              Last Name <span className="text-[rgb(var(--state-danger-fg))]">*</span>
            </label>
            <input
              id="guardianLastName"
              type="text"
              {...register('lastName')}
              className={inputClass(!!errors.lastName)}
              placeholder="Guardian last name"
              disabled={isSubmitting}
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-[rgb(var(--state-danger-fg))]">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Relationship */}
        <div>
          <label htmlFor="relationship" className="block text-sm font-medium text-text-primary mb-1.5">
            Relationship <span className="text-[rgb(var(--state-danger-fg))]">*</span>
          </label>
          <select
            id="relationship"
            {...register('relationship')}
            className={inputClass(!!errors.relationship)}
            disabled={isSubmitting}
          >
            {RELATIONSHIP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {errors.relationship && (
            <p className="mt-1 text-sm text-[rgb(var(--state-danger-fg))]">{errors.relationship.message}</p>
          )}
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="guardianPhone" className="block text-sm font-medium text-text-primary mb-1.5">
              Phone <span className="text-[rgb(var(--state-danger-fg))]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary pointer-events-none border-r border-border-primary pr-2">
                {phoneFmt.dialCode}
              </span>
              <input
                id="guardianPhone"
                type="tel"
                {...register('phone')}
                className={`${inputClass(!!errors.phone)} pl-16`}
                placeholder={phoneFmt.placeholder}
                disabled={isSubmitting}
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-sm text-[rgb(var(--state-danger-fg))]">{errors.phone.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="guardianEmail" className="block text-sm font-medium text-text-primary mb-1.5">
              Email
            </label>
            <input
              id="guardianEmail"
              type="email"
              {...register('email')}
              className={inputClass(!!errors.email)}
              placeholder="guardian@example.com"
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-[rgb(var(--state-danger-fg))]">{errors.email.message}</p>
            )}
          </div>
        </div>

        {/* Checkboxes */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <input
              id="isPrimary"
              type="checkbox"
              {...register('isPrimary')}
              className="w-4 h-4 rounded border-border-secondary text-[rgb(var(--action-secondary-fg))] focus:ring-[rgb(var(--border-focus)/0.35)]"
              disabled={isSubmitting}
            />
            <label htmlFor="isPrimary" className="text-sm text-text-primary">
              Primary Contact
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="canPickup"
              type="checkbox"
              {...register('canPickup')}
              className="w-4 h-4 rounded border-border-secondary text-[rgb(var(--action-secondary-fg))] focus:ring-[rgb(var(--border-focus)/0.35)]"
              disabled={isSubmitting}
            />
            <label htmlFor="canPickup" className="text-sm text-text-primary">
              Pickup Authorized
            </label>
          </div>
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
            className="min-w-[120px]"
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
