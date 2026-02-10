/**
 * SEA Setup Form
 *
 * Modal form for creating or editing the singleton State Education Agency.
 * Uses React Hook Form + Zod validation with the createStateEducationAgencySchema.
 */

import { useEffect } from 'react'
import { useForm, FormProvider, zodResolver } from '@edforge/forms'
import { Modal, ModalFooter, Button } from '@edforge/ui'
import { Landmark } from 'lucide-react'
import {
  createStateEducationAgencySchema,
  type CreateStateEducationAgencyDto,
  type SeaResponseDto,
  OPERATIONAL_STATUS_DESCRIPTORS,
} from '@aibrains/shared-types'
import { useCreateOrUpdateSea } from '@/hooks/useEducationOrgs'
import {
  AddressArraySection,
  TelephoneArraySection,
  IdentificationCodeArraySection,
  CategoryArraySection,
} from './edorg-form-sections'

// ============================================================================
// TYPES
// ============================================================================

export interface SEASetupFormProps {
  open: boolean
  onClose: () => void
  existingSea?: SeaResponseDto | null
}

// ============================================================================
// STYLES
// ============================================================================

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-tertiary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors'
const selectClass = inputClass
const labelClass = 'block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1.5'
const errorClass = 'mt-1 text-xs text-red-500'

// ============================================================================
// COMPONENT
// ============================================================================

export function SEASetupForm({ open, onClose, existingSea }: SEASetupFormProps) {
  const isEdit = !!existingSea
  const mutation = useCreateOrUpdateSea()

  const methods = useForm<CreateStateEducationAgencyDto>({
    resolver: zodResolver(createStateEducationAgencySchema),
    mode: 'onBlur',
    defaultValues: {
      stateEducationAgencyId: undefined,
      nameOfInstitution: '',
      shortNameOfInstitution: '',
      webSite: '',
      operationalStatusDescriptor: 'Active',
      categories: [{ educationOrganizationCategoryDescriptor: '' }],
      addresses: [],
      telephones: [],
      identificationCodes: [],
    },
  })

  const { register, handleSubmit, reset, formState: { errors } } = methods

  // Populate form with existing SEA data for edit mode
  useEffect(() => {
    if (open && existingSea) {
      reset({
        stateEducationAgencyId: existingSea.stateEducationAgencyId,
        nameOfInstitution: existingSea.nameOfInstitution,
        shortNameOfInstitution: existingSea.shortNameOfInstitution || '',
        webSite: existingSea.webSite || '',
        operationalStatusDescriptor: existingSea.operationalStatusDescriptor,
        categories: existingSea.categories.length > 0
          ? existingSea.categories
          : [{ educationOrganizationCategoryDescriptor: '' }],
        addresses: existingSea.addresses || [],
        telephones: existingSea.telephones || [],
        identificationCodes: existingSea.identificationCodes || [],
      })
    }
  }, [open, existingSea, reset])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  const onSubmit = handleSubmit((data) => {
    // Clean up empty optional strings
    const cleanData = {
      ...data,
      shortNameOfInstitution: data.shortNameOfInstitution || undefined,
      webSite: data.webSite || undefined,
      addresses: data.addresses?.length ? data.addresses : undefined,
      telephones: data.telephones?.length ? data.telephones : undefined,
      identificationCodes: data.identificationCodes?.length ? data.identificationCodes : undefined,
    }
    mutation.mutate(cleanData, { onSuccess: () => onClose() })
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit State Education Agency' : 'Set Up State Education Agency'}
      description="Configure the root organization in your Ed-Fi hierarchy."
      size="2xl"
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="space-y-6 max-h-[60vh] overflow-y-auto px-1 py-2">
          {/* Identity Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Landmark className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Identity</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Ed-Fi ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  {...register('stateEducationAgencyId', { valueAsNumber: true })}
                  placeholder="e.g., 255901"
                  readOnly={isEdit}
                  className={`${inputClass} ${isEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                />
                {errors.stateEducationAgencyId && (
                  <p className={errorClass}>{errors.stateEducationAgencyId.message}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('nameOfInstitution')}
                  placeholder="e.g., Texas Education Agency"
                  className={inputClass}
                />
                {errors.nameOfInstitution && (
                  <p className={errorClass}>{errors.nameOfInstitution.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Short Name</label>
                <input
                  type="text"
                  {...register('shortNameOfInstitution')}
                  placeholder="e.g., TEA"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Website</label>
                <input
                  type="url"
                  {...register('webSite')}
                  placeholder="https://tea.texas.gov"
                  className={inputClass}
                />
                {errors.webSite && (
                  <p className={errorClass}>{errors.webSite.message}</p>
                )}
              </div>
            </div>

            <div className="w-48">
              <label className={labelClass}>Operational Status</label>
              <select {...register('operationalStatusDescriptor')} className={selectClass}>
                {OPERATIONAL_STATUS_DESCRIPTORS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[rgb(var(--border-primary))]" />

          {/* Categories */}
          <CategoryArraySection />

          {/* Divider */}
          <div className="border-t border-[rgb(var(--border-primary))]" />

          {/* Addresses */}
          <AddressArraySection />

          {/* Divider */}
          <div className="border-t border-[rgb(var(--border-primary))]" />

          {/* Telephones */}
          <TelephoneArraySection />

          {/* Divider */}
          <div className="border-t border-[rgb(var(--border-primary))]" />

          {/* Identification Codes */}
          <IdentificationCodeArraySection />
        </form>
      </FormProvider>

      <ModalFooter>
        <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button onClick={onSubmit} isLoading={mutation.isPending}>
          {isEdit ? 'Update SEA' : 'Create SEA'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default SEASetupForm
