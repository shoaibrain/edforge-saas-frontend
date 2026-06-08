/**
 * Personal Information Wizard Step
 * 
 * First step in the person creation wizard.
 * Uses shared @edforge/forms components.
 */

import React, { useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  User,
  Calendar,
  Camera,
  X,
  Sparkles,
} from 'lucide-react'
import type { WizardStepProps } from '@edforge/wizard'
import { Avatar, Input, Select } from '@edforge/ui'
import { cn } from '@edforge/ui'

// ============================================================================
// ANIMATED INPUT COMPONENT (Domain-specific styling)
// ============================================================================

interface AnimatedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string
  error?: string
  icon?: React.ReactNode
  required?: boolean
  helpText?: string
}

const AnimatedInput = React.forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ label, error, icon, required, helpText, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
          {label}
          {required && <span className="text-rust-500 ml-0.5">*</span>}
        </label>
        <Input
          ref={ref}
          invalid={Boolean(error)}
          prefix={icon}
          className={className}
          {...props}
        />
        {helpText && !error && (
          <p className="text-xs text-[rgb(var(--text-tertiary))]">{helpText}</p>
        )}
        {error && (
          <p className="text-xs text-rust-500">{error}</p>
        )}
      </div>
    )
  }
)

AnimatedInput.displayName = 'AnimatedInput'

// ============================================================================
// ANIMATED SELECT COMPONENT
// ============================================================================

interface AnimatedSelectProps {
  label: string
  error?: string
  icon?: React.ReactNode
  required?: boolean
  options: { value: string; label: string }[]
  value?: string
  onChange?: React.ChangeEventHandler<HTMLSelectElement>
}

function AnimatedSelect({ label, error, icon, required, options, value, onChange }: AnimatedSelectProps) {
  const placeholderOption = options.find((opt) => opt.value === '')
  const selectableOptions = options.filter((opt) => opt.value !== '')

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
        {label}
        {required && <span className="text-rust-500 ml-0.5">*</span>}
      </label>
      <Select
        options={selectableOptions}
        value={value || null}
        onChange={(v) => onChange?.({ target: { value: v ?? '' } } as React.ChangeEvent<HTMLSelectElement>)}
        placeholder={placeholderOption?.label}
        leadingIcon={icon}
        invalid={Boolean(error)}
      />
      {error && (
        <p className="text-xs text-rust-500">{error}</p>
      )}
    </div>
  )
}

AnimatedSelect.displayName = 'AnimatedSelect'

// ============================================================================
// PHOTO UPLOAD COMPONENT
// ============================================================================

interface PhotoUploadProps {
  value?: string
  onChange: (url: string | undefined) => void
  name: string
  error?: string
}

function PhotoUpload({ value, onChange, error }: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [hovered, setHovered] = useState(false)

  const handleFileChange = useCallback((file: File) => {
    const url = URL.createObjectURL(file)
    onChange(url)
  }, [onChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleFileChange(file)
    }
  }, [handleFileChange])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileChange(file)
    }
  }, [handleFileChange])

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
        Profile Photo
        <span className="ml-1 text-xs text-[rgb(var(--text-tertiary))]">(optional)</span>
      </label>

      <motion.div
        animate={{
          scale: hovered ? 1.02 : 1,
          borderColor: dragOver ? 'rgb(10, 147, 150)' : 'rgb(var(--border-primary))',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center',
          'w-32 h-32 rounded-2xl border-2 border-dashed',
          'bg-[rgb(var(--background-tertiary))]',
          'transition-colors cursor-pointer',
          dragOver && 'bg-[rgb(var(--state-info-bg)/0.18)]'
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />

        {value ? (
          <>
            <img
              src={value}
              alt="Profile preview"
              className="w-full h-full rounded-2xl object-cover"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange(undefined)
              }}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[rgb(var(--action-danger-bg))] text-[rgb(var(--action-primary-fg))] flex items-center justify-center shadow-md hover:brightness-95 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-[rgb(var(--text-tertiary))]">
            <div className="w-12 h-12 rounded-full bg-[rgb(var(--background-secondary))] flex items-center justify-center">
              <Camera className="w-6 h-6" />
            </div>
            <span className="text-xs text-center">
              Click or drag<br />to upload
            </span>
          </div>
        )}
      </motion.div>

      {error && (
        <p className="text-xs text-rust-500">{error}</p>
      )}
    </div>
  )
}

// ============================================================================
// AGE CALCULATION HELPER
// ============================================================================

function calculateAge(birthDate: string): number | null {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PersonalInfoStep({
  data,
  updateData,
  errors,
  clearError,
}: WizardStepProps) {
  const age = calculateAge(data.dateOfBirth as string)

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    updateData({ [field]: e.target.value })
    clearError(field)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Photo Upload Section */}
      <div className="flex items-start gap-6">
        <PhotoUpload
          value={data.avatar as string}
          onChange={(url) => updateData({ avatar: url })}
          name="avatar"
          error={errors.avatar}
        />

        <div className="flex-1 pt-2">
          <h3 className="text-sm font-medium text-[rgb(var(--text-primary))] mb-1">
            Add a profile photo
          </h3>
          <p className="text-xs text-[rgb(var(--text-tertiary))]">
            A photo helps identify this person. You can upload JPG, PNG, or GIF files up to 5MB.
          </p>
          {typeof data.firstName === 'string' && typeof data.lastName === 'string' && data.firstName && data.lastName && (
            <div className="mt-4 flex items-center gap-3">
              <Avatar
                name={`${data.firstName} ${data.lastName}`}
                size="sm"
                shape="rounded"
              />
              <div className="flex items-center gap-1 text-xs text-[rgb(var(--text-tertiary))]">
                <Sparkles className="w-3 h-3 text-golden-500" />
                <span>Auto-generated avatar</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AnimatedInput
          label="First Name"
          placeholder="John"
          icon={<User className="w-4 h-4" />}
          required
          value={(data.firstName as string) || ''}
          onChange={handleChange('firstName')}
          error={errors.firstName}
          autoComplete="given-name"
        />
        <AnimatedInput
          label="Middle Name"
          placeholder="William"
          icon={<User className="w-4 h-4" />}
          value={(data.middleName as string) || ''}
          onChange={handleChange('middleName')}
          error={errors.middleName}
          autoComplete="additional-name"
        />
        <AnimatedInput
          label="Last Name"
          placeholder="Doe"
          icon={<User className="w-4 h-4" />}
          required
          value={(data.lastName as string) || ''}
          onChange={handleChange('lastName')}
          error={errors.lastName}
          autoComplete="family-name"
        />
      </div>

      {/* Date of Birth and Gender */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <AnimatedInput
            label="Date of Birth"
            type="date"
            icon={<Calendar className="w-4 h-4" />}
            value={(data.dateOfBirth as string) || ''}
            onChange={handleChange('dateOfBirth')}
            error={errors.dateOfBirth}
            max={new Date().toISOString().split('T')[0]}
          />
          {age !== null && age >= 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-[rgb(var(--text-tertiary))] flex items-center gap-1"
            >
              <Calendar className="w-3 h-3" />
              {age} years old
            </motion.p>
          )}
        </div>

        <AnimatedSelect
          label="Gender"
          icon={<User className="w-4 h-4" />}
          value={(data.gender as string) || ''}
          onChange={handleChange('gender')}
          error={errors.gender}
          options={[
            { value: '', label: 'Select gender...' },
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' },
            { value: 'prefer_not_to_say', label: 'Prefer not to say' },
          ]}
        />
      </div>
    </motion.div>
  )
}
