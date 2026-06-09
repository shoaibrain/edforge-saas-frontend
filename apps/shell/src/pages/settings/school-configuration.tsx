/**
 * School Configuration Page
 * 
 * Modern, clean configuration interface for school settings.
 * 
 * Sections:
 * - Identity (name, type, website)
 * - Location & Contact
 * - Schedule & Operations (school days, hours, period duration)
 * - Academic Settings (grading scale, term structure)
 * - Features (module toggles)
 * - Notifications
 * - Attendance
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Building2,
  MapPin,
  Clock,
  GraduationCap,
  ClipboardCheck,
  Bell,
  Layers,
  AlertTriangle,
  Lock,
  AlertCircle,
} from 'lucide-react'
import { Select } from '@edforge/ui'
import { useAuthStore } from '@/stores/auth.store'
import { tenantService } from '@/services/tenant.service'
import type { School } from '@edforge/types'
import type { UpdateSchoolDto, UpdateSchoolConfigDto } from '@aibrains/shared-types'
import { isFieldLocked, getCountryConfig } from '@aibrains/shared-types'
import type { AddressFieldConfig } from '@aibrains/shared-types'
import { SchoolDaysSelector } from '@/components/settings/SchoolDaysSelector'
import { TimeRangePicker } from '@/components/settings/TimeRangePicker'
// GradingScaleEditor removed — grading scales are now managed exclusively via Grading Policies
// in the Grades & Assessments module (see GradingPolicyForm component)
import type { GradeLevelConfig } from '@/components/settings/GradingScaleEditor'
import { FeatureToggles, type SchoolFeatures, DEFAULT_FEATURES } from '@/components/settings/FeatureToggles'
import { UnsavedChangesBar, SettingsFieldRow } from '@/components/settings/SettingsShared'

// ============================================================================
// CONSTANTS
// ============================================================================

const SCHOOL_TYPE_OPTIONS = [
  { value: 'elementary', label: 'Elementary School' },
  { value: 'middle', label: 'Middle School' },
  { value: 'high', label: 'High School' },
  { value: 'k12', label: 'K-12 School' },
  { value: 'charter', label: 'Charter School' },
  { value: 'private', label: 'Private School' },
  { value: 'vocational', label: 'Vocational School' },
  { value: 'special_education', label: 'Special Education' },
]

const TERM_STRUCTURE_OPTIONS = [
  { value: 'semester', label: 'Semester (2 terms)' },
  { value: 'trimester', label: 'Trimester (3 terms)' },
  { value: 'quarter', label: 'Quarter (4 terms)' },
  { value: 'year', label: 'Full Year (1 term)' },
]

// ============================================================================
// SECTION COMPONENT
// ============================================================================

interface SectionProps {
  title: string
  description: string
  icon: React.ElementType
  children: React.ReactNode
}

function Section({ title, description, icon: Icon, children }: SectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))]">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[rgb(var(--text-primary))]">{title}</h2>
          <p className="text-sm text-[rgb(var(--text-tertiary))]">{description}</p>
        </div>
      </div>
      <div className="pl-12">
        {children}
      </div>
    </section>
  )
}

// FieldRow is now imported as SettingsFieldRow from SettingsShared

// ============================================================================
// TOGGLE SWITCH
// ============================================================================

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

function ToggleSwitch({ checked, onChange, disabled }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`
        relative w-11 h-6 rounded-full transition-colors
        ${checked ? 'bg-[rgb(var(--action-primary-bg))]' : 'bg-[rgb(var(--background-tertiary))]'}
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.40)] focus:ring-offset-2
      `}
      role="switch"
      aria-checked={checked}
    >
      <motion.span
        className="absolute top-1 left-1 w-4 h-4 bg-[rgb(var(--background-secondary))] rounded-full shadow"
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface SchoolConfigurationPageProps {
  schoolId: string
  school?: School
}

export default function SchoolConfigurationPage({ schoolId, school }: SchoolConfigurationPageProps) {
  useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  // Fetch configuration from API
  const { data: apiConfig, isLoading } = useQuery({
    queryKey: ['schoolConfiguration', schoolId],
    queryFn: () => tenantService.getSchoolConfiguration(schoolId),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  })

  // Field governance: determine if school has an active academic year
  const hasActiveAcademicYear = !!school?.currentAcademicYearId

  // Form state
  const [formState, setFormState] = useState<{
    // Identity
    displayName: string
    schoolType: string
    website: string
    // Location
    address: {
      street1: string
      street2?: string
      city: string
      state: string
      postalCode: string
      country: string
      wardNumber?: string
      municipality?: string
      district?: string
      province?: string
      region?: string
      zipCode?: string
      [key: string]: string | undefined
    }
    phone: string
    email: string
    // Schedule
    schoolDays: number[]
    startTime: string
    endTime: string
    periodDuration: number
    // Academic
    gradingScaleType: 'letter' | 'percentage' | 'points' | 'custom'
    gradingScale: GradeLevelConfig[]
    passingGrade: number
    termStructure: string
    // Features
    features: SchoolFeatures
    // Notifications
    notificationsEnabled: boolean
    emailNotifications: boolean
    smsNotifications: boolean
    // Attendance
    attendanceRequired: boolean
  } | null>(null)

  const [originalState, setOriginalState] = useState<typeof formState>(null)
  const [isDirty, setIsDirty] = useState(false)

  // Initialize form state from API data
  useEffect(() => {
    if (apiConfig && school) {
      const initialState = {
        // Identity (from school entity)
        displayName: school.name || '',
        schoolType: school.type || 'high',
        website: (apiConfig as any).identity?.website || '',
        // Location (from school entity)
        address: {
          street1: school.address?.street1 || '',
          street2: school.address?.street2 || '',
          city: school.address?.city || '',
          state: school.address?.state || '',
          postalCode: school.address?.postalCode || '',
          country: school.address?.country || 'USA',
          wardNumber: school.address?.wardNumber || '',
          municipality: school.address?.municipality || '',
          district: school.address?.district || '',
          province: school.address?.province || '',
          region: school.address?.region || '',
          zipCode: school.address?.zipCode || '',
        },
        phone: school.phone || '',
        email: school.email || '',
        // Schedule (from configuration)
        schoolDays: (apiConfig as any).schoolDays || [1, 2, 3, 4, 5],
        startTime: (apiConfig as any).startTime || '08:00',
        endTime: (apiConfig as any).endTime || '15:30',
        periodDuration: (apiConfig as any).periodDuration || 50,
        // Academic
        gradingScaleType: (apiConfig as any).gradingScale?.type || 'letter',
        gradingScale: (apiConfig as any).gradingScale?.scale || [
          { letter: 'A', minScore: 90, maxScore: 100, gpa: 4.0 },
          { letter: 'B', minScore: 80, maxScore: 89, gpa: 3.0 },
          { letter: 'C', minScore: 70, maxScore: 79, gpa: 2.0 },
          { letter: 'D', minScore: 60, maxScore: 69, gpa: 1.0 },
          { letter: 'F', minScore: 0, maxScore: 59, gpa: 0.0 },
        ],
        passingGrade: (apiConfig as any).gradingScale?.passingGrade || 60,
        termStructure: (apiConfig as any).academicCalendarType || 'semester',
        // Features
        features: (apiConfig as any).features || DEFAULT_FEATURES,
        // Notifications
        notificationsEnabled: (apiConfig as any).notificationsEnabled ?? true,
        emailNotifications: (apiConfig as any).emailNotifications ?? true,
        smsNotifications: (apiConfig as any).smsNotifications ?? false,
        // Attendance
        attendanceRequired: (apiConfig as any).attendanceRequired ?? true,
      }
      setFormState(initialState)
      setOriginalState(initialState)
    }
  }, [apiConfig, school])

  // Track dirty state
  useEffect(() => {
    if (formState && originalState) {
      setIsDirty(JSON.stringify(formState) !== JSON.stringify(originalState))
    }
  }, [formState, originalState])

  // Update mutations
  const updateSchoolMutation = useMutation({
    mutationFn: (data: UpdateSchoolDto) => tenantService.updateSchool(schoolId, data),
    onSuccess: (updatedSchool) => {
      queryClient.setQueryData(['school', schoolId], updatedSchool)
      queryClient.invalidateQueries({ queryKey: ['schools'] })
    },
  })

  const updateConfigMutation = useMutation({
    mutationFn: (data: UpdateSchoolConfigDto) => tenantService.updateSchoolConfiguration(schoolId, data as any),
    onSuccess: (updatedConfig) => {
      queryClient.setQueryData(['schoolConfiguration', schoolId], updatedConfig)
    },
  })

  const handleSave = async () => {
    if (!formState || !originalState) return

    try {
      // Check what changed and update appropriately
      const identityChanged = 
        formState.displayName !== originalState.displayName ||
        formState.schoolType !== originalState.schoolType ||
        formState.website !== originalState.website ||
        formState.phone !== originalState.phone ||
        formState.email !== originalState.email ||
        JSON.stringify(formState.address) !== JSON.stringify(originalState.address)

      const configChanged = 
        JSON.stringify(formState.schoolDays) !== JSON.stringify(originalState.schoolDays) ||
        formState.startTime !== originalState.startTime ||
        formState.endTime !== originalState.endTime ||
        formState.periodDuration !== originalState.periodDuration ||
        JSON.stringify(formState.gradingScale) !== JSON.stringify(originalState.gradingScale) ||
        formState.passingGrade !== originalState.passingGrade ||
        formState.termStructure !== originalState.termStructure ||
        JSON.stringify(formState.features) !== JSON.stringify(originalState.features) ||
        formState.notificationsEnabled !== originalState.notificationsEnabled ||
        formState.emailNotifications !== originalState.emailNotifications ||
        formState.smsNotifications !== originalState.smsNotifications ||
        formState.attendanceRequired !== originalState.attendanceRequired

      // Update school entity if changed
      if (identityChanged) {
        await updateSchoolMutation.mutateAsync({
          name: formState.displayName,
          schoolType: formState.schoolType as UpdateSchoolDto['schoolType'],
          website: formState.website || undefined,
          phone: formState.phone || undefined,
          email: formState.email || undefined,
          address: {
            street1: formState.address.street1,
            street2: formState.address.street2,
            city: formState.address.city,
            state: formState.address.state,
            zipCode: formState.address.postalCode || formState.address.zipCode,
            country: formState.address.country,
            wardNumber: formState.address.wardNumber || undefined,
            municipality: formState.address.municipality || undefined,
            district: formState.address.district || undefined,
            province: formState.address.province || undefined,
          },
        })
      }

      // Update configuration if changed
      if (configChanged) {
        await updateConfigMutation.mutateAsync({
          schoolDays: formState.schoolDays,
          startTime: formState.startTime,
          endTime: formState.endTime,
          periodDuration: formState.periodDuration,
          academicCalendarType: formState.termStructure as 'semester' | 'quarter' | 'trimester',
          gradingScale: {
            type: formState.gradingScaleType,
            passingGrade: formState.passingGrade,
            scale: formState.gradingScale,
          },
          features: formState.features,
          notificationsEnabled: formState.notificationsEnabled,
          emailNotifications: formState.emailNotifications,
          smsNotifications: formState.smsNotifications,
          attendanceRequired: formState.attendanceRequired,
        })
      }

      setOriginalState(formState)
      setIsDirty(false)
      toast.success('Configuration saved successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save changes')
    }
  }

  const handleReset = () => {
    if (originalState) {
      setFormState(originalState)
      setIsDirty(false)
    }
  }

  const updateField = <K extends keyof NonNullable<typeof formState>>(
    key: K,
    value: NonNullable<typeof formState>[K]
  ) => {
    setFormState((prev) => prev ? { ...prev, [key]: value } : null)
  }

  if (isLoading || !formState) {
    return (
      <div className="space-y-8 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[rgb(var(--background-tertiary))] rounded-lg" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-[rgb(var(--background-tertiary))] rounded" />
                <div className="h-3 w-48 bg-[rgb(var(--background-tertiary))] rounded" />
              </div>
            </div>
            <div className="pl-12 space-y-4">
              <div className="h-10 bg-[rgb(var(--background-tertiary))] rounded-xl" />
              <div className="h-10 bg-[rgb(var(--background-tertiary))] rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-8 pb-24">
      {/* Active Academic Year Banner */}
      {hasActiveAcademicYear && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Active Academic Year
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400/80 mt-0.5">
              Some settings are locked while an academic year is active. Schedule, term structure, and grading fields
              cannot be changed until the current academic year is completed or archived.
            </p>
          </div>
        </div>
      )}

      {/* Identity Section */}
      <Section
        title="School Identity"
        description="Basic school information"
        icon={Building2}
      >
        <SettingsFieldRow label="Display Name" description="Full name of the school">
          <input
            type="text"
            value={formState.displayName}
            onChange={(e) => updateField('displayName', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.40)] focus:border-[rgb(var(--border-focus))] transition-all"
          />
        </SettingsFieldRow>

        <SettingsFieldRow label="School Type" description="Level of education" inline>
          <Select
            aria-label="School Type"
            className="min-w-52"
            value={formState.schoolType}
            onChange={(v) => { if (v) updateField('schoolType', v) }}
            options={SCHOOL_TYPE_OPTIONS}
          />
        </SettingsFieldRow>

        <SettingsFieldRow label="Website" description="School's public website">
          <input
            type="url"
            value={formState.website}
            onChange={(e) => updateField('website', e.target.value)}
            placeholder="https://www.school.edu"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.40)] focus:border-[rgb(var(--border-focus))] transition-all"
          />
        </SettingsFieldRow>
      </Section>

      {/* Location & Contact Section */}
      <Section
        title="Location & Contact"
        description="Physical address and contact information"
        icon={MapPin}
      >
        {/* Render country-adaptive address fields from country config */}
        {(() => {
          const countryConfig = getCountryConfig(formState.address.country || 'USA');
          const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.40)] focus:border-[rgb(var(--border-focus))] transition-all";

          // Group address fields into rows (street1 alone, then remaining in pairs)
          const fields = countryConfig.addressFields.filter(f => f.key !== 'country');

          return fields.map((field: AddressFieldConfig) => (
            <SettingsFieldRow key={field.key} label={field.label}>
              {field.type === 'select' && field.options ? (
                <Select
                  aria-label={field.label}
                  className="w-full"
                  clearable
                  placeholder={field.placeholder || `Select ${field.label}`}
                  value={formState.address[field.key] || null}
                  onChange={(v) => updateField('address', { ...formState.address, [field.key]: v ?? '' })}
                  options={field.options.map((opt) => ({ value: opt.value, label: opt.label }))}
                />
              ) : (
                <input
                  type="text"
                  value={formState.address[field.key] || ''}
                  onChange={(e) => updateField('address', { ...formState.address, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  maxLength={field.maxLength}
                  className={inputClass}
                />
              )}
            </SettingsFieldRow>
          ));
        })()}

        <SettingsFieldRow label="Phone & Email">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="tel"
              value={formState.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="Phone number"
              className="px-3.5 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.40)] focus:border-[rgb(var(--border-focus))] transition-all"
            />
            <input
              type="email"
              value={formState.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="Email address"
              className="px-3.5 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.40)] focus:border-[rgb(var(--border-focus))] transition-all"
            />
          </div>
        </SettingsFieldRow>
      </Section>

      {/* Schedule & Operations Section */}
      <Section
        title="Schedule & Operations"
        description="School days and operating hours"
        icon={Clock}
      >
        <SettingsFieldRow label={
          <span className="flex items-center gap-1.5">
            School Days
            {isFieldLocked('schoolDays', hasActiveAcademicYear) && (
              <span title="Locked during active academic year">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
              </span>
            )}
          </span>
        } description="Days when school is in session">
          <SchoolDaysSelector
            selected={formState.schoolDays}
            onChange={(days) => updateField('schoolDays', days)}
            disabled={isFieldLocked('schoolDays', hasActiveAcademicYear)}
          />
        </SettingsFieldRow>

        <SettingsFieldRow label={
          <span className="flex items-center gap-1.5">
            School Hours
            {isFieldLocked('startTime', hasActiveAcademicYear) && (
              <span title="Locked during active academic year">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
              </span>
            )}
          </span>
        } description="Daily start and end times">
          <TimeRangePicker
            startTime={formState.startTime}
            endTime={formState.endTime}
            onChange={(start, end) => {
              updateField('startTime', start)
              updateField('endTime', end)
            }}
            disabled={isFieldLocked('startTime', hasActiveAcademicYear)}
          />
        </SettingsFieldRow>

        <SettingsFieldRow label={
          <span className="flex items-center gap-1.5">
            Period Duration
            {isFieldLocked('periodDuration', hasActiveAcademicYear) && (
              <span title="Locked during active academic year">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
              </span>
            )}
          </span>
        } description="Length of each class period" inline>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={formState.periodDuration}
              onChange={(e) => updateField('periodDuration', Number(e.target.value))}
              min={15}
              max={120}
              disabled={isFieldLocked('periodDuration', hasActiveAcademicYear)}
              className={`w-20 px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.40)] focus:border-[rgb(var(--border-focus))] transition-all ${isFieldLocked('periodDuration', hasActiveAcademicYear) ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <span className="text-sm text-[rgb(var(--text-tertiary))]">minutes</span>
          </div>
        </SettingsFieldRow>
      </Section>

      {/* Academic Settings Section */}
      <Section
        title="Academic Settings"
        description="Grading and term structure"
        icon={GraduationCap}
      >
        <SettingsFieldRow label={
          <span className="flex items-center gap-1.5">
            Term Structure
            {isFieldLocked('academicCalendarType', hasActiveAcademicYear) && (
              <span title="Locked during active academic year">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
              </span>
            )}
          </span>
        } description="How the academic year is divided" inline>
          <Select
            aria-label="Term Structure"
            className="min-w-52"
            value={formState.termStructure}
            onChange={(v) => { if (v) updateField('termStructure', v) }}
            disabled={isFieldLocked('academicCalendarType', hasActiveAcademicYear)}
            options={TERM_STRUCTURE_OPTIONS}
          />
        </SettingsFieldRow>

        <SettingsFieldRow label="Grading Scale" description="Grading policies are managed in the Grades & Assessments module">
          <div className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] p-4">
            <p className="text-sm text-[rgb(var(--text-secondary))] mb-3">
              Grading scales, category weights, and calculation rules are configured through Grading Policies in the Grades & Assessments module.
            </p>
            <a
              href="/academics/classrooms?tab=gradebook"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[rgb(var(--action-secondary-fg))]  bg-[rgb(var(--state-info-bg)/0.18)] dark:bg-[rgb(var(--action-primary-bg))]/10 hover:bg-[rgb(var(--state-info-bg)/0.18)] dark:hover:bg-[rgb(var(--action-primary-bg))]/20 rounded-lg transition-colors"
            >
              <GraduationCap className="w-4 h-4" />
              Manage Grading Policies
            </a>
          </div>
        </SettingsFieldRow>
      </Section>

      {/* Features Section */}
      <Section
        title="Enabled Features"
        description="Control which modules are active for this school"
        icon={Layers}
      >
        <div className="py-2">
          <FeatureToggles
            features={formState.features}
            onChange={(features) => updateField('features', features)}
          />
        </div>
      </Section>

      {/* Notifications Section */}
      <Section
        title="Notifications"
        description="Configure how notifications are delivered"
        icon={Bell}
      >
        <SettingsFieldRow label="Enable Notifications" description="Master toggle for all notifications" inline>
          <ToggleSwitch
            checked={formState.notificationsEnabled}
            onChange={(checked) => updateField('notificationsEnabled', checked)}
          />
        </SettingsFieldRow>

        {formState.notificationsEnabled && (
          <>
            <SettingsFieldRow label="Email Notifications" description="Send notifications via email" inline>
              <ToggleSwitch
                checked={formState.emailNotifications}
                onChange={(checked) => updateField('emailNotifications', checked)}
              />
            </SettingsFieldRow>

            <SettingsFieldRow label="SMS Notifications" description="Send notifications via text message" inline>
              <ToggleSwitch
                checked={formState.smsNotifications}
                onChange={(checked) => updateField('smsNotifications', checked)}
              />
            </SettingsFieldRow>
          </>
        )}
      </Section>

      {/* Attendance Section */}
      <Section
        title="Attendance Settings"
        description="Attendance tracking configuration"
        icon={ClipboardCheck}
      >
        <SettingsFieldRow label="Attendance Required" description="Is attendance tracking mandatory for this school?" inline>
          <ToggleSwitch
            checked={formState.attendanceRequired}
            onChange={(checked) => updateField('attendanceRequired', checked)}
          />
        </SettingsFieldRow>
      </Section>

      {/* Workspace Inheritance Notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-[rgb(var(--state-info-bg)/0.18)] border border-[rgb(var(--state-info-border)/0.35)]">
        <AlertTriangle className="w-5 h-5 text-[rgb(var(--state-info-fg))]  flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-[rgb(var(--state-info-fg))] ">
            <strong>Inheriting from Workspace:</strong> Some settings are inherited from your organization's workspace settings.
            Changes here will override the workspace defaults for this school only.
          </p>
        </div>
      </div>

      {/* Floating Save Bar */}
      <UnsavedChangesBar
        isDirty={isDirty}
        onReset={handleReset}
        onSave={handleSave}
        isSaving={updateSchoolMutation.isPending || updateConfigMutation.isPending}
      />
    </div>
  )
}
