/**
 * Contact & Address Step
 *
 * Step 2: Email, phone, addresses, and emergency contacts.
 * Email is required; everything else is optional.
 *
 * Sprint A.12 + A.17: address fieldset and phone fields branch on the
 * tenant's archetype + country. PABSON (Nepal pilot) sees the CEHRD-canonical
 * Province/District (cascading) / Municipality / Ward / Tole / Postal Code
 * layout with country locked to NPL. Phone fields show the +977 prefix and
 * Nepal-mobile placeholder. GENERIC tenants see the existing US-shaped form
 * unchanged.
 *
 * Archetype is read once on mount via getSchoolContext() (populated by Shell
 * via the school-context-channel) and updated live via onSchoolChange. The
 * MFE doesn't import from apps/shell directly — keeps the channel as the
 * single decoupling boundary.
 */

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, AlertTriangle, Plus, X } from 'lucide-react'
import type { WizardStepProps } from '@edforge/wizard'
import {
  getSchoolContext,
  onSchoolChange,
  type SchoolContextPayload,
} from '@edforge/config/school-context-channel'
import {
  NEPAL_PROVINCES,
  NEPAL_DISTRICTS,
  phoneFormatForArchetype,
} from '@aibrains/shared-types'
import {
  ADDRESS_TYPE_OPTIONS,
  RELATIONSHIP_OPTIONS,
} from '../staff-wizard.utils'
import { AnimatedInput, AnimatedSelect, SectionHeader } from './shared'

// ============================================================================
// ARCHETYPE HOOK (reads via @edforge/config channel — no apps/shell import)
// ============================================================================

interface TenantContext {
  archetype: string | null
  country: string | null
}

function useTenantContext(): TenantContext {
  const initial = getSchoolContext()
  const [ctx, setCtx] = useState<TenantContext>({
    archetype: initial.archetype ?? null,
    country: initial.country ?? null,
  })

  useEffect(() => {
    const unsub = onSchoolChange((payload: SchoolContextPayload) => {
      setCtx({
        archetype: payload.archetype ?? null,
        country: payload.country ?? null,
      })
    })
    return unsub
  }, [])

  return ctx
}

function isNepalShape(archetype: string | null, country: string | null): boolean {
  return archetype === 'PABSON' || country === 'NPL'
}

// ============================================================================
// ADDRESS ENTRY
// ============================================================================

interface StaffAddress {
  addressTypeDescriptor: string
  streetNumberName: string
  // Legacy / US-shaped fields (kept for GENERIC archetype + backwards-compat)
  city: string
  stateAbbreviationDescriptor: string
  postalCode: string
  country: string
  // Nepal-aware extension fields (Sprint A.2 backend; populated for PABSON)
  wardNumber?: string
  municipality?: string
  district?: string
  province?: string
}

function emptyAddress(nepalShape: boolean): StaffAddress {
  return {
    addressTypeDescriptor: 'home',
    streetNumberName: '',
    city: '',
    stateAbbreviationDescriptor: '',
    postalCode: '',
    country: nepalShape ? 'NPL' : 'US',
    ...(nepalShape
      ? { wardNumber: '', municipality: '', district: '', province: '' }
      : {}),
  }
}

const PROVINCE_OPTIONS = NEPAL_PROVINCES.map((p) => ({
  value: p.nameEn,
  label: `${p.nameEn} / ${p.nameNe}`,
}))

// ============================================================================
// EMERGENCY CONTACT ENTRY
// ============================================================================

interface EmergencyContact {
  name: string
  relationship: string
  phone: string
  email: string
}

function emptyEmergencyContact(): EmergencyContact {
  return { name: '', relationship: 'spouse', phone: '', email: '' }
}

// ============================================================================
// STEP COMPONENT
// ============================================================================

