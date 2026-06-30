/**
 * LEA Form
 *
 * Modal form for creating or editing a Local Education Agency (district).
 * Uses React Hook Form + Zod validation with the createLocalEducationAgencySchema.
 * Supports hierarchy dropdowns (SEA, ESC, parent LEA) and conditional charter fields.
 */

import { useEffect } from 'react'
import { useForm, useWatch, FormProvider, zodResolver, TextField, SelectField } from '@edforge/forms'
import { useFormDirtyGuard } from '@/hooks/useFormDirtyGuard'
import { Modal, ModalFooter, Button } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import { Building2, Network, Info } from 'lucide-react'
import {
  createLocalEducationAgencySchema,
  type CreateLocalEducationAgencyDto,
  OPERATIONAL_STATUS_DESCRIPTORS,
  LEA_CATEGORY_DESCRIPTORS,
  CHARTER_STATUS_DESCRIPTORS,
} from '@aibrains/shared-types'
import { Tooltip } from '@edforge/ui'
import {
  useCreateLea,
  useUpdateLea,
  useLocalEducationAgency,
  useLocalEducationAgencies,
  useStateEducationAgency,
  useEducationServiceCenters,
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

export interface LEAFormProps {
  open: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  editId?: string
  defaultSeaId?: string
  defaultEscId?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function LEAForm({ open, onClose, mode, editId, defaultSeaId, defaultEscId }: LEAFormProps) {
  const { t } = useTranslation('settings')
  const isEdit = mode === 'edit'
  const createMutation = useCreateLea()
  const updateMutation = useUpdateLea()
  const { data: existingLea } = useLocalEducationAgency(editId || '', isEdit && !!editId)

  // Hierarchy data for dropdowns
  const { data: sea } = useStateEducationAgency()
  const { data: escsData } = useEducationServiceCenters()
  const { data: leasData } = useLocalEducationAgencies()

  const escs = escsData?.items || []
  const allLeas = leasData?.items || []
  // Filter out self in edit mode to prevent circular reference
  const parentLeaOptions = allLeas.filter((l) => !isEdit || l.id !== editId)

  const methods = useForm<CreateLocalEducationAgencyDto>({
    resolver: zodResolver(createLocalEducationAgencySchema),
    mode: 'onBlur',
    defaultValues: {
      localEducationAgencyId: undefined,
      nameOfInstitution: '',
      shortNameOfInstitution: '',
      webSite: '',
      leaCategoryDescriptor: 'Independent',
      operationalStatusDescriptor: 'Active',
      stateEducationAgencyId: defaultSeaId || '',
      educationServiceCenterId: defaultEscId || '',
      parentLocalEducationAgencyId: undefined,
      categories: [{ educationOrganizationCategoryDescriptor: '' }],
      addresses: [],
      telephones: [],
      identificationCodes: [],
    },
  })

  const { handleSubmit, reset, setValue, control, formState: { isDirty } } = methods
  const { guardedClose } = useFormDirtyGuard({ isDirty, onClose })

  // Watch LEA category to conditionally show charter status
  const leaCategory = useWatch({ control, name: 'leaCategoryDescriptor' })
  const showCharterField = leaCategory === 'CharterLEA'
  const operationalStatusOptions = OPERATIONAL_STATUS_DESCRIPTORS.map((option) => ({
    ...option,
    label: t(`organization.status.${option.value}`, { defaultValue: option.label }),
  }))
  const leaCategoryOptions = LEA_CATEGORY_DESCRIPTORS.map((option) => ({
    ...option,
    label: t(`organization.descriptors.leaCategory.${option.value}`, { defaultValue: option.label }),
  }))
  const charterStatusOptions = CHARTER_STATUS_DESCRIPTORS.map((option) => ({
    ...option,
    label: t(`organization.descriptors.charterStatus.${option.value}`, { defaultValue: option.label }),
  }))

  // Clear charter status when switching away from CharterLEA
  useEffect(() => {
    if (!showCharterField) {
      setValue('charterStatusDescriptor', undefined)
    }
  }, [showCharterField, setValue])

  // Populate form for edit mode
  useEffect(() => {
    if (open && isEdit && existingLea) {
      reset({
        localEducationAgencyId: existingLea.localEducationAgencyId,
        nameOfInstitution: existingLea.nameOfInstitution,
        shortNameOfInstitution: existingLea.shortNameOfInstitution || '',
        webSite: existingLea.webSite || '',
        leaCategoryDescriptor: existingLea.leaCategoryDescriptor,
        charterStatusDescriptor: existingLea.charterStatusDescriptor,
        operationalStatusDescriptor: existingLea.operationalStatusDescriptor,
        stateEducationAgencyId: existingLea.stateEducationAgencyId || '',
        educationServiceCenterId: existingLea.educationServiceCenterId || '',
        parentLocalEducationAgencyId: existingLea.parentLocalEducationAgencyId || '',
        categories: existingLea.categories.length > 0
          ? existingLea.categories
          : [{ educationOrganizationCategoryDescriptor: '' }],
        addresses: existingLea.addresses || [],
        telephones: existingLea.telephones || [],
        identificationCodes: existingLea.identificationCodes || [],
      })
    }
  }, [open, isEdit, existingLea, reset])

  // Reset on close
  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = handleSubmit((data) => {
    const cleanData = {
      ...data,
      shortNameOfInstitution: data.shortNameOfInstitution || undefined,
      webSite: data.webSite || undefined,
      charterStatusDescriptor: data.charterStatusDescriptor || undefined,
      stateEducationAgencyId: data.stateEducationAgencyId || undefined,
      educationServiceCenterId: data.educationServiceCenterId || undefined,
      parentLocalEducationAgencyId: data.parentLocalEducationAgencyId || undefined,
      addresses: data.addresses?.length ? data.addresses : undefined,
      telephones: data.telephones?.length ? data.telephones : undefined,
      identificationCodes: data.identificationCodes?.length ? data.identificationCodes : undefined,
    }

    if (isEdit && existingLea) {
      const { localEducationAgencyId: _, ...updateData } = cleanData
      updateMutation.mutate(
        { id: existingLea.id, data: updateData },
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
      title={isEdit ? t('organization.forms.lea.editTitle') : t('organization.forms.lea.createTitle')}
      description={t('organization.forms.lea.description')}
      size="2xl"
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="space-y-6 max-h-[60vh] overflow-y-auto px-1 py-2">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-[rgb(var(--action-secondary-fg))] " />
              <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">{t('organization.form.basicInfo')}</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                name="localEducationAgencyId"
                type="number"
                required
                readOnly={isEdit}
                placeholder="e.g., 101912"
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
                placeholder="e.g., Austin Independent School District"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                name="shortNameOfInstitution"
                label={t('organization.fields.shortName')}
                placeholder="e.g., Austin ISD"
                rules={{ setValueAs: (v) => (v === '' ? undefined : v) }}
              />
              <TextField
                name="webSite"
                label={t('organization.fields.website')}
                type="url"
                placeholder="https://www.austinisd.org"
                rules={{ setValueAs: (v) => (v === '' ? undefined : v) }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SelectField
                name="leaCategoryDescriptor"
                required
                options={leaCategoryOptions}
                label={
                  <>
                    {t('organization.fields.leaCategory')}
                    <Tooltip content={t('organization.form.leaCategoryHelp')} side="top">
                      <Info className="inline w-3.5 h-3.5 ml-1 text-[rgb(var(--text-tertiary))] cursor-help align-text-bottom" />
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
                    <Tooltip content={t('organization.form.operationalStatusHelp')} side="top">
                      <Info className="inline w-3.5 h-3.5 ml-1 text-[rgb(var(--text-tertiary))] cursor-help align-text-bottom" />
                    </Tooltip>
                  </>
                }
              />
              {showCharterField && (
                <SelectField
                  name="charterStatusDescriptor"
                  placeholder={t('organization.form.select')}
                  clearable
                  emptyValue={undefined}
                  options={charterStatusOptions}
                  label={
                    <>
                      {t('organization.fields.charterStatus')}
                      <Tooltip content={t('organization.form.charterStatusHelp')} side="top">
                        <Info className="inline w-3.5 h-3.5 ml-1 text-[rgb(var(--text-tertiary))] cursor-help align-text-bottom" />
                      </Tooltip>
                    </>
                  }
                />
              )}
            </div>
          </div>

          <div className="border-t border-[rgb(var(--border-primary))]" />

          {/* Hierarchy */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Network className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
              <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">{t('organization.tabs.hierarchy')}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SelectField
                name="stateEducationAgencyId"
                label={t('organization.entities.stateEducationAgency')}
                placeholder={t('organization.form.none')}
                clearable
                emptyValue={undefined}
                options={sea ? [{ value: sea.id, label: sea.nameOfInstitution }] : []}
              />
              <SelectField
                name="educationServiceCenterId"
                label={t('organization.entities.serviceCenter')}
                placeholder={t('organization.form.none')}
                clearable
                emptyValue={undefined}
                options={escs.map((esc) => ({ value: esc.id, label: esc.nameOfInstitution }))}
              />
              <SelectField
                name="parentLocalEducationAgencyId"
                placeholder={t('organization.form.none')}
                clearable
                emptyValue={undefined}
                options={parentLeaOptions.map((lea) => ({ value: lea.id, label: lea.nameOfInstitution }))}
                label={
                  <>
                    {t('organization.fields.parentLea')}
                    <Tooltip content={t('organization.form.parentLeaHelp')} side="top">
                      <Info className="inline w-3.5 h-3.5 ml-1 text-[rgb(var(--text-tertiary))] cursor-help align-text-bottom" />
                    </Tooltip>
                  </>
                }
              />
            </div>
          </div>

          <div className="border-t border-[rgb(var(--border-primary))]" />
          <CategoryArraySection orgType="lea" />
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
          {isEdit ? t('organization.forms.lea.updateAction') : t('organization.forms.lea.createAction')}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default LEAForm
