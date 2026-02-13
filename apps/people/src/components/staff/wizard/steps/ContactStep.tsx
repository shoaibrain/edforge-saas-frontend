/**
 * Contact & Address Step
 *
 * Step 2: Email, phone, addresses, and emergency contacts.
 * Email is required; everything else is optional.
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, AlertTriangle, Plus, X } from 'lucide-react'
import type { WizardStepProps } from '@edforge/wizard'
import {
  ADDRESS_TYPE_OPTIONS,
  RELATIONSHIP_OPTIONS,
} from '../staff-wizard.utils'
import { AnimatedInput, AnimatedSelect, SectionHeader } from './shared'

// ============================================================================
// ADDRESS ENTRY
// ============================================================================

interface StaffAddress {
  addressTypeDescriptor: string
  streetNumberName: string
  city: string
  stateAbbreviationDescriptor: string
  postalCode: string
  country: string
}

function emptyAddress(): StaffAddress {
  return {
    addressTypeDescriptor: 'home',
    streetNumberName: '',
    city: '',
    stateAbbreviationDescriptor: '',
    postalCode: '',
    country: 'US',
  }
}

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

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    updateData({ [field]: e.target.value })
    clearError(field)
  }

  // Address helpers
  const addAddress = () => {
    updateData({ addresses: [...addresses, emptyAddress()] })
  }
  const removeAddress = (index: number) => {
    updateData({ addresses: addresses.filter((_, i) => i !== index) })
  }
  const updateAddress = (index: number, field: string, value: string) => {
    const updated = [...addresses]
    updated[index] = { ...updated[index], [field]: value }
    updateData({ addresses: updated })
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
            label="Phone Number"
            type="tel"
            placeholder="(555) 123-4567"
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
                onChange={(e) => updateAddress(index, 'stateAbbreviationDescriptor', e.target.value.toUpperCase())}
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
                label="Phone"
                type="tel"
                placeholder="(555) 987-6543"
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
