/**
 * AddressFieldsNepal — Nepal-shaped address form (Sprint A.8)
 *
 * Renders the post-2017 federal-structure fields:
 *   Street/Tole → Ward → Municipality + type → District → Province → Postal
 *   Code → Country (locked to Nepal)
 *
 * Data source for the Province + District selects: NEPAL_PROVINCES /
 * NEPAL_DISTRICTS from `@aibrains/shared-types` (Sprint A.4 catalog —
 * CEHRD-canonical). Same source feeds both inbound (xlsx import, Sprint
 * D/E) and outbound (Flash I/II export, Sprint I/K/L) so there is zero
 * district-naming drift across the round-trip.
 *
 * Cascading behavior: when the user picks a province, the District select
 * is filtered to only that province's districts. If the form already has
 * a district set when the province changes, the District field is cleared.
 *
 * Form-state shape written by this component (mirrors `addressSchema` in
 * `@aibrains/shared-types` per Sprint A.1):
 *   {
 *     street1?:      string  // Tole / street / house number
 *     wardNumber?:   string  // 1–35 typically; we accept any 1–10 char
 *     municipality?: string  // free text — municipality / VDC name
 *     district?:     string  // CEHRD canonical district name (English)
 *     province?:     string  // CEHRD canonical province name (English)
 *     country:       'NPL'   // locked
 *   }
 */

import { useEffect, useMemo } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { MapPin, type LucideIcon } from 'lucide-react'
import {
  NEPAL_PROVINCES,
  NEPAL_DISTRICTS,
  NEPAL_MUNICIPALITY_TYPES,
} from '@aibrains/shared-types'
import { TextField, SelectField } from '../fields'
import { FormSection } from './FormSection'

const PROVINCE_OPTIONS = NEPAL_PROVINCES.map((p) => ({
  value: p.nameEn,
  label: `${p.nameEn} / ${p.nameNe}`,
}))

const MUNICIPALITY_TYPE_OPTIONS = NEPAL_MUNICIPALITY_TYPES.map((t) => ({
  value: t,
  label:
    t === 'metropolitan'
      ? 'Metropolitan City'
      : t === 'sub_metropolitan'
        ? 'Sub-Metropolitan City'
        : t === 'municipality'
          ? 'Municipality'
          : 'Rural Municipality',
}))

export interface AddressFieldsNepalProps {
  /** Prefix for field names (e.g., "address" → "address.street1"). */
  namePrefix?: string
  /** Whether to show the section header. */
  showHeader?: boolean
  /** Custom section title. */
  title?: string
  /** Custom section icon. */
  icon?: LucideIcon
  /** Whether fields are disabled. */
  disabled?: boolean
  /** Show optional address line 2 (apartment / suite). */
  showAddressLine2?: boolean
  /** Additional class name. */
  className?: string
}

export function AddressFieldsNepal({
  namePrefix = 'address',
  showHeader = true,
  title = 'Address',
  icon: Icon = MapPin,
  disabled = false,
  showAddressLine2 = true,
  className,
}: AddressFieldsNepalProps) {
  const prefix = namePrefix ? `${namePrefix}.` : ''
  const provinceFieldName = `${prefix}province`
  const districtFieldName = `${prefix}district`
  const countryFieldName = `${prefix}country`

  const { setValue, getValues, register, formState: _formState } = useFormContext()

  // Watch province for cascading district
  const selectedProvinceName = useWatch({ name: provinceFieldName })

  // Lock country = 'NPL' on mount (and when component re-renders) — register
  // ensures the field exists in the form state so submit payloads include it.
  useEffect(() => {
    register(countryFieldName)
    if (getValues(countryFieldName) !== 'NPL') {
      setValue(countryFieldName, 'NPL', { shouldDirty: false, shouldValidate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryFieldName])

  // Cascading district options — filter to selected province
  const districtOptions = useMemo(() => {
    if (!selectedProvinceName) return [] as { value: string; label: string }[]
    const province = NEPAL_PROVINCES.find((p) => p.nameEn === selectedProvinceName)
    if (!province) return []
    return NEPAL_DISTRICTS
      .filter((d) => d.provinceCode === province.provinceCode)
      .map((d) => ({
        value: d.nameEn,
        label: d.nameNe ? `${d.nameEn} / ${d.nameNe}` : d.nameEn,
      }))
  }, [selectedProvinceName])

  // When province changes, clear any stale district that doesn't belong to
  // the new province. Skip if the district is still valid (province loaded
  // from a saved record + matches).
  const currentDistrict = useWatch({ name: districtFieldName })
  useEffect(() => {
    if (!currentDistrict) return
    const stillValid = districtOptions.some((o) => o.value === currentDistrict)
    if (!stillValid) {
      setValue(districtFieldName, '', { shouldDirty: true, shouldValidate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvinceName])

  return (
    <FormSection
      title={showHeader ? title : undefined}
      icon={showHeader ? Icon : undefined}
      description={
        showHeader ? 'Nepal address (post-2017 federal structure)' : undefined
      }
      className={className}
    >
      <div className="grid grid-cols-1 gap-4">
        {/* Street / Tole / House number */}
        <TextField
          name={`${prefix}street1`}
          label="Street / Tole / House"
          placeholder="e.g., Tole-12, Bishal Bazar"
          disabled={disabled}
          icon={MapPin}
        />

        {/* Optional secondary line */}
        {showAddressLine2 && (
          <TextField
            name={`${prefix}street2`}
            label="Address Line 2"
            placeholder="Apartment, suite, landmark (optional)"
            disabled={disabled}
          />
        )}

        {/* Province → District (cascading) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            name={provinceFieldName}
            label="Province"
            placeholder="Select province"
            options={PROVINCE_OPTIONS}
            disabled={disabled}
          />
          <SelectField
            name={districtFieldName}
            label="District"
            placeholder={selectedProvinceName ? 'Select district' : 'Pick province first'}
            options={districtOptions}
            disabled={disabled || !selectedProvinceName}
          />
        </div>

        {/* Municipality + type */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TextField
            name={`${prefix}municipality`}
            label="Municipality / Rural Municipality / VDC"
            placeholder="e.g., Kathmandu Metropolitan City"
            disabled={disabled}
            className="md:col-span-2"
          />
          <SelectField
            name={`${prefix}municipalityType`}
            label="Type"
            placeholder="Select type"
            options={MUNICIPALITY_TYPE_OPTIONS}
            disabled={disabled}
          />
        </div>

        {/* Ward + Postal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TextField
            name={`${prefix}wardNumber`}
            label="Ward Number"
            placeholder="e.g., 12"
            disabled={disabled}
            maxLength={10}
          />
          <TextField
            name={`${prefix}postalCode`}
            label="Postal Code"
            placeholder="e.g., 44600"
            disabled={disabled}
            maxLength={20}
          />
          {/* Country is locked — display read-only */}
          <TextField
            name={countryFieldName}
            label="Country"
            placeholder="Nepal"
            disabled
            readOnly
          />
        </div>
      </div>
    </FormSection>
  )
}
