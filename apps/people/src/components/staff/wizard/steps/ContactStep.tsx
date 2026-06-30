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

import React from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, AlertTriangle, Plus, X } from 'lucide-react'
import type { WizardStepProps } from '@edforge/wizard'
import { useTenantContext, isNepalShape } from '@edforge/forms'
import { useTranslation } from '@edforge/i18n'
import {
  NEPAL_PROVINCES,
  NEPAL_DISTRICTS,
  phoneFormatForArchetype,
} from '@aibrains/shared-types'
import {
  ADDRESS_TYPE_OPTIONS,
  RELATIONSHIP_OPTIONS,
  optionValueToI18nKey,
} from '../staff-wizard.utils'
import { AnimatedInput, AnimatedSelect, SectionHeader } from './shared'

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
  const { t } = useTranslation('people')
  const addresses = (data.addresses as StaffAddress[]) || []
  const emergencyContacts = (data.emergencyContacts as EmergencyContact[]) || []
  const addressTypeOptions = ADDRESS_TYPE_OPTIONS.map((option) => ({
    ...option,
    label: t(`choices.addressType.${optionValueToI18nKey(option.value)}`, { defaultValue: option.label }),
  }))
  const relationshipOptions = RELATIONSHIP_OPTIONS.map((option) => ({
    ...option,
    label: t(`choices.relationship.${optionValueToI18nKey(option.value)}`, { defaultValue: option.label }),
  }))

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
          title={t('wizard.contact.primaryContact')}
          description={t('wizard.contact.primaryContactDescription')}
          icon={<Mail className="w-4 h-4" />}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatedInput
            label={t('fields.emailAddress')}
            required
            type="email"
            placeholder={t('wizard.placeholders.email')}
            autoComplete="email"
            value={(data.email as string) || ''}
            onChange={handleChange('email')}
            error={errors.email}
            icon={<Mail className="w-4 h-4" />}
          />
          <AnimatedInput
            label={t('fields.phoneNumberWithCode', { code: phoneFmt.dialCode })}
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
          title={t('wizard.contact.addresses')}
          description={t('wizard.contact.addressesDescription')}
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
                label={t('fields.addressType')}
                value={addr.addressTypeDescriptor || 'home'}
                onChange={(e) => updateAddress(index, 'addressTypeDescriptor', e.target.value)}
                options={addressTypeOptions}
              />
              <button
                type="button"
                onClick={() => removeAddress(index)}
                className="p-1.5 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--state-danger-fg))] hover:bg-[rgb(var(--state-danger-bg)/0.18)] dark:hover:bg-[rgb(var(--state-danger-bg)/0.18)] transition-colors"
                title={t('wizard.contact.removeAddress')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {nepalShape ? (
              /* Nepal-shaped fieldset (Sprint A.12) — for PABSON archetype or
                 GENERIC tenants in Nepal. Province → District cascading. */
              <>
                <AnimatedInput
                  label={t('fields.streetToleHouse')}
                  placeholder={t('wizard.placeholders.streetToleHouse')}
                  value={addr.streetNumberName || ''}
                  onChange={(e) => updateAddress(index, 'streetNumberName', e.target.value)}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <AnimatedSelect
                    label={t('fields.province')}
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
                    options={[{ value: '', label: t('wizard.placeholders.selectProvince') }, ...PROVINCE_OPTIONS]}
                  />
                  <AnimatedSelect
                    label={t('fields.district')}
                    value={addr.district || ''}
                    onChange={(e) => updateAddress(index, 'district', e.target.value)}
                    options={[
                      {
                        value: '',
                        label: addr.province ? t('wizard.placeholders.selectDistrict') : t('wizard.placeholders.pickProvinceFirst'),
                      },
                      ...districtOptionsFor(addr.province),
                    ]}
                  />
                </div>
                <AnimatedInput
                  label={t('fields.municipality')}
                  placeholder={t('wizard.placeholders.municipality')}
                  value={addr.municipality || ''}
                  onChange={(e) => updateAddress(index, 'municipality', e.target.value)}
                />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <AnimatedInput
                    label={t('fields.wardNumber')}
                    placeholder={t('wizard.placeholders.wardNumber')}
                    maxLength={10}
                    value={addr.wardNumber || ''}
                    onChange={(e) => updateAddress(index, 'wardNumber', e.target.value)}
                  />
                  <AnimatedInput
                    label={t('fields.postalCode')}
                    placeholder={t('wizard.placeholders.postalCodeNp')}
                    value={addr.postalCode || ''}
                    onChange={(e) => updateAddress(index, 'postalCode', e.target.value)}
                  />
                  <AnimatedInput
                    label={t('fields.country')}
                    placeholder={t('wizard.placeholders.nepal')}
                    value={t('wizard.placeholders.nepal')}
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
                    label={t('fields.street')}
                  placeholder="123 Main Street"
                  value={addr.streetNumberName || ''}
                  onChange={(e) => updateAddress(index, 'streetNumberName', e.target.value)}
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <AnimatedInput
                    label={t('fields.city')}
                    placeholder="Springfield"
                    value={addr.city || ''}
                    onChange={(e) => updateAddress(index, 'city', e.target.value)}
                  />
                  <AnimatedInput
                    label={t('fields.state')}
                    placeholder="IL"
                    maxLength={2}
                    value={addr.stateAbbreviationDescriptor || ''}
                    onChange={(e) =>
                      updateAddress(index, 'stateAbbreviationDescriptor', e.target.value.toUpperCase())
                    }
                    className="uppercase"
                  />
                  <AnimatedInput
                    label={t('fields.zipCode')}
                    placeholder="62704"
                    value={addr.postalCode || ''}
                    onChange={(e) => updateAddress(index, 'postalCode', e.target.value)}
                  />
                  <AnimatedInput
                    label={t('fields.country')}
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
          className="flex items-center gap-2 text-sm text-[rgb(var(--action-secondary-fg))]  hover:text-[rgb(var(--state-info-fg))] dark:hover:text-[rgb(var(--text-primary))] transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('wizard.contact.addAddress')}
        </button>
      </div>

      {/* Emergency Contacts */}
      <div className="space-y-4">
        <SectionHeader
          title={t('wizard.contact.emergencyContacts')}
          description={t('wizard.contact.emergencyContactsDescription')}
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
                {t('wizard.contact.contactNumber', { count: index + 1 })}
              </span>
              <button
                type="button"
                onClick={() => removeEmergencyContact(index)}
                className="p-1.5 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--state-danger-fg))] hover:bg-[rgb(var(--state-danger-bg)/0.18)] dark:hover:bg-[rgb(var(--state-danger-bg)/0.18)] transition-colors"
                title={t('wizard.contact.removeContact')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <AnimatedInput
                label={t('fields.fullName')}
                placeholder="Jane Smith"
                value={contact.name || ''}
                onChange={(e) => updateEmergencyContact(index, 'name', e.target.value)}
              />
              <AnimatedSelect
                label={t('fields.relationship')}
                value={contact.relationship || 'spouse'}
                onChange={(e) => updateEmergencyContact(index, 'relationship', e.target.value)}
                options={relationshipOptions}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <AnimatedInput
                label={t('fields.phoneWithCode', { code: phoneFmt.dialCode })}
                type="tel"
                placeholder={phoneFmt.placeholder}
                value={contact.phone || ''}
                onChange={(e) => updateEmergencyContact(index, 'phone', e.target.value)}
              />
              <AnimatedInput
                label={t('fields.email')}
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
          className="flex items-center gap-2 text-sm text-[rgb(var(--action-secondary-fg))]  hover:text-[rgb(var(--state-info-fg))] dark:hover:text-[rgb(var(--text-primary))] transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('wizard.contact.addEmergencyContact')}
        </button>
      </div>
    </motion.div>
  )
}
