/**
 * SEA Setup Form
 *
 * Modal form for creating or editing the singleton State Education Agency.
 * Uses React Hook Form + Zod validation with the createStateEducationAgencySchema.
 */

import { useEffect } from 'react'
import { useForm, FormProvider, zodResolver, TextField, SelectField } from '@edforge/forms'
import { useFormDirtyGuard } from '@/hooks/useFormDirtyGuard'
import { Modal, ModalFooter, Button } from '@edforge/ui'
import { Landmark, Info } from 'lucide-react'
import {
  createStateEducationAgencySchema,
  type CreateStateEducationAgencyDto,
  type SeaResponseDto,
  OPERATIONAL_STATUS_DESCRIPTORS,
} from '@aibrains/shared-types'
import { Tooltip } from '@edforge/ui'
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

  const { handleSubmit, reset, formState: { isDirty } } = methods
  const { guardedClose } = useFormDirtyGuard({ isDirty, onClose })

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
      onClose={guardedClose}
      title={isEdit ? 'Edit State Education Agency' : 'Set Up State Education Agency'}
      description="Configure the root organization in your Ed-Fi hierarchy."
      size="2xl"
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="space-y-6 max-h-[60vh] overflow-y-auto px-1 py-2">
          {/* Identity Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Landmark className="w-4 h-4 text-[rgb(var(--state-info-fg))] " />
              <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Identity</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                name="stateEducationAgencyId"
                type="number"
                required
                readOnly={isEdit}
                placeholder="e.g., 255901"
                rules={{ valueAsNumber: true }}
                label={
                  <>
                    Ed-Fi ID
                    <Tooltip content="The unique numeric code assigned by the state. If you don't have one, enter any positive integer as a placeholder." side="top">
                      <Info className="inline w-3.5 h-3.5 ml-1 text-[rgb(var(--text-tertiary))] cursor-help align-text-bottom" />
                    </Tooltip>
                  </>
                }
              />
              <TextField
                name="nameOfInstitution"
                label="Name"
                required
                placeholder="e.g., Texas Education Agency"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                name="shortNameOfInstitution"
                label="Short Name"
                placeholder="e.g., TEA"
              />
              <TextField
                name="webSite"
                label="Website"
                type="url"
                placeholder="https://tea.texas.gov"
              />
            </div>

            <SelectField
              name="operationalStatusDescriptor"
              className="w-48"
              options={OPERATIONAL_STATUS_DESCRIPTORS}
              label={
                <>
                  Operational Status
                  <Tooltip content="Current operating status of this organization per Ed-Fi standards." side="top">
                    <Info className="inline w-3.5 h-3.5 ml-1 text-[rgb(var(--text-tertiary))] cursor-help align-text-bottom" />
                  </Tooltip>
                </>
              }
            />
          </div>

          {/* Divider */}
          <div className="border-t border-[rgb(var(--border-primary))]" />

          {/* Categories */}
          <CategoryArraySection orgType="sea" />

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
        <Button variant="outline" onClick={guardedClose} disabled={mutation.isPending}>
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
