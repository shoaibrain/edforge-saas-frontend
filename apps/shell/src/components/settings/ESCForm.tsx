/**
 * ESC Form
 *
 * Modal form for creating or editing an Education Service Center.
 * Uses React Hook Form + Zod validation with the createEducationServiceCenterSchema.
 */

import { useEffect } from 'react'
import { useForm, FormProvider, zodResolver } from '@edforge/forms'
import { useFormDirtyGuard } from '@/hooks/useFormDirtyGuard'
import { Modal, ModalFooter, Button } from '@edforge/ui'
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

export function ESCForm({ open, onClose, mode, editId }: ESCFormProps) {
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

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = methods
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
      title={isEdit ? 'Edit Education Service Center' : 'Create Education Service Center'}
      description="Education Service Centers provide regional support to districts and schools."
      size="2xl"
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="space-y-6 max-h-[60vh] overflow-y-auto px-1 py-2">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400" />
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
                  {...register('educationServiceCenterId', { valueAsNumber: true })}
                  placeholder="e.g., 200001"
                  readOnly={isEdit}
                  className={`${inputClass} ${isEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                />
                {errors.educationServiceCenterId && (
                  <p className={errorClass}>{errors.educationServiceCenterId.message}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>
                  Name <span className="text-[rgb(var(--state-danger-fg))]">*</span>
                </label>
                <input
                  type="text"
                  {...register('nameOfInstitution')}
                  placeholder="e.g., Region 13 ESC"
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
                  {...register('shortNameOfInstitution')}
                  placeholder="e.g., ESC 13"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Website</label>
                <input
                  type="url"
                  {...register('webSite')}
                  placeholder="https://www.esc13.net"
                  className={inputClass}
                />
                {errors.webSite && <p className={errorClass}>{errors.webSite.message}</p>}
              </div>
            </div>

            <div className="w-48">
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
          </div>

          <div className="border-t border-[rgb(var(--border-primary))]" />

          {/* Hierarchy */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Network className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
              <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Hierarchy</h3>
            </div>
            <div className="w-72">
              <label className={labelClass}>State Education Agency</label>
              <select {...register('stateEducationAgencyId')} className={selectClass}>
                <option value="">None</option>
                {sea && <option value={sea.id}>{sea.nameOfInstitution}</option>}
              </select>
            </div>
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
          Cancel
        </Button>
        <Button onClick={onSubmit} isLoading={isPending}>
          {isEdit ? 'Update ESC' : 'Create ESC'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default ESCForm
