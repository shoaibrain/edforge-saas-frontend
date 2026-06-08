/**
 * Address Array Section
 *
 * Dynamic form array for Ed-Fi EducationOrganizationAddress entries.
 * Must be used inside a FormProvider context.
 */

import { useFieldArray, useFormContext, TextField, SelectField } from '@edforge/forms'
import { Plus, Trash2, MapPin } from 'lucide-react'
import { Button } from '@edforge/ui'
import {
  ADDRESS_TYPE_DESCRIPTORS,
  STATE_ABBREVIATION_DESCRIPTORS,
} from '@aibrains/shared-types'

interface AddressArraySectionProps {
  name?: string
}

const STATE_OPTIONS = STATE_ABBREVIATION_DESCRIPTORS.map((st) => ({ value: st, label: st }))

export function AddressArraySection({ name = 'addresses' }: AddressArraySectionProps) {
  const { control } = useFormContext()
  const { fields, append, remove } = useFieldArray({ control, name })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          <span className="text-sm font-medium text-[rgb(var(--text-primary))]">Addresses</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1 text-xs"
          onClick={() =>
            append({
              addressTypeDescriptor: 'Physical',
              streetNumberName: '',
              city: '',
              stateAbbreviationDescriptor: '',
              postalCode: '',
            })
          }
        >
          <Plus className="w-3.5 h-3.5" />
          Add Address
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-xs text-[rgb(var(--text-tertiary))] py-3 text-center">
          No addresses added. Click "Add Address" to add one.
        </p>
      )}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="relative p-4 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] space-y-3"
        >
          <button
            type="button"
            onClick={() => remove(index)}
            className="absolute top-3 right-3 p-1 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--state-danger-fg))] hover:bg-[rgb(var(--state-danger-bg)/0.18)]0/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Row 1: Type + Street */}
          <div className="grid grid-cols-3 gap-3 pr-8">
            <SelectField
              name={`${name}.${index}.addressTypeDescriptor`}
              label="Type"
              options={ADDRESS_TYPE_DESCRIPTORS}
            />
            <TextField
              name={`${name}.${index}.streetNumberName`}
              label="Street"
              placeholder="123 Main St"
              className="col-span-2"
            />
          </div>

          {/* Row 2: Apt + City */}
          <div className="grid grid-cols-3 gap-3">
            <TextField
              name={`${name}.${index}.apartmentRoomSuiteNumber`}
              label="Apt/Suite"
              placeholder="Suite 100"
            />
            <TextField
              name={`${name}.${index}.city`}
              label="City"
              placeholder="Austin"
              className="col-span-2"
            />
          </div>

          {/* Row 3: State + Zip */}
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              name={`${name}.${index}.stateAbbreviationDescriptor`}
              label="State"
              placeholder="Select state..."
              options={STATE_OPTIONS}
            />
            <TextField
              name={`${name}.${index}.postalCode`}
              label="Postal Code"
              placeholder="78701"
            />
          </div>
        </div>
      ))}
    </div>
  )
}
