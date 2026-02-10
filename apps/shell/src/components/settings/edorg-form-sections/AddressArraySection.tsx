/**
 * Address Array Section
 *
 * Dynamic form array for Ed-Fi EducationOrganizationAddress entries.
 * Must be used inside a FormProvider context.
 */

import { useFieldArray, useFormContext } from '@edforge/forms'
import { Plus, Trash2, MapPin } from 'lucide-react'
import { Button } from '@edforge/ui'
import {
  ADDRESS_TYPE_DESCRIPTORS,
  STATE_ABBREVIATION_DESCRIPTORS,
} from '@aibrains/shared-types'

interface AddressArraySectionProps {
  name?: string
}

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-tertiary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors'
const selectClass = inputClass
const labelClass = 'block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1'
const errorClass = 'mt-0.5 text-[10px] text-red-500'

export function AddressArraySection({ name = 'addresses' }: AddressArraySectionProps) {
  const { control, register, formState: { errors } } = useFormContext()
  const { fields, append, remove } = useFieldArray({ control, name })

  const getError = (index: number, field: string) => {
    const arr = (errors as Record<string, any>)[name]
    return arr?.[index]?.[field]?.message as string | undefined
  }

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
          className="relative p-4 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] space-y-3"
        >
          <button
            type="button"
            onClick={() => remove(index)}
            className="absolute top-3 right-3 p-1 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Row 1: Type + Street */}
          <div className="grid grid-cols-3 gap-3 pr-8">
            <div>
              <label className={labelClass}>Type</label>
              <select {...register(`${name}.${index}.addressTypeDescriptor`)} className={selectClass}>
                {ADDRESS_TYPE_DESCRIPTORS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Street</label>
              <input
                type="text"
                {...register(`${name}.${index}.streetNumberName`)}
                placeholder="123 Main St"
                className={inputClass}
              />
              {getError(index, 'streetNumberName') && (
                <p className={errorClass}>{getError(index, 'streetNumberName')}</p>
              )}
            </div>
          </div>

          {/* Row 2: Apt + City */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Apt/Suite</label>
              <input
                type="text"
                {...register(`${name}.${index}.apartmentRoomSuiteNumber`)}
                placeholder="Suite 100"
                className={inputClass}
              />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>City</label>
              <input
                type="text"
                {...register(`${name}.${index}.city`)}
                placeholder="Austin"
                className={inputClass}
              />
              {getError(index, 'city') && (
                <p className={errorClass}>{getError(index, 'city')}</p>
              )}
            </div>
          </div>

          {/* Row 3: State + Zip */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>State</label>
              <select {...register(`${name}.${index}.stateAbbreviationDescriptor`)} className={selectClass}>
                <option value="">Select state...</option>
                {STATE_ABBREVIATION_DESCRIPTORS.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
              {getError(index, 'stateAbbreviationDescriptor') && (
                <p className={errorClass}>{getError(index, 'stateAbbreviationDescriptor')}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Postal Code</label>
              <input
                type="text"
                {...register(`${name}.${index}.postalCode`)}
                placeholder="78701"
                className={inputClass}
              />
              {getError(index, 'postalCode') && (
                <p className={errorClass}>{getError(index, 'postalCode')}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
