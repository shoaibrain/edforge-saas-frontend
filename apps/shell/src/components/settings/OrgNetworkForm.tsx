/**
 * OrgNetworkForm
 *
 * Modal form for creating or editing an Education Organization Network.
 * Uses React Hook Form + Zod validation with the createEducationOrgNetworkSchema.
 */

import { useEffect } from 'react'
import { useForm, FormProvider, zodResolver, TextField, SelectField } from '@edforge/forms'
import { useFormDirtyGuard } from '@/hooks/useFormDirtyGuard'
import { Modal, ModalFooter, Button } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import { Info } from 'lucide-react'
import { Tooltip } from '@edforge/ui'
import {
  createEducationOrgNetworkSchema,
  type CreateEducationOrgNetworkDto,
  OPERATIONAL_STATUS_DESCRIPTORS,
  NETWORK_PURPOSE_DESCRIPTORS,
} from '@aibrains/shared-types'
import { useCreateNetwork, useUpdateNetwork, useNetwork } from '@/hooks/useEducationOrgs'
import {
  CategoryArraySection,
  AddressArraySection,
  TelephoneArraySection,
  IdentificationCodeArraySection,
} from './edorg-form-sections'

// ============================================================================
// TYPES
// ============================================================================

export interface OrgNetworkFormProps {
  open: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  editId?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function OrgNetworkForm({ open, onClose, mode, editId }: OrgNetworkFormProps) {
  const { t } = useTranslation('settings')
  const isEdit = mode === 'edit'
  const createMutation = useCreateNetwork()
  const updateMutation = useUpdateNetwork()
  const { data: existingNetwork } = useNetwork(editId || '', isEdit && !!editId)

  const methods = useForm<CreateEducationOrgNetworkDto>({
    resolver: zodResolver(createEducationOrgNetworkSchema),
    mode: 'onBlur',
    defaultValues: {
      educationOrganizationNetworkId: undefined,
      nameOfInstitution: '',
      shortNameOfInstitution: '',
      webSite: '',
      networkPurposeDescriptor: 'Collaborative',
      operationalStatusDescriptor: 'Active',
      categories: [{ educationOrganizationCategoryDescriptor: '' }],
      addresses: [],
      telephones: [],
      identificationCodes: [],
    },
  })

  const {
    handleSubmit,
    reset,
    formState: { isDirty },
  } = methods
  const { guardedClose } = useFormDirtyGuard({ isDirty, onClose })

  // Populate form for edit mode
  useEffect(() => {
    if (open && isEdit && existingNetwork) {
      reset({
        educationOrganizationNetworkId: existingNetwork.educationOrganizationNetworkId,
        nameOfInstitution: existingNetwork.nameOfInstitution,
        shortNameOfInstitution: existingNetwork.shortNameOfInstitution || '',
        webSite: existingNetwork.webSite || '',
        networkPurposeDescriptor: existingNetwork.networkPurposeDescriptor,
        operationalStatusDescriptor: existingNetwork.operationalStatusDescriptor,
        categories:
          existingNetwork.categories.length > 0
            ? existingNetwork.categories
            : [{ educationOrganizationCategoryDescriptor: '' }],
        addresses: existingNetwork.addresses || [],
        telephones: existingNetwork.telephones || [],
        identificationCodes: existingNetwork.identificationCodes || [],
      })
    }
  }, [open, isEdit, existingNetwork, reset])

  // Reset on close
  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  const isPending = createMutation.isPending || updateMutation.isPending
  const operationalStatusOptions = OPERATIONAL_STATUS_DESCRIPTORS.map((option) => ({
    ...option,
    label: t(`organization.status.${option.value}`, {
      defaultValue: option.label,
    }),
  }))
  const networkPurposeOptions = NETWORK_PURPOSE_DESCRIPTORS.map((option) => ({
    ...option,
    label: t(`organization.descriptors.networkPurpose.${option.value}`, {
      defaultValue: option.label,
    }),
  }))

  const onSubmit = handleSubmit((data) => {
    const cleanData = {
      ...data,
      shortNameOfInstitution: data.shortNameOfInstitution || undefined,
      webSite: data.webSite || undefined,
      addresses: data.addresses?.length ? data.addresses : undefined,
      telephones: data.telephones?.length ? data.telephones : undefined,
      identificationCodes: data.identificationCodes?.length ? data.identificationCodes : undefined,
    }

    if (isEdit && existingNetwork) {
      const { educationOrganizationNetworkId: _, ...updateData } = cleanData
      updateMutation.mutate({ id: existingNetwork.id, data: updateData }, { onSuccess: () => onClose() })
    } else {
      createMutation.mutate(cleanData, { onSuccess: () => onClose() })
    }
  })

  return (
    <Modal
      open={open}
      onClose={guardedClose}
      title={isEdit ? t('organization.networkForm.editTitle') : t('organization.networkForm.createTitle')}
      description={t('organization.networkForm.description')}
      size="2xl"
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="space-y-6 max-h-[60vh] overflow-y-auto px-1 py-2">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                name="educationOrganizationNetworkId"
                type="number"
                required
                readOnly={isEdit}
                placeholder="e.g., 300001"
                rules={{ valueAsNumber: true }}
                label={
                  <>
                    {t('organization.fields.edFiId')}
                    <Tooltip content={t('organization.networkForm.edFiIdHelp')} side="top">
                      <Info className="inline w-3.5 h-3.5 ms-1 text-[rgb(var(--text-tertiary))] cursor-help align-text-bottom" />
                    </Tooltip>
                  </>
                }
              />
              <TextField
                name="nameOfInstitution"
                label={t('organization.fields.name')}
                required
                placeholder="e.g., Metro Area STEM Collaborative"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                name="shortNameOfInstitution"
                label={t('organization.fields.shortName')}
                placeholder="e.g., Metro STEM"
              />
              <TextField
                name="webSite"
                label={t('organization.fields.website')}
                type="url"
                placeholder="https://www.example.org"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField
                name="networkPurposeDescriptor"
                required
                options={networkPurposeOptions}
                label={
                  <>
                    {t('organization.networkForm.networkPurpose')}
                    <Tooltip content={t('organization.networkForm.networkPurposeHelp')} side="top">
                      <Info className="inline w-3.5 h-3.5 ms-1 text-[rgb(var(--text-tertiary))] cursor-help align-text-bottom" />
                    </Tooltip>
                  </>
                }
              />
              <SelectField
                name="operationalStatusDescriptor"
                options={operationalStatusOptions}
                label={
                  <>
                    {t('organization.fields.operationalStatus')}
                    <Tooltip content={t('organization.networkForm.operationalStatusHelp')} side="top">
                      <Info className="inline w-3.5 h-3.5 ms-1 text-[rgb(var(--text-tertiary))] cursor-help align-text-bottom" />
                    </Tooltip>
                  </>
                }
              />
            </div>
          </div>

          <div className="border-t border-[rgb(var(--border-primary))]" />
          <CategoryArraySection orgType="network" />
          <div className="border-t border-[rgb(var(--border-primary))]" />
          <AddressArraySection />
          <div className="border-t border-[rgb(var(--border-primary))]" />
          <TelephoneArraySection />
          <div className="border-t border-[rgb(var(--border-primary))]" />
          <IdentificationCodeArraySection />
        </form>
      </FormProvider>

      <ModalFooter>
        <Button variant="outline" onClick={guardedClose} disabled={isPending}>
          {t('organization.actions.cancel')}
        </Button>
        <Button onClick={onSubmit} isLoading={isPending}>
          {isEdit ? t('organization.networkForm.updateAction') : t('organization.networkForm.createAction')}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default OrgNetworkForm
