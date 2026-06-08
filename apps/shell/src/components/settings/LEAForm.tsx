/**
 * LEA Form
 *
 * Modal form for creating or editing a Local Education Agency (district).
 * Uses React Hook Form + Zod validation with the createLocalEducationAgencySchema.
 * Supports hierarchy dropdowns (SEA, ESC, parent LEA) and conditional charter fields.
 */

import { useEffect } from 'react'
import { useForm, useWatch, FormProvider, zodResolver } from '@edforge/forms'
import { useFormDirtyGuard } from '@/hooks/useFormDirtyGuard'
import { Modal, ModalFooter, Button } from '@edforge/ui'
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
// STYLES
// ============================================================================

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-tertiary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))] transition-colors'
const selectClass = inputClass
const labelClass = 'block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1.5'
const errorClass = 'mt-1 text-xs text-[rgb(var(--state-danger-fg))]'

// ============================================================================
// COMPONENT
// ============================================================================

export function LEAForm({ open, onClose, mode, editId, defaultSeaId, defaultEscId }: LEAFormProps) {
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

  const { register, handleSubmit, reset, setValue, control, formState: { errors, isDirty } } = methods
  const { guardedClose } = useFormDirtyGuard({ isDirty, onClose })

  // Watch LEA category to conditionally show charter status
  const leaCategory = useWatch({ control, name: 'leaCategoryDescriptor' })
  const showCharterField = leaCategory === 'CharterLEA'

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
      title={isEdit ? 'Edit District (LEA)' : 'Create District (LEA)'}
      description="Local Education Agencies manage schools and report to the state."
      size="2xl"
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="space-y-6 max-h-[60vh] overflow-y-auto px-1 py-2">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-[rgb(var(--action-secondary-fg))] " />
              <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Basic Info</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Ed-Fi ID <span className="text-[rgb(var(--state-danger-fg))]">*</span>
                  <Tooltip content="The unique numeric code assigned by the state. If you don't have one, enter any positive integer as a placeholder." side="top">
                    <Info className="inline w-3.5 h-3.5 ml-1 text-[rgb(var(--text-tertiary))] cursor-help align-text-bottom" />
                  </Tooltip>
                </label>
                <input
                  type="number"
                  {...register('localEducationAgencyId', { valueAsNumber: true })}
                  placeholder="e.g., 101912"
                  readOnly={isEdit}
                  className={`${inputClass} ${isEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                />
                {errors.localEducationAgencyId && (
                  <p className={errorClass}>{errors.localEducationAgencyId.message}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>
                  Name <span className="text-[rgb(var(--state-danger-fg))]">*</span>
                </label>
                <input
                  type="text"
                  {...register('nameOfInstitution')}
                  placeholder="e.g., Austin Independent School District"
                  className={inputClass}
                />
                {errors.nameOfInstitution && (
                  <p className={errorClass}>{errors.nameOfInstitution.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Short Name</label>
                <input
                  type="text"
                  {...register('shortNameOfInstitution', { setValueAs: v => v === '' ? undefined : v })}
                  placeholder="e.g., Austin ISD"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Website</label>
                <input
                  type="url"
                  {...register('webSite', { setValueAs: v => v === '' ? undefined : v })}
                  placeholder="https://www.austinisd.org"
                  className={inputClass}
                />
                {errors.webSite && <p className={errorClass}>{errors.webSite.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>
                  LEA Category <span className="text-[rgb(var(--state-danger-fg))]">*</span>
                  <Tooltip content="The classification of this district. 'Independent' is the most common for standard school districts." side="top">
                    <Info className="inline w-3.5 h-3.5 ml-1 text-[rgb(var(--text-tertiary))] cursor-help align-text-bottom" />
                  </Tooltip>
                </label>
                <select {...register('leaCategoryDescriptor')} className={selectClass}>
                  {LEA_CATEGORY_DESCRIPTORS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>
                  Operational Status
                  <Tooltip content="Current operating status of this organization per Ed-Fi standards." side="top">
                    <Info className="inline w-3.5 h-3.5 ml-1 text-[rgb(var(--text-tertiary))] cursor-help align-text-bottom" />
                  </Tooltip>
                </label>
                <select {...register('operationalStatusDescriptor')} className={selectClass}>
                  {OPERATIONAL_STATUS_DESCRIPTORS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
              {showCharterField && (
                <div>
                  <label className={labelClass}>
                    Charter Status
                    <Tooltip content="Only applies to charter-type organizations." side="top">
                      <Info className="inline w-3.5 h-3.5 ml-1 text-[rgb(var(--text-tertiary))] cursor-help align-text-bottom" />
                    </Tooltip>
                  </label>
                  <select {...register('charterStatusDescriptor', { setValueAs: v => v === '' ? undefined : v })} className={selectClass}>
                    <option value="">Select...</option>
                    {CHARTER_STATUS_DESCRIPTORS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-[rgb(var(--border-primary))]" />

          {/* Hierarchy */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Network className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
              <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Hierarchy</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>State Education Agency</label>
                <select {...register('stateEducationAgencyId', { setValueAs: v => v === '' ? undefined : v })} className={selectClass}>
                  <option value="">None</option>
                  {sea && <option value={sea.id}>{sea.nameOfInstitution}</option>}
                </select>
              </div>
              <div>
                <label className={labelClass}>Education Service Center</label>
                <select {...register('educationServiceCenterId', { setValueAs: v => v === '' ? undefined : v })} className={selectClass}>
                  <option value="">None</option>
                  {escs.map((esc) => (
                    <option key={esc.id} value={esc.id}>{esc.nameOfInstitution}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>
                  Parent LEA
                  <Tooltip content="Optional. Only needed if this district reports through another district (e.g., charter networks)." side="top">
                    <Info className="inline w-3.5 h-3.5 ml-1 text-[rgb(var(--text-tertiary))] cursor-help align-text-bottom" />
                  </Tooltip>
                </label>
                <select {...register('parentLocalEducationAgencyId', { setValueAs: v => v === '' ? undefined : v })} className={selectClass}>
                  <option value="">None</option>
                  {parentLeaOptions.map((lea) => (
                    <option key={lea.id} value={lea.id}>{lea.nameOfInstitution}</option>
                  ))}
                </select>
              </div>
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
          Cancel
        </Button>
        <Button onClick={onSubmit} isLoading={isPending}>
          {isEdit ? 'Update District' : 'Create District'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default LEAForm
