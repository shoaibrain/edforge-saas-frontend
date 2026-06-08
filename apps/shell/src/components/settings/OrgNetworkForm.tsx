/**
 * OrgNetworkForm
 *
 * Modal form for creating or editing an Education Organization Network.
 * Uses React Hook Form + Zod validation with the createEducationOrgNetworkSchema.
 */

import { useEffect } from 'react'
import { useForm, FormProvider, zodResolver } from '@edforge/forms'
import { useFormDirtyGuard } from '@/hooks/useFormDirtyGuard'
import { Modal, ModalFooter, Button } from '@edforge/ui'
import { Info } from 'lucide-react'
import { Tooltip } from '@edforge/ui'
import {
  createEducationOrgNetworkSchema,
  type CreateEducationOrgNetworkDto,
  OPERATIONAL_STATUS_DESCRIPTORS,
  NETWORK_PURPOSE_DESCRIPTORS,
} from '@aibrains/shared-types'
import {
  useCreateNetwork,
  useUpdateNetwork,
  useNetwork,
} from '@/hooks/useEducationOrgs'
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

export function OrgNetworkForm({ open, onClose, mode, editId }: OrgNetworkFormProps) {
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

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = methods
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
        categories: existingNetwork.categories.length > 0
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
      updateMutation.mutate(
        { id: existingNetwork.id, data: updateData },
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
      title={isEdit ? 'Edit Network' : 'Create Network'}
      description="Education Organization Networks group organizations for reporting, collaboration, or governance."
      size="2xl"
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="space-y-6 max-h-[60vh] overflow-y-auto px-1 py-2">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Ed-Fi ID <span className="text-[rgb(var(--state-danger-fg))]">*</span>
                  <Tooltip content="The unique numeric code for this network. If you don't have one, enter any positive integer as a placeholder." side="top">
                    <Info className="inline w-3.5 h-3.5 ml-1 text-[rgb(var(--text-tertiary))] cursor-help align-text-bottom" />
                  </Tooltip>
                </label>
                <input
                  type="number"
                  {...register('educationOrganizationNetworkId', { valueAsNumber: true })}
                  placeholder="e.g., 300001"
                  readOnly={isEdit}
                  className={`${inputClass} ${isEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                />
                {errors.educationOrganizationNetworkId && (
                  <p className={errorClass}>{errors.educationOrganizationNetworkId.message}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>
                  Name <span className="text-[rgb(var(--state-danger-fg))]">*</span>
                </label>
                <input
                  type="text"
                  {...register('nameOfInstitution')}
                  placeholder="e.g., Metro Area STEM Collaborative"
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
                  placeholder="e.g., Metro STEM"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Website</label>
                <input
                  type="url"
                  {...register('webSite')}
                  placeholder="https://www.example.org"
                  className={inputClass}
                />
                {errors.webSite && <p className={errorClass}>{errors.webSite.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Network Purpose <span className="text-[rgb(var(--state-danger-fg))]">*</span>
                  <Tooltip content="The primary purpose of this network grouping per Ed-Fi standards." side="top">
                    <Info className="inline w-3.5 h-3.5 ml-1 text-[rgb(var(--text-tertiary))] cursor-help align-text-bottom" />
                  </Tooltip>
                </label>
                <select {...register('networkPurposeDescriptor')} className={selectClass}>
                  {NETWORK_PURPOSE_DESCRIPTORS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>
                  Operational Status
                  <Tooltip content="Current operating status of this network per Ed-Fi standards." side="top">
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
          Cancel
        </Button>
        <Button onClick={onSubmit} isLoading={isPending}>
          {isEdit ? 'Update Network' : 'Create Network'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default OrgNetworkForm
