/**
 * ESC Form
 *
 * Modal form for creating or editing an Education Service Center.
 * Uses React Hook Form + Zod validation with the createEducationServiceCenterSchema.
 */

import { useEffect } from 'react'
import { useForm, FormProvider, zodResolver, TextField, SelectField } from '@edforge/forms'
import { useFormDirtyGuard } from '@/hooks/useFormDirtyGuard'
import { Modal, ModalFooter, Button } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import { MapPin, Network, Info } from 'lucide-react'
import {
  createEducationServiceCenterSchema,
  type CreateEducationServiceCenterDto,
  OPERATIONAL_STATUS_DESCRIPTORS,
} from '@aibrains/shared-types'
import { Tooltip } from '@edforge/ui'
import {
  useCreateEsc,
  useUpdateEsc,
  useEducationServiceCenter,
  useStateEducationAgency,
} from '@/hooks/useEducationOrgs'
import {
  AddressArraySection,
  TelephoneArraySection,
  IdentificationCodeArraySection,
  CategoryArraySection,
} from './edorg-form-sections'

// ============================================================================
// TYPES
// ============================================================================

export interface ESCFormProps {
  open: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  editId?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ESCForm({ open, onClose, mode, editId }: ESCFormProps) {
  const { t } = useTranslation('settings')
  const isEdit = mode === 'edit'
  const createMutation = useCreateEsc()
  const updateMutation = useUpdateEsc()
  const { data: existingEsc } = useEducationServiceCenter(editId || '', isEdit && !!editId)
  const { data: sea } = useStateEducationAgency()

  const methods = useForm<CreateEducationServiceCenterDto>({
    resolver: zodResolver(createEducationServiceCenterSchema),
    mode: 'onBlur',
    defaultValues: {
      educationServiceCenterId: undefined,
      nameOfInstitution: '',
      shortNameOfInstitution: '',
      webSite: '',
      operationalStatusDescriptor: 'Active',
      stateEducationAgencyId: '',
      categories: [{ educationOrganizationCategoryDescriptor: '' }],
      addresses: [],
      telephones: [],
      identificationCodes: [],
    },
  })

  const { handleSubmit, reset, formState: { isDirty } } = methods
  const { guardedClose } = useFormDirtyGuard({ isDirty, onClose })

  // Populate form for edit mode
  useEffect(() => {
    if (open && isEdit && existingEsc) {
      reset({
        educationServiceCenterId: existingEsc.educationServiceCenterId,
        nameOfInstitution: existingEsc.nameOfInstitution,
        shortNameOfInstitution: existingEsc.shortNameOfInstitution || '',
        webSite: existingEsc.webSite || '',
        operationalStatusDescriptor: existingEsc.operationalStatusDescriptor,
        stateEducationAgencyId: existingEsc.stateEducationAgencyId || '',
        categories: existingEsc.categories.length > 0
          ? existingEsc.categories
          : [{ educationOrganizationCategoryDescriptor: '' }],
        addresses: existingEsc.addresses || [],
        telephones: existingEsc.telephones || [],
        identificationCodes: existingEsc.identificationCodes || [],
      })
    }
  }, [open, isEdit, existingEsc, reset])

  // Reset on close
  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  const isPending = createMutation.isPending || updateMutation.isPending
  const operationalStatusOptions = OPERATIONAL_STATUS_DESCRIPTORS.map((option) => ({
    ...option,
    label: t(`organization.status.${option.value}`, { defaultValue: option.label }),
  }))

  const onSubmit = handleSubmit((data) => {
    const cleanData = {
      ...data,
      shortNameOfInstitution: data.shortNameOfInstitution || undefined,
      webSite: data.webSite || undefined,
      stateEducationAgencyId: data.stateEducationAgencyId || undefined,
      addresses: data.addresses?.length ? data.addresses : undefined,
      telephones: data.telephones?.length ? data.telephones : undefined,
      identificationCodes: data.identificationCodes?.length ? data.identificationCodes : undefined,
    }

    if (isEdit && existingEsc) {
      const { educationServiceCenterId: _, ...updateData } = cleanData
      updateMutation.mutate(
        { id: existingEsc.id, data: updateData },
        { onSuccess: () => onClose() }
      )
    } else {
      createMutation.mutate(cleanData, { onSuccess: () => onClose() })
    }
  })

  return (
    <Modal
      open={open}
      onClose={guardedClose}
      title={isEdit ? t('organization.forms.esc.editTitle') : t('organization.forms.esc.createTitle')}
      description={t('organization.forms.esc.description')}
      size="2xl"
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="space-y-6 max-h-[60vh] overflow-y-auto px-1 py-2">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">{t('organization.form.basicInfo')}</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                name="educationServiceCenterId"
                type="number"
                required
                readOnly={isEdit}
                placeholder="e.g., 200001"
                rules={{ valueAsNumber: true }}
                label={
                  <>
                    {t('organization.fields.edFiId')}
                    <Tooltip content={t('organization.form.edFiIdHelp')} side="top">
                      <Info className="inline w-3.5 h-3.5 ml-1 text-[rgb(var(--text-tertiary))] cursor-help align-text-bottom" />
                    </Tooltip>
                  </>
                }
              />
              <TextField
                name="nameOfInstitution"
                label={t('organization.fields.name')}
                required
                placeholder="e.g., Region 13 ESC"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                name="shortNameOfInstitution"
                label={t('organization.fields.shortName')}
                placeholder="e.g., ESC 13"
              />
              <TextField
                name="webSite"
                label={t('organization.fields.website')}
                type="url"
                placeholder="https://www.esc13.net"
              />
            </div>

            <SelectField
              name="operationalStatusDescriptor"
              className="w-48"
              options={operationalStatusOptions}
              label={
                <>
                  {t('organization.fields.operationalStatus')}
                  <Tooltip content={t('organization.form.operationalStatusHelp')} side="top">
                    <Info className="inline w-3.5 h-3.5 ml-1 text-[rgb(var(--text-tertiary))] cursor-help align-text-bottom" />
                  </Tooltip>
                </>
              }
            />
          </div>

          <div className="border-t border-[rgb(var(--border-primary))]" />

          {/* Hierarchy */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Network className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
              <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">{t('organization.tabs.hierarchy')}</h3>
            </div>
            <SelectField
              name="stateEducationAgencyId"
              label={t('organization.entities.stateEducationAgency')}
              className="w-72"
              placeholder={t('organization.form.none')}
              clearable
              emptyValue={undefined}
              options={sea ? [{ value: sea.id, label: sea.nameOfInstitution }] : []}
            />
          </div>

          <div className="border-t border-[rgb(var(--border-primary))]" />
          <CategoryArraySection orgType="esc" />
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
          {isEdit ? t('organization.forms.esc.updateAction') : t('organization.forms.esc.createAction')}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default ESCForm
