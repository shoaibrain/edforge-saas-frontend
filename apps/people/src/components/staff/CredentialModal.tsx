/**
 * CredentialModal Component
 *
 * Create/Edit modal for staff credentials.
 * Uses react-hook-form + zod (createCredentialSchema).
 */

import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Plus, Save } from 'lucide-react'
import {
  createCredentialSchema,
  type CreateCredentialDto,
  type CredentialResponseDto,
} from '@aibrains/shared-types'
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CreateCredentialDto>({
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

  const inputClass = (hasError: boolean) => `
    w-full px-3 py-2 rounded-lg border
    bg-surface-secondary text-text-primary
    placeholder:text-text-tertiary
    focus:outline-none focus:ring-2 focus:ring-accent-primary/20
    transition-colors disabled:opacity-50 disabled:cursor-not-allowed
    ${hasError ? 'border-[rgb(var(--state-danger-border))]' : 'border-border-secondary'}
  `

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditing ? 'Edit Credential' : 'Add Credential'}
      description={isEditing ? 'Update credential information' : 'Add a new credential for this staff member'}
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
        {/* Name & Identifier */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="cred-name" className="block text-sm font-medium text-text-primary mb-1.5">
              Name <span className="text-[rgb(var(--state-danger-fg))]">*</span>
            </label>
            <input
              id="cred-name"
              type="text"
              {...register('name')}
              ref={(e) => {
                register('name').ref(e)
                if (e) firstInputRef.current = e
              }}
              className={inputClass(!!errors.name)}
              placeholder="e.g., State Teaching License"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-[rgb(var(--state-danger-fg))]">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="cred-identifier" className="block text-sm font-medium text-text-primary mb-1.5">
              Credential ID <span className="text-[rgb(var(--state-danger-fg))]">*</span>
            </label>
            <input
              id="cred-identifier"
              type="text"
              {...register('credentialIdentifier')}
              className={inputClass(!!errors.credentialIdentifier)}
              placeholder="e.g., LIC-2024-12345"
              disabled={isSubmitting || isEditing}
            />
            {errors.credentialIdentifier && (
              <p className="mt-1 text-sm text-[rgb(var(--state-danger-fg))]">{errors.credentialIdentifier.message}</p>
            )}
          </div>
        </div>

        {/* Type & Field */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="cred-type" className="block text-sm font-medium text-text-primary mb-1.5">
              Type <span className="text-[rgb(var(--state-danger-fg))]">*</span>
            </label>
            <select
              id="cred-type"
              {...register('credentialTypeDescriptor')}
              className={inputClass(!!errors.credentialTypeDescriptor)}
              disabled={isSubmitting}
            >
              {CREDENTIAL_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cred-field" className="block text-sm font-medium text-text-primary mb-1.5">
              Field/Subject Area
            </label>
            <select
              id="cred-field"
              {...register('credentialFieldDescriptor')}
              className={inputClass(!!errors.credentialFieldDescriptor)}
              disabled={isSubmitting}
            >
              <option value="">None</option>
              {CREDENTIAL_FIELD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Issuing Organization & State */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="cred-org" className="block text-sm font-medium text-text-primary mb-1.5">
              Issuing Organization <span className="text-[rgb(var(--state-danger-fg))]">*</span>
            </label>
            <input
              id="cred-org"
              type="text"
              {...register('issuingOrganization')}
              className={inputClass(!!errors.issuingOrganization)}
              placeholder="e.g., State Board of Education"
              disabled={isSubmitting}
            />
            {errors.issuingOrganization && (
              <p className="mt-1 text-sm text-[rgb(var(--state-danger-fg))]">{errors.issuingOrganization.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="cred-state" className="block text-sm font-medium text-text-primary mb-1.5">
              Issuing State
            </label>
            <input
              id="cred-state"
              type="text"
              {...register('issuingState')}
              className={inputClass(!!errors.issuingState)}
              placeholder="e.g., Texas"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="cred-issuance" className="block text-sm font-medium text-text-primary mb-1.5">
              Issuance Date <span className="text-[rgb(var(--state-danger-fg))]">*</span>
            </label>
            <input
              id="cred-issuance"
              type="date"
              {...register('issuanceDate')}
              className={inputClass(!!errors.issuanceDate)}
              disabled={isSubmitting}
            />
            {errors.issuanceDate && (
              <p className="mt-1 text-sm text-[rgb(var(--state-danger-fg))]">{errors.issuanceDate.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="cred-expiration" className="block text-sm font-medium text-text-primary mb-1.5">
              Expiration Date
            </label>
            <input
              id="cred-expiration"
              type="date"
              {...register('expirationDate')}
              className={inputClass(!!errors.expirationDate)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="cred-description" className="block text-sm font-medium text-text-primary mb-1.5">
            Description
          </label>
          <textarea
            id="cred-description"
            {...register('description')}
            className={inputClass(!!errors.description)}
            rows={2}
            placeholder="Additional details about this credential..."
            disabled={isSubmitting}
          />
        </div>

        {/* Document URL */}
        <div>
          <label htmlFor="cred-docUrl" className="block text-sm font-medium text-text-primary mb-1.5">
            Document URL
          </label>
          <input
            id="cred-docUrl"
            type="url"
            {...register('documentUrl')}
            className={inputClass(!!errors.documentUrl)}
            placeholder="https://..."
            disabled={isSubmitting}
          />
        </div>

        {/* Renewal Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 pt-6">
            <input
              id="cred-renewable"
              type="checkbox"
              {...register('isRenewable')}
              className="w-4 h-4 rounded border-border-secondary text-[rgb(var(--action-secondary-fg))] focus:ring-2 focus:ring-accent-primary/20"
              disabled={isSubmitting}
            />
            <label htmlFor="cred-renewable" className="text-sm text-text-primary">
              Renewable credential
            </label>
          </div>
          <div>
            <label htmlFor="cred-reminder" className="block text-sm font-medium text-text-primary mb-1.5">
              Reminder Days Before Expiry
            </label>
            <input
              id="cred-reminder"
              type="number"
              {...register('renewalReminderDays', { valueAsNumber: true })}
              className={inputClass(!!errors.renewalReminderDays)}
              min={0}
              max={365}
              disabled={isSubmitting}
            />
          </div>
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
            disabled={isSubmitting}
            className="min-w-36"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditing ? 'Saving...' : 'Adding...'}
              </>
            ) : (
              <>
                {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                {isEditing ? 'Save Changes' : 'Add Credential'}
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
