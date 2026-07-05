/**
 * Location & Contact Step
 *
 * Step 2: Physical address, phone, email, and website.
 * Country-adaptive: renders different address fields based on selected country.
 * All fields in this step are optional — the step itself is skippable.
 */

import { useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Phone, Mail, Globe } from 'lucide-react'
import type { WizardStepProps } from '@edforge/wizard'
import { useShell } from '@/lib/shell-context'
import { AnimatedInput, AnimatedSelect } from './BasicInfoStep'
import {
  COUNTRY_OPTIONS,
  getCountryConfig,
  getTimezoneOptionsForCountry,
  STATE_TIMEZONE_MAP,
} from '../school-wizard.utils'

const CALENDAR_TYPE_OPTIONS = [
  { value: 'semester', label: 'Semester (2 terms)' },
  { value: 'quarter', label: 'Quarter (4 terms)' },
  { value: 'trimester', label: 'Trimester (3 terms)' },
  { value: 'annual', label: 'Annual (1 term)' },
]

export function LocationContactStep({ data, updateData, errors, clearError }: WizardStepProps) {
  const { resolvedSettings } = useShell()

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    updateData({ [field]: e.target.value })
    clearError(field)
  }

  const country = (data['address.country'] as string) || 'USA'
  const countryConfig = useMemo(() => getCountryConfig(country), [country])
  const timezoneOptions = useMemo(() => getTimezoneOptionsForCountry(country), [country])

  // When country changes, set defaults
  const prevCountryRef = useRef(country)
  useEffect(() => {
    if (country !== prevCountryRef.current) {
      prevCountryRef.current = country
      const config = getCountryConfig(country)
      updateData({
        timezone: config.defaultTimezone,
        locale: config.defaultLocale,
        calendarSystem: config.defaultCalendarSystem,
        academicCalendarType: config.defaultCalendarSystem === 'bikram_sambat' ? 'annual' : 'semester',
      })
    }
  }, [country]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-set timezone when US state abbreviation changes
  const prevStateRef = useRef(data['address.state'] as string)
  useEffect(() => {
    if (country !== 'USA') return
    const state = (data['address.state'] as string || '').toUpperCase()
    if (state && state !== prevStateRef.current && state.length === 2) {
      prevStateRef.current = state
      const tz = STATE_TIMEZONE_MAP[state]
      if (tz && !data.timezone) {
        updateData({ timezone: tz })
      }
    }
  }, [data['address.state']]) // eslint-disable-line react-hooks/exhaustive-deps

  // Render country-specific address fields
  const renderAddressFields = () => {
    const addressFields = countryConfig.addressFields.filter(f => f.key !== 'country')

    return addressFields.map((field) => {
      if (field.type === 'select' && field.options) {
        return (
          <AnimatedSelect
            key={field.key}
            label={field.label}
            value={(data[`address.${field.key}`] as string) || ''}
            onChange={handleChange(`address.${field.key}`)}
            options={[{ value: '', label: `Select ${field.label}` }, ...field.options]}
            error={errors[`address.${field.key}`]}
          />
        )
      }

      return (
        <AnimatedInput
          key={field.key}
          label={field.label}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          value={(data[`address.${field.key}`] as string) || ''}
          onChange={handleChange(`address.${field.key}`)}
          error={errors[`address.${field.key}`]}
          helpText={!field.required ? 'Optional' : undefined}
          className={field.key === 'state' && country === 'USA' ? 'font-mono uppercase' : undefined}
        />
      )
    })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Country Selection */}
      <div className="space-y-4">
        <AnimatedSelect
          label="Country"
          value={country}
          onChange={handleChange('address.country')}
          options={COUNTRY_OPTIONS}
        />
      </div>

      {/* Address */}
      <div className="space-y-4">
        <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wider font-medium">
          Physical Address
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderAddressFields()}
        </div>
      </div>

      {/* Contact Information */}
      <div className="pt-4 border-t border-[rgb(var(--border-secondary))]">
        <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wider font-medium mb-4">
          Contact Information
        </p>
        <div className="space-y-4">
          <AnimatedInput
            label="Phone Number"
            type="tel"
            placeholder={countryConfig.phonePrefix ? `${countryConfig.phonePrefix} ...` : '(555) 123-4567'}
            autoComplete="tel"
            icon={<Phone className="w-4 h-4" />}
            value={(data.phone as string) || ''}
            onChange={handleChange('phone')}
            error={errors.phone}
          />
          <AnimatedInput
            label="Email Address"
            type="email"
            placeholder="office@school.edu"
            autoComplete="email"
            icon={<Mail className="w-4 h-4" />}
            value={(data.email as string) || ''}
            onChange={handleChange('email')}
            error={errors.email}
          />
          <AnimatedInput
            label="Website"
            type="url"
            placeholder="https://school.edu"
            autoComplete="url"
            icon={<Globe className="w-4 h-4" />}
            value={(data.website as string) || ''}
            onChange={handleChange('website')}
            error={errors.website}
          />
        </div>
      </div>

      {/* Timezone & Calendar */}
      <div className="pt-4 border-t border-[rgb(var(--border-secondary))]">
        <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wider font-medium mb-4">
          Regional Settings
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <AnimatedSelect
              label="Timezone"
              value={(data.timezone as string) || countryConfig.defaultTimezone}
              onChange={handleChange('timezone')}
              options={timezoneOptions}
            />
            {(data.timezone as string) === resolvedSettings.timezone && (
              <p className="mt-1 text-xs text-[rgb(var(--text-tertiary))]">
                Inherited from organization settings — you can override this per school.
              </p>
            )}
          </div>
          <AnimatedSelect
            label="Academic Calendar Type"
            value={(data.academicCalendarType as string) || (countryConfig.defaultCalendarSystem === 'bikram_sambat' ? 'annual' : 'semester')}
            onChange={handleChange('academicCalendarType')}
            options={CALENDAR_TYPE_OPTIONS}
          />
        </div>
        {countryConfig.defaultCalendarSystem !== 'gregorian' && (
          <div className="mt-3 px-3 py-2 rounded-md bg-[rgb(var(--bg-secondary))] text-sm text-[rgb(var(--text-secondary))]">
            Calendar System: <span className="font-medium capitalize">{countryConfig.defaultCalendarSystem.replace('_', ' ')}</span>
            {(data.calendarSystem as string) === resolvedSettings.calendarSystem ? (
              <span className="text-xs ms-2">(inherited from organization settings)</span>
            ) : (
              <span className="text-xs ms-2">(auto-set from country)</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