export function ContactStep({ data, updateData, errors, clearError }: WizardStepProps) {
  const addresses = (data.addresses as StaffAddress[]) || []
  const emergencyContacts = (data.emergencyContacts as EmergencyContact[]) || []

  // Sprint A.12: read tenant archetype + country once + subscribe to changes.
  const { archetype, country } = useTenantContext()
  const nepalShape = isNepalShape(archetype, country)
  const phoneFmt = phoneFormatForArchetype(archetype, country)

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    updateData({ [field]: e.target.value })
    clearError(field)
  }

  // Address helpers
  const addAddress = () => {
    updateData({ addresses: [...addresses, emptyAddress(nepalShape)] })
  }
  const removeAddress = (index: number) => {
    updateData({ addresses: addresses.filter((_, i) => i !== index) })
  }
  const updateAddress = (index: number, field: string, value: string) => {
    const updated = [...addresses]
    updated[index] = { ...updated[index], [field]: value }
    updateData({ addresses: updated })
  }

  // Cascading-district options for Nepal-shape: filter NEPAL_DISTRICTS by
  // the address's selected province.
  const districtOptionsFor = (provinceName: string | undefined) => {
    if (!provinceName) return [] as { value: string; label: string }[]
    const province = NEPAL_PROVINCES.find((p) => p.nameEn === provinceName)
    if (!province) return []
    return NEPAL_DISTRICTS
      .filter((d) => d.provinceCode === province.provinceCode)
      .map((d) => ({
        value: d.nameEn,
        label: d.nameNe ? `${d.nameEn} / ${d.nameNe}` : d.nameEn,
      }))
  }

  // Emergency contact helpers
  const addEmergencyContact = () => {
    updateData({ emergencyContacts: [...emergencyContacts, emptyEmergencyContact()] })
  }
  const removeEmergencyContact = (index: number) => {
    updateData({ emergencyContacts: emergencyContacts.filter((_, i) => i !== index) })
  }
  const updateEmergencyContact = (index: number, field: string, value: string) => {
    const updated = [...emergencyContacts]
    updated[index] = { ...updated[index], [field]: value }
    updateData({ emergencyContacts: updated })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Primary Contact */}
      <div className="space-y-4">
        <SectionHeader
          title="Primary Contact"
          description="Email is used for login and notifications"
          icon={<Mail className="w-4 h-4" />}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatedInput
            label="Email Address"
            required
            type="email"
            placeholder="john.smith@school.edu"
            autoComplete="email"
            value={(data.email as string) || ''}
            onChange={handleChange('email')}
            error={errors.email}
            icon={<Mail className="w-4 h-4" />}
          />
          <AnimatedInput
            label={`Phone Number ${phoneFmt.dialCode}`}
            type="tel"
            placeholder={phoneFmt.placeholder}
            autoComplete="tel"
            value={(data.phone as string) || ''}
            onChange={handleChange('phone')}
            icon={<Phone className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Addresses */}
      <div className="space-y-4">
        <SectionHeader
          title="Addresses"
          description="Add home, work, or mailing addresses"
          icon={<MapPin className="w-4 h-4" />}
        />

        {addresses.map((addr, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border border-[rgb(var(--border-secondary))] rounded-xl p-4 space-y-3 relative"
          >
            <div className="flex items-center justify-between">
              <AnimatedSelect
                label="Address Type"
                value={addr.addressTypeDescriptor || 'home'}
                onChange={(e) => updateAddress(index, 'addressTypeDescriptor', e.target.value)}
                options={ADDRESS_TYPE_OPTIONS}
              />
              <button
                type="button"
                onClick={() => removeAddress(index)}
                className="p-1.5 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                title="Remove address"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {nepalShape ? (
              /* Nepal-shaped fieldset (Sprint A.12) — for PABSON archetype or
                 GENERIC tenants in Nepal. Province → District cascading. */
              <>
                <AnimatedInput
                  label="Street / Tole / House"
                  placeholder="e.g., Tole-12, Bishal Bazar"
                  value={addr.streetNumberName || ''}
                  onChange={(e) => updateAddress(index, 'streetNumberName', e.target.value)}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <AnimatedSelect
                    label="Province"
                    value={addr.province || ''}
                    onChange={(e) => {
                      // When province changes, clear stale district that
                      // doesn't belong to the new province.
                      const updated = [...addresses]
                      updated[index] = {
                        ...updated[index],
                        province: e.target.value,
                        district: '',
                      }
                      updateData({ addresses: updated })
                    }}
                    options={[{ value: '', label: 'Select province' }, ...PROVINCE_OPTIONS]}
                  />
                  <AnimatedSelect
                    label="District"
                    value={addr.district || ''}
                    onChange={(e) => updateAddress(index, 'district', e.target.value)}
                    options={[
                      {
                        value: '',
                        label: addr.province ? 'Select district' : 'Pick province first',
                      },
                      ...districtOptionsFor(addr.province),
                    ]}
                  />
                </div>
                <AnimatedInput
                  label="Municipality / Rural Municipality / VDC"
                  placeholder="e.g., Kathmandu Metropolitan City"
                  value={addr.municipality || ''}
                  onChange={(e) => updateAddress(index, 'municipality', e.target.value)}
                />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <AnimatedInput
                    label="Ward Number"
                    placeholder="e.g., 12"
                    maxLength={10}
                    value={addr.wardNumber || ''}
                    onChange={(e) => updateAddress(index, 'wardNumber', e.target.value)}
                  />
                  <AnimatedInput
                    label="Postal Code"
                    placeholder="e.g., 44600"
                    value={addr.postalCode || ''}
                    onChange={(e) => updateAddress(index, 'postalCode', e.target.value)}
                  />
                  <AnimatedInput
                    label="Country"
                    placeholder="Nepal"
                    value="Nepal"
                    disabled
                    onChange={() => {
                      /* locked to NPL — set on emptyAddress + persisted in updateData */
                    }}
                  />
                </div>
              </>
            ) : (
              /* US/generic-shaped fieldset (existing behavior — GENERIC tenants) */
              <>
                <AnimatedInput
                  label="Street"
                  placeholder="123 Main Street"
                  value={addr.streetNumberName || ''}
                  onChange={(e) => updateAddress(index, 'streetNumberName', e.target.value)}
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <AnimatedInput
                    label="City"
                    placeholder="Springfield"
                    value={addr.city || ''}
                    onChange={(e) => updateAddress(index, 'city', e.target.value)}
                  />
                  <AnimatedInput
                    label="State"
                    placeholder="IL"
                    maxLength={2}
                    value={addr.stateAbbreviationDescriptor || ''}
                    onChange={(e) =>
                      updateAddress(index, 'stateAbbreviationDescriptor', e.target.value.toUpperCase())
                    }
                    className="uppercase"
                  />
                  <AnimatedInput
                    label="ZIP Code"
                    placeholder="62704"
                    value={addr.postalCode || ''}
                    onChange={(e) => updateAddress(index, 'postalCode', e.target.value)}
                  />
                  <AnimatedInput
                    label="Country"
                    placeholder="US"
                    value={addr.country || 'US'}
                    onChange={(e) => updateAddress(index, 'country', e.target.value)}
                  />
                </div>
              </>
            )}
          </motion.div>
        ))}

        <button
          type="button"
          onClick={addAddress}
          className="flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Address
        </button>
      </div>

      {/* Emergency Contacts */}
      <div className="space-y-4">
        <SectionHeader
          title="Emergency Contacts"
          description="People to contact in case of emergency"
          icon={<AlertTriangle className="w-4 h-4" />}
        />

        {emergencyContacts.map((contact, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border border-[rgb(var(--border-secondary))] rounded-xl p-4 space-y-3 relative"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[rgb(var(--text-secondary))]">
                Contact {index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeEmergencyContact(index)}
                className="p-1.5 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                title="Remove contact"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <AnimatedInput
                label="Full Name"
                placeholder="Jane Smith"
                value={contact.name || ''}
                onChange={(e) => updateEmergencyContact(index, 'name', e.target.value)}
              />
              <AnimatedSelect
                label="Relationship"
                value={contact.relationship || 'spouse'}
                onChange={(e) => updateEmergencyContact(index, 'relationship', e.target.value)}
                options={RELATIONSHIP_OPTIONS}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <AnimatedInput
                label={`Phone ${phoneFmt.dialCode}`}
                type="tel"
                placeholder={phoneFmt.placeholder}
                value={contact.phone || ''}
                onChange={(e) => updateEmergencyContact(index, 'phone', e.target.value)}
              />
              <AnimatedInput
                label="Email"
                type="email"
                placeholder="jane.smith@email.com"
                value={contact.email || ''}
                onChange={(e) => updateEmergencyContact(index, 'email', e.target.value)}
              />
            </div>
          </motion.div>
        ))}

        <button
          type="button"
          onClick={addEmergencyContact}
          className="flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Emergency Contact
        </button>
      </div>
    </motion.div>
  )
}
