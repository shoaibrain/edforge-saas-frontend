/**
 * Contact & Address Wizard Step
 * 
 * Second step in the person creation wizard.
 * Captures contact and address information:
 * - Primary & Secondary Email
 * - Phone Numbers (with type selection)
 * - Full Address with country/state selectors
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSpring, animated } from '@react-spring/web'
import {
  Mail,
  Phone,
  MapPin,
  Home,
  Building2,
  Globe,
  Plus,
  X,
  AlertCircle,
} from 'lucide-react'
import type { WizardStepProps } from '../WizardContext'
import { cn } from '@/lib/utils'

// ============================================================================
// ANIMATED INPUT COMPONENT
// ============================================================================

interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  icon?: React.ReactNode
  required?: boolean
  helpText?: string
}

const AnimatedInput = React.forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ label, error, icon, required, helpText, className, ...props }, ref) => {
    const [focused, setFocused] = React.useState(false)
    
    const springProps = useSpring({
      borderColor: error
        ? 'rgb(185, 62, 3)'
        : focused
        ? 'rgb(10, 147, 150)'
        : 'rgb(var(--border-primary))',
      boxShadow: error
        ? '0 0 0 3px rgba(185, 62, 3, 0.15)'
        : focused
        ? '0 0 0 3px rgba(10, 147, 150, 0.15)'
        : '0 0 0 0px transparent',
      config: { tension: 300, friction: 20 },
    })

    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
          {label}
          {required && <span className="text-rust-500 ml-0.5">*</span>}
        </label>
        <animated.div
          style={{
            borderColor: springProps.borderColor,
            boxShadow: springProps.boxShadow,
          }}
          className="relative rounded-xl border-2 bg-[rgb(var(--surface-tertiary))] overflow-hidden transition-colors"
        >
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-tertiary))]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            {...props}
            onFocus={(e) => {
              setFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setFocused(false)
              props.onBlur?.(e)
            }}
            className={cn(
              'w-full px-4 py-3 bg-transparent',
              'text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))]',
              'focus:outline-none',
              'text-sm',
              icon && 'pl-11',
              className
            )}
          />
        </animated.div>
        {helpText && !error && (
          <p className="text-xs text-[rgb(var(--text-tertiary))]">{helpText}</p>
        )}
        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -5, height: 0 }}
              className="flex items-center gap-1.5 text-xs text-rust-500"
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

AnimatedInput.displayName = 'AnimatedInput'

// ============================================================================
// ANIMATED SELECT COMPONENT
// ============================================================================

interface AnimatedSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  icon?: React.ReactNode
  required?: boolean
  options: { value: string; label: string }[]
}

const AnimatedSelect = React.forwardRef<HTMLSelectElement, AnimatedSelectProps>(
  ({ label, error, icon, required, options, className, ...props }, ref) => {
    const [focused, setFocused] = React.useState(false)
    
    const springProps = useSpring({
      borderColor: error
        ? 'rgb(185, 62, 3)'
        : focused
        ? 'rgb(10, 147, 150)'
        : 'rgb(var(--border-primary))',
      boxShadow: error
        ? '0 0 0 3px rgba(185, 62, 3, 0.15)'
        : focused
        ? '0 0 0 3px rgba(10, 147, 150, 0.15)'
        : '0 0 0 0px transparent',
      config: { tension: 300, friction: 20 },
    })

    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
          {label}
          {required && <span className="text-rust-500 ml-0.5">*</span>}
        </label>
        <animated.div
          style={{
            borderColor: springProps.borderColor,
            boxShadow: springProps.boxShadow,
          }}
          className="relative rounded-xl border-2 bg-[rgb(var(--surface-tertiary))] overflow-hidden transition-colors"
        >
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-tertiary))] z-10">
              {icon}
            </div>
          )}
          <select
            ref={ref}
            {...props}
            onFocus={(e) => {
              setFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setFocused(false)
              props.onBlur?.(e)
            }}
            className={cn(
              'w-full px-4 py-3 bg-transparent appearance-none',
              'text-[rgb(var(--text-primary))]',
              'focus:outline-none',
              'text-sm',
              icon && 'pl-11',
              'pr-10',
              className
            )}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-[rgb(var(--text-tertiary))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </animated.div>
        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -5, height: 0 }}
              className="flex items-center gap-1.5 text-xs text-rust-500"
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

AnimatedSelect.displayName = 'AnimatedSelect'

// ============================================================================
// PHONE NUMBER INPUT WITH TYPE
// ============================================================================

interface PhoneEntry {
  type: 'mobile' | 'home' | 'work'
  number: string
}

interface PhoneInputGroupProps {
  phones: PhoneEntry[]
  onChange: (phones: PhoneEntry[]) => void
  errors?: Record<string, string>
}

function PhoneInputGroup({ phones, onChange }: PhoneInputGroupProps) {
  const addPhone = () => {
    onChange([...phones, { type: 'mobile', number: '' }])
  }

  const removePhone = (index: number) => {
    onChange(phones.filter((_, i) => i !== index))
  }

  const updatePhone = (index: number, field: keyof PhoneEntry, value: string) => {
    const updated = [...phones]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
          Phone Numbers
        </label>
        <button
          type="button"
          onClick={addPhone}
          className="flex items-center gap-1 text-xs font-medium text-teal-600 dark:text-cyan-400 hover:underline"
        >
          <Plus className="w-3 h-3" />
          Add Phone
        </button>
      </div>

      <AnimatePresence mode="popLayout">
        {phones.map((phone, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2"
          >
            <div className="w-32">
              <select
                value={phone.type}
                onChange={(e) => updatePhone(index, 'type', e.target.value)}
                className={cn(
                  'w-full px-3 py-3 rounded-xl border-2 bg-[rgb(var(--surface-tertiary))]',
                  'text-sm text-[rgb(var(--text-primary))]',
                  'border-[rgb(var(--border-primary))]',
                  'focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20',
                  'appearance-none'
                )}
              >
                <option value="mobile">Mobile</option>
                <option value="home">Home</option>
                <option value="work">Work</option>
              </select>
            </div>
            <div className="flex-1 relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
              <input
                type="tel"
                value={phone.number}
                onChange={(e) => updatePhone(index, 'number', e.target.value)}
                placeholder="(555) 123-4567"
                className={cn(
                  'w-full pl-11 pr-4 py-3 rounded-xl border-2 bg-[rgb(var(--surface-tertiary))]',
                  'text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))]',
                  'border-[rgb(var(--border-primary))]',
                  'focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
                )}
              />
            </div>
            {phones.length > 1 && (
              <button
                type="button"
                onClick={() => removePhone(index)}
                className="p-2 rounded-lg text-rust-500 hover:bg-rust-500/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {phones.length === 0 && (
        <button
          type="button"
          onClick={addPhone}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-4',
            'border-2 border-dashed border-[rgb(var(--border-primary))] rounded-xl',
            'text-sm text-[rgb(var(--text-tertiary))]',
            'hover:border-teal-500/50 hover:bg-teal-500/5 transition-colors'
          )}
        >
          <Plus className="w-4 h-4" />
          Add a phone number
        </button>
      )}
    </div>
  )
}

// ============================================================================
// COUNTRY/STATE OPTIONS
// ============================================================================

const COUNTRY_OPTIONS = [
  { value: '', label: 'Select country...' },
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'JP', label: 'Japan' },
  { value: 'IN', label: 'India' },
]

const US_STATE_OPTIONS = [
  { value: '', label: 'Select state...' },
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
]

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ContactAddressStep({
  data,
  updateData,
  errors,
  clearError,
}: WizardStepProps) {
  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    updateData({ [field]: e.target.value })
    clearError(field)
  }

  const handleAddressChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const address = (data.address as Record<string, string>) || {}
    updateData({
      address: {
        ...address,
        [field]: e.target.value,
      },
    })
    clearError(`address.${field}`)
  }

  const phones = (data.phones as PhoneEntry[]) || [{ type: 'mobile', number: '' }]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Email Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))] uppercase tracking-wider">
          Email Addresses
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatedInput
            label="Primary Email"
            type="email"
            placeholder="john.doe@example.com"
            icon={<Mail className="w-4 h-4" />}
            required
            value={(data.email as string) || ''}
            onChange={handleChange('email')}
            error={errors.email}
            autoComplete="email"
          />
          <AnimatedInput
            label="Secondary Email"
            type="email"
            placeholder="john.personal@email.com"
            icon={<Mail className="w-4 h-4" />}
            value={(data.secondaryEmail as string) || ''}
            onChange={handleChange('secondaryEmail')}
            error={errors.secondaryEmail}
            helpText="Optional backup email"
          />
        </div>
      </div>

      {/* Phone Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))] uppercase tracking-wider">
          Phone Numbers
        </h3>
        
        <PhoneInputGroup
          phones={phones}
          onChange={(newPhones) => updateData({ phones: newPhones })}
          errors={errors}
        />
      </div>

      {/* Address Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))] uppercase tracking-wider">
          Address
        </h3>
        
        <AnimatedInput
          label="Street Address"
          placeholder="123 Main Street"
          icon={<Home className="w-4 h-4" />}
          value={((data.address as Record<string, string>)?.street as string) || ''}
          onChange={handleAddressChange('street')}
          error={errors['address.street']}
          autoComplete="street-address"
        />

        <AnimatedInput
          label="Apartment, Suite, etc."
          placeholder="Apt 4B"
          icon={<Building2 className="w-4 h-4" />}
          value={((data.address as Record<string, string>)?.street2 as string) || ''}
          onChange={handleAddressChange('street2')}
          error={errors['address.street2']}
          autoComplete="address-line2"
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AnimatedInput
            label="City"
            placeholder="New York"
            icon={<MapPin className="w-4 h-4" />}
            value={((data.address as Record<string, string>)?.city as string) || ''}
            onChange={handleAddressChange('city')}
            error={errors['address.city']}
            autoComplete="address-level2"
          />
          
          <AnimatedSelect
            label="State"
            icon={<MapPin className="w-4 h-4" />}
            value={((data.address as Record<string, string>)?.state as string) || ''}
            onChange={handleAddressChange('state')}
            error={errors['address.state']}
            options={US_STATE_OPTIONS}
          />

          <AnimatedInput
            label="ZIP Code"
            placeholder="10001"
            value={((data.address as Record<string, string>)?.postalCode as string) || ''}
            onChange={handleAddressChange('postalCode')}
            error={errors['address.postalCode']}
            autoComplete="postal-code"
          />

          <AnimatedSelect
            label="Country"
            icon={<Globe className="w-4 h-4" />}
            value={((data.address as Record<string, string>)?.country as string) || 'US'}
            onChange={handleAddressChange('country')}
            error={errors['address.country']}
            options={COUNTRY_OPTIONS}
          />
        </div>
      </div>
    </motion.div>
  )
}

