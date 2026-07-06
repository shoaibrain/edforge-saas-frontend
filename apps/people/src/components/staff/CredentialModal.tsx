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
import { useTranslation } from '@edforge/i18n'
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
  const { t } = useTranslation('people')
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
        t('common.unsavedCloseConfirm')
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
        toast.success(t('credentials.toasts.updated'))
      } else {
        await createCredential.mutateAsync({ staffId, data })
        toast.success(t('credentials.toasts.added'))
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
      title={isEditing ? t('credentials.modal.editTitle') : t('credentials.modal.addTitle')}
      description={isEditing ? t('credentials.modal.editDescription') : t('credentials.modal.addDescription')}
      size="lg"
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto pe-1">
          {/* Name & Identifier */}
          <div className="grid grid-cols-2 gap-4">
            <TextField
              ref={firstInputRef}
              name="name"
              label={t('fields.name')}
              type="text"
              required
              placeholder="e.g., State Teaching License"
              disabled={isSubmitting}
            />
            <TextField
              name="credentialIdentifier"
              label={t('credentials.fields.credentialId')}
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
              label={t('drawer.type')}
              required
              options={CREDENTIAL_TYPE_OPTIONS.map((option) => ({
                ...option,
                label: t(`credentials.types.${option.value}`, { defaultValue: option.label }),
              }))}
              disabled={isSubmitting}
            />
            <SelectField
              name="credentialFieldDescriptor"
              label={t('credentials.fields.fieldSubjectArea')}
              options={CREDENTIAL_FIELD_SELECT_OPTIONS.map((option) => ({
                ...option,
                label: option.value ? t(`credentials.fieldsBySubject.${option.value}`, { defaultValue: option.label }) : t('common.none'),
              }))}
              placeholder={t('common.none')}
              disabled={isSubmitting}
            />
          </div>

          {/* Issuing Organization & State */}
          <div className="grid grid-cols-2 gap-4">
            <TextField
              name="issuingOrganization"
              label={t('credentials.fields.issuingOrganization')}
              type="text"
              required
              placeholder="e.g., State Board of Education"
              disabled={isSubmitting}
            />
            <TextField
              name="issuingState"
              label={t('credentials.fields.issuingState')}
              type="text"
              placeholder="e.g., Texas"
              disabled={isSubmitting}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <DateField
              name="issuanceDate"
              label={t('credentials.fields.issuanceDate')}
              required
              disabled={isSubmitting}
            />
            <DateField
              name="expirationDate"
              label={t('credentials.fields.expirationDate')}
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <TextareaField
            name="description"
            label={t('credentials.fields.description')}
            rows={2}
            placeholder="Additional details about this credential..."
            disabled={isSubmitting}
          />

          {/* Document URL */}
          <TextField
            name="documentUrl"
            label={t('credentials.fields.documentUrl')}
            type="url"
            placeholder="https://..."
            disabled={isSubmitting}
          />

          {/* Renewal Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center pt-6">
              <CheckboxField
                name="isRenewable"
                label={t('credentials.fields.renewable')}
                disabled={isSubmitting}
              />
            </div>
            <TextField
              name="renewalReminderDays"
              label={t('credentials.fields.renewalReminderDays')}
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
              {t('actions.cancel')}
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="min-w-36"
            >
              {isEditing ? t('actions.saveChanges') : t('actions.addCredential')}
            </Button>
          </ModalFooter>
        </form>
      </FormProvider>
    </Modal>
  )
}
