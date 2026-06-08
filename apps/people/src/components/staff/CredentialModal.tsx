/**
 * CredentialModal Component
 *
 * Create/Edit modal for staff credentials.
 * Uses react-hook-form + zod (createCredentialSchema).
 */

import { useEffect, useRef } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  createCredentialSchema,
  type CreateCredentialDto,
  type CredentialResponseDto,
} from '@aibrains/shared-types'
import { TextField, SelectField, DateField, TextareaField, CheckboxField } from '@edforge/forms'
import { Modal, ModalFooter, Button } from '../ui'
import { useCreateCredential, useUpdateCredential } from '../../hooks'
import { parseApiError } from '../../services/people.service'

// ============================================================================
// CONSTANTS
// ============================================================================

const CREDENTIAL_TYPE_OPTIONS = [
  { value: 'certification', label: 'Certification' },
  { value: 'license', label: 'License' },
  { value: 'endorsement', label: 'Endorsement' },
  { value: 'degree', label: 'Degree' },
  { value: 'registration', label: 'Registration' },
  { value: 'permit', label: 'Permit' },
  { value: 'clearance', label: 'Clearance' },
  { value: 'training', label: 'Training' },
  { value: 'other', label: 'Other' },
]

const CREDENTIAL_FIELD_OPTIONS = [
  { value: 'elementary_education', label: 'Elementary Education' },
  { value: 'secondary_education', label: 'Secondary Education' },
  { value: 'special_education', label: 'Special Education' },
  { value: 'early_childhood', label: 'Early Childhood' },
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'science', label: 'Science' },
  { value: 'english_language_arts', label: 'English Language Arts' },
  { value: 'social_studies', label: 'Social Studies' },
  { value: 'foreign_language', label: 'Foreign Language' },
  { value: 'physical_education', label: 'Physical Education' },
  { value: 'music', label: 'Music' },
  { value: 'art', label: 'Art' },
  { value: 'technology', label: 'Technology' },
  { value: 'counseling', label: 'Counseling' },
  { value: 'administration', label: 'Administration' },
  { value: 'library_media', label: 'Library Media' },
  { value: 'other', label: 'Other' },
]

const CREDENTIAL_FIELD_SELECT_OPTIONS = [
  { value: '', label: 'None' },
  ...CREDENTIAL_FIELD_OPTIONS,
]

// ============================================================================
// TYPES
// ============================================================================

export interface CredentialModalProps {
  open: boolean
  onClose: () => void
  staffId: string
  credential?: CredentialResponseDto | null
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CredentialModal({
  open,
  onClose,
  staffId,
  credential,
}: CredentialModalProps) {
  const firstInputRef = useRef<HTMLInputElement>(null)
  const isEditing = !!credential
  const createCredential = useCreateCredential()
  const updateCredential = useUpdateCredential()

  const methods = useForm<CreateCredentialDto>({
    resolver: zodResolver(createCredentialSchema),
    defaultValues: {
      credentialIdentifier: '',
      credentialTypeDescriptor: 'certification',
      issuanceDate: '',
      issuingOrganization: '',
      name: '',
      verificationStatus: 'pending',
      isRenewable: true,
      renewalReminderDays: 90,
    },
  })

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = methods

  // Populate form when editing
  useEffect(() => {
    if (open && credential) {
      reset({
        credentialIdentifier: credential.credentialIdentifier,
        credentialTypeDescriptor: credential.credentialTypeDescriptor,
        credentialFieldDescriptor: credential.credentialFieldDescriptor,
        issuanceDate: credential.issuanceDate,
        expirationDate: credential.expirationDate,
        issuingState: credential.issuingState,
        issuingOrganization: credential.issuingOrganization,
        name: credential.name,
        description: credential.description,
        documentUrl: credential.documentUrl,
        documentFileName: credential.documentFileName,
        verificationStatus: credential.verificationStatus,
        isRenewable: credential.isRenewable,
        renewalReminderDays: credential.renewalReminderDays,
      })
    } else if (open) {
      reset({
        credentialIdentifier: '',
        credentialTypeDescriptor: 'certification',
        issuanceDate: '',
        issuingOrganization: '',
        name: '',
        verificationStatus: 'pending',
        isRenewable: true,
        renewalReminderDays: 90,
      })
    }
  }, [open, credential, reset])

  // Auto-focus
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
    try {
      if (isEditing) {
        await updateCredential.mutateAsync({
          staffId,
          credentialId: credential.credentialId,
          data,
        })
        toast.success('Credential updated successfully')
      } else {
        await createCredential.mutateAsync({ staffId, data })
        toast.success('Credential added successfully')
      }
      onClose()
    } catch (error) {
      const parsed = parseApiError(error)
      toast.error(parsed.message)
    }
  })

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditing ? 'Edit Credential' : 'Add Credential'}
      description={isEditing ? 'Update credential information' : 'Add a new credential for this staff member'}
      size="lg"
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          {/* Name & Identifier */}
          <div className="grid grid-cols-2 gap-4">
            <TextField
              ref={firstInputRef}
              name="name"
              label="Name"
              type="text"
              required
              placeholder="e.g., State Teaching License"
              disabled={isSubmitting}
            />
            <TextField
              name="credentialIdentifier"
              label="Credential ID"
              type="text"
              required
              placeholder="e.g., LIC-2024-12345"
              disabled={isSubmitting || isEditing}
            />
          </div>

          {/* Type & Field */}
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              name="credentialTypeDescriptor"
              label="Type"
              required
              options={CREDENTIAL_TYPE_OPTIONS}
              disabled={isSubmitting}
            />
            <SelectField
              name="credentialFieldDescriptor"
              label="Field/Subject Area"
              options={CREDENTIAL_FIELD_SELECT_OPTIONS}
              placeholder="None"
              disabled={isSubmitting}
            />
          </div>

          {/* Issuing Organization & State */}
          <div className="grid grid-cols-2 gap-4">
            <TextField
              name="issuingOrganization"
              label="Issuing Organization"
              type="text"
              required
              placeholder="e.g., State Board of Education"
              disabled={isSubmitting}
            />
            <TextField
              name="issuingState"
              label="Issuing State"
              type="text"
              placeholder="e.g., Texas"
              disabled={isSubmitting}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <DateField
              name="issuanceDate"
              label="Issuance Date"
              required
              disabled={isSubmitting}
            />
            <DateField
              name="expirationDate"
              label="Expiration Date"
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <TextareaField
            name="description"
            label="Description"
            rows={2}
            placeholder="Additional details about this credential..."
            disabled={isSubmitting}
          />

          {/* Document URL */}
          <TextField
            name="documentUrl"
            label="Document URL"
            type="url"
            placeholder="https://..."
            disabled={isSubmitting}
          />

          {/* Renewal Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center pt-6">
              <CheckboxField
                name="isRenewable"
                label="Renewable credential"
                disabled={isSubmitting}
              />
            </div>
            <TextField
              name="renewalReminderDays"
              label="Reminder Days Before Expiry"
              type="number"
              rules={{ valueAsNumber: true }}
              min={0}
              max={365}
              disabled={isSubmitting}
            />
          </div>

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
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="min-w-36"
            >
              {isEditing ? 'Save Changes' : 'Add Credential'}
            </Button>
          </ModalFooter>
        </form>
      </FormProvider>
    </Modal>
  )
}
