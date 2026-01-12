/**
 * School Configuration Page
 * 
 * School-specific configuration that can override workspace defaults.
 * 
 * Sections:
 * - Identity (name, code, type, logo)
 * - Location & Contact
 * - Operations (hours, grade levels)
 * - Academic (grading, report cards)
 * - Attendance
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Building2,
  MapPin,
  Clock,
  GraduationCap,
  ClipboardCheck,
  AlertTriangle,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { tenantService } from '@/services/tenant.service'
import type { SchoolAddress } from '@edforge/types'
import {
  SettingsSection,
  SettingsCard,
  SettingsAlert,
  staggerChildren,
  fadeInUp,
} from '@/components/settings/SettingsShared'

// ============================================================================
// LOCAL TYPES (until @edforge/types is rebuilt)
// ============================================================================

interface OperatingHours {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6
  isOpen: boolean
  openTime?: string
  closeTime?: string
}

interface SchoolConfiguration {
  schoolId: string
  identity: {
    displayName: string
    shortCode: string
    schoolType: 'elementary' | 'middle' | 'high' | 'k12' | 'other'
    logoUrl?: string
    website?: string
  }
  location: {
    address: SchoolAddress
    timezone?: string
    phone?: string
    email?: string
    fax?: string
  }
  operations: {
    operatingHours: OperatingHours[]
    gradeLevels: string[]
    capacity?: number
  }
  academic: {
    gradingScale: 'letter' | 'percentage' | 'points' | 'custom'
    customGradingScale?: {
      grades: { letter: string; minPercentage: number; maxPercentage: number; gpaPoints: number }[]
    }
    reportCardFormat: 'standard' | 'narrative' | 'standards-based'
    termStructure: 'semester' | 'trimester' | 'quarter' | 'custom'
  }
  attendance: {
    policy: 'daily' | 'period' | 'both'
    tardyThresholdMinutes: number
    excusedAbsenceTypes: string[]
    unexcusedAbsenceTypes: string[]
  }
  inheritsFromWorkspace: boolean
  createdAt: string
  updatedAt: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SCHOOL_TYPE_OPTIONS = [
  { value: 'elementary', label: 'Elementary School' },
  { value: 'middle', label: 'Middle School' },
  { value: 'high', label: 'High School' },
  { value: 'k12', label: 'K-12 School' },
  { value: 'other', label: 'Other' },
]

const GRADING_SCALE_OPTIONS = [
  { value: 'letter', label: 'Letter Grades (A-F)' },
  { value: 'percentage', label: 'Percentage (0-100%)' },
  { value: 'points', label: 'Points-based' },
  { value: 'custom', label: 'Custom Scale' },
]

const REPORT_CARD_OPTIONS = [
  { value: 'standard', label: 'Standard Report Card' },
  { value: 'narrative', label: 'Narrative-based' },
  { value: 'standards-based', label: 'Standards-based' },
]

const TERM_STRUCTURE_OPTIONS = [
  { value: 'semester', label: 'Semester (2 terms)' },
  { value: 'trimester', label: 'Trimester (3 terms)' },
  { value: 'quarter', label: 'Quarter (4 terms)' },
  { value: 'custom', label: 'Custom' },
]

const ATTENDANCE_POLICY_OPTIONS = [
  { value: 'daily', label: 'Daily Attendance' },
  { value: 'period', label: 'Period-by-Period' },
  { value: 'both', label: 'Both Daily & Period' },
]

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const GRADE_LEVEL_OPTIONS = [
  'Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
]

// ============================================================================
// STYLED SELECT
// ============================================================================

interface StyledSelectProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  disabled?: boolean
}

function StyledSelect({ value, onChange, options, disabled }: StyledSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 min-w-[200px] disabled:opacity-50"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}

// ============================================================================
// OPERATING HOURS EDITOR
// ============================================================================

interface OperatingHoursEditorProps {
  hours: OperatingHours[]
  onChange: (hours: OperatingHours[]) => void
  disabled?: boolean
}

function OperatingHoursEditor({ hours, onChange, disabled }: OperatingHoursEditorProps) {
  const handleToggle = (dayIndex: number) => {
    const updated = hours.map((h) =>
      h.dayOfWeek === dayIndex ? { ...h, isOpen: !h.isOpen } : h
    )
    onChange(updated)
  }

  const handleTimeChange = (dayIndex: number, field: 'openTime' | 'closeTime', value: string) => {
    const updated = hours.map((h) =>
      h.dayOfWeek === dayIndex ? { ...h, [field]: value } : h
    )
    onChange(updated)
  }

  return (
    <div className="space-y-2">
      {hours.map((day) => (
        <div
          key={day.dayOfWeek}
          className="flex items-center gap-4 p-3 rounded-lg bg-[rgb(var(--surface-tertiary))]"
        >
          <div className="w-24">
            <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
              {DAYS_OF_WEEK[day.dayOfWeek]}
            </span>
          </div>
          <button
            onClick={() => handleToggle(day.dayOfWeek)}
            disabled={disabled}
            className={`
              px-3 py-1 rounded-full text-xs font-medium transition-colors
              ${day.isOpen 
                ? 'bg-teal-500/10 text-teal-700 dark:text-teal-400' 
                : 'bg-[rgb(var(--surface-secondary))] text-[rgb(var(--text-tertiary))]'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {day.isOpen ? 'Open' : 'Closed'}
          </button>
          {day.isOpen && (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="time"
                value={day.openTime || '08:00'}
                onChange={(e) => handleTimeChange(day.dayOfWeek, 'openTime', e.target.value)}
                disabled={disabled}
                className="px-2 py-1 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm disabled:opacity-50"
              />
              <span className="text-[rgb(var(--text-tertiary))]">to</span>
              <input
                type="time"
                value={day.closeTime || '15:30'}
                onChange={(e) => handleTimeChange(day.dayOfWeek, 'closeTime', e.target.value)}
                disabled={disabled}
                className="px-2 py-1 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm disabled:opacity-50"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// GRADE LEVEL SELECTOR
// ============================================================================

interface GradeLevelSelectorProps {
  selected: string[]
  onChange: (levels: string[]) => void
  disabled?: boolean
}

function GradeLevelSelector({ selected, onChange, disabled }: GradeLevelSelectorProps) {
  const toggleLevel = (level: string) => {
    if (selected.includes(level)) {
      onChange(selected.filter((l) => l !== level))
    } else {
      onChange([...selected, level].sort((a, b) => {
        const order = GRADE_LEVEL_OPTIONS
        return order.indexOf(a) - order.indexOf(b)
      }))
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {GRADE_LEVEL_OPTIONS.map((level) => {
        const isSelected = selected.includes(level)
        return (
          <button
            key={level}
            onClick={() => toggleLevel(level)}
            disabled={disabled}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${isSelected 
                ? 'bg-teal-500 text-white' 
                : 'bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-secondary))]'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {level}
          </button>
        )
      })}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface SchoolConfigurationPageProps {
  schoolId: string
}

export default function SchoolConfigurationPage({ schoolId }: SchoolConfigurationPageProps) {
  useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Fetch configuration
  const {
    data: config,
  } = useQuery({
    queryKey: ['schoolConfiguration', schoolId],
    queryFn: () => tenantService.getSchoolConfiguration(schoolId),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<SchoolConfiguration>) =>
      tenantService.updateSchoolConfiguration(schoolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schoolConfiguration', schoolId] })
      setSaveSuccess(true)
      setSaveError(null)
      setTimeout(() => setSaveSuccess(false), 3000)
    },
    onError: (err: Error) => {
      setSaveError(err.message || 'Failed to save configuration')
      setSaveSuccess(false)
    },
  })

  // Handle changes
  const handleChange = <K extends keyof SchoolConfiguration>(
    section: K,
    key: string,
    value: unknown
  ) => {
    const sectionData = displayConfig[section]
    if (typeof sectionData === 'object' && sectionData !== null) {
      updateMutation.mutate({
        [section]: {
          ...sectionData,
          [key]: value,
        },
      } as Partial<SchoolConfiguration>)
    }
  }

  // Default configuration if API fails
  const defaultOperatingHours: OperatingHours[] = DAYS_OF_WEEK.map((_, idx) => ({
    dayOfWeek: idx as OperatingHours['dayOfWeek'],
    isOpen: idx >= 1 && idx <= 5, // Monday-Friday
    openTime: '08:00',
    closeTime: '15:30',
  }))

  const displayConfig: SchoolConfiguration = config || {
    schoolId,
    identity: {
      displayName: 'Lincoln High School',
      shortCode: 'LHS',
      schoolType: 'high',
      logoUrl: undefined,
      website: 'https://lincoln.edu',
    },
    location: {
      address: {
        street1: '123 Education Way',
        street2: undefined,
        city: 'Springfield',
        state: 'IL',
        postalCode: '62701',
        country: 'USA',
      },
      timezone: undefined,
      phone: '(555) 123-4567',
      email: 'info@lincoln.edu',
      fax: undefined,
    },
    operations: {
      operatingHours: defaultOperatingHours,
      gradeLevels: ['9', '10', '11', '12'],
      capacity: 1500,
    },
    academic: {
      gradingScale: 'letter',
      customGradingScale: undefined,
      reportCardFormat: 'standard',
      termStructure: 'semester',
    },
    attendance: {
      policy: 'period',
      tardyThresholdMinutes: 10,
      excusedAbsenceTypes: ['Medical', 'Family Emergency', 'Religious'],
      unexcusedAbsenceTypes: ['Truancy', 'Unverified'],
    },
    inheritsFromWorkspace: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerChildren}
      className="space-y-6"
    >
      {/* Alerts */}
      <AnimatePresence>
        {saveSuccess && (
          <SettingsAlert
            type="success"
            message="Configuration saved"
            onDismiss={() => setSaveSuccess(false)}
            autoDismiss
            autoDismissDelay={2000}
          />
        )}
        {saveError && (
          <SettingsAlert
            type="error"
            message={saveError}
            onDismiss={() => setSaveError(null)}
          />
        )}
      </AnimatePresence>

      {/* Identity */}
      <SettingsSection
        title="School Identity"
        icon={Building2}
        description="Basic school information"
      >
        <div className="space-y-4">
          <SettingsCard title="Display Name" description="Full name of the school">
            <input
              type="text"
              value={displayConfig.identity.displayName}
              onChange={(e) => handleChange('identity', 'displayName', e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50 w-full"
            />
          </SettingsCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SettingsCard title="School Code" description="Short identifier">
              <input
                type="text"
                value={displayConfig.identity.shortCode}
                onChange={(e) => handleChange('identity', 'shortCode', e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50 w-full"
              />
            </SettingsCard>

            <SettingsCard title="School Type" description="Level of education">
              <StyledSelect
                value={displayConfig.identity.schoolType}
                onChange={(v) => handleChange('identity', 'schoolType', v)}
                options={SCHOOL_TYPE_OPTIONS}
              />
            </SettingsCard>
          </div>

          <SettingsCard title="Website" description="School's public website">
            <input
              type="url"
              value={displayConfig.identity.website || ''}
              onChange={(e) => handleChange('identity', 'website', e.target.value)}
              placeholder="https://www.school.edu"
              className="px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50 w-full"
            />
          </SettingsCard>
        </div>
      </SettingsSection>

      {/* Location & Contact */}
      <SettingsSection
        title="Location & Contact"
        icon={MapPin}
        description="Physical address and contact information"
      >
        <div className="space-y-4">
          <SettingsCard title="Street Address" description="Primary address line">
            <input
              type="text"
              value={displayConfig.location.address.street1}
              onChange={(e) => handleChange('location', 'address', { ...displayConfig.location.address, street1: e.target.value })}
              className="px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50 w-full"
            />
          </SettingsCard>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SettingsCard title="City" description="">
              <input
                type="text"
                value={displayConfig.location.address.city}
                onChange={(e) => handleChange('location', 'address', { ...displayConfig.location.address, city: e.target.value })}
                className="px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50 w-full"
              />
            </SettingsCard>
            <SettingsCard title="State" description="">
              <input
                type="text"
                value={displayConfig.location.address.state}
                onChange={(e) => handleChange('location', 'address', { ...displayConfig.location.address, state: e.target.value })}
                className="px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50 w-full"
              />
            </SettingsCard>
            <SettingsCard title="ZIP Code" description="">
              <input
                type="text"
                value={displayConfig.location.address.postalCode}
                onChange={(e) => handleChange('location', 'address', { ...displayConfig.location.address, postalCode: e.target.value })}
                className="px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50 w-full"
              />
            </SettingsCard>
            <SettingsCard title="Country" description="">
              <input
                type="text"
                value={displayConfig.location.address.country}
                onChange={(e) => handleChange('location', 'address', { ...displayConfig.location.address, country: e.target.value })}
                className="px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50 w-full"
              />
            </SettingsCard>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SettingsCard title="Phone" description="Main contact number">
              <input
                type="tel"
                value={displayConfig.location.phone || ''}
                onChange={(e) => handleChange('location', 'phone', e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50 w-full"
              />
            </SettingsCard>
            <SettingsCard title="Email" description="Contact email">
              <input
                type="email"
                value={displayConfig.location.email || ''}
                onChange={(e) => handleChange('location', 'email', e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50 w-full"
              />
            </SettingsCard>
          </div>
        </div>
      </SettingsSection>

      {/* Operations */}
      <SettingsSection
        title="Operations"
        icon={Clock}
        description="Operating hours and capacity"
      >
        <div className="space-y-4">
          <SettingsCard title="Operating Hours" description="Weekly schedule">
            <OperatingHoursEditor
              hours={displayConfig.operations.operatingHours}
              onChange={(hours) => handleChange('operations', 'operatingHours', hours)}
            />
          </SettingsCard>

          <SettingsCard title="Grade Levels" description="Grades served by this school">
            <GradeLevelSelector
              selected={displayConfig.operations.gradeLevels}
              onChange={(levels) => handleChange('operations', 'gradeLevels', levels)}
            />
          </SettingsCard>

          <SettingsCard title="Student Capacity" description="Maximum enrollment">
            <input
              type="number"
              value={displayConfig.operations.capacity || ''}
              onChange={(e) => handleChange('operations', 'capacity', parseInt(e.target.value) || undefined)}
              className="px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50 w-40"
            />
          </SettingsCard>
        </div>
      </SettingsSection>

      {/* Academic */}
      <SettingsSection
        title="Academic Settings"
        icon={GraduationCap}
        description="Grading and term structure"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SettingsCard title="Grading Scale" description="How grades are calculated">
              <StyledSelect
                value={displayConfig.academic.gradingScale}
                onChange={(v) => handleChange('academic', 'gradingScale', v)}
                options={GRADING_SCALE_OPTIONS}
              />
            </SettingsCard>
            <SettingsCard title="Report Card Format" description="Style of progress reports">
              <StyledSelect
                value={displayConfig.academic.reportCardFormat}
                onChange={(v) => handleChange('academic', 'reportCardFormat', v)}
                options={REPORT_CARD_OPTIONS}
              />
            </SettingsCard>
          </div>

          <SettingsCard title="Term Structure" description="How the year is divided">
            <StyledSelect
              value={displayConfig.academic.termStructure}
              onChange={(v) => handleChange('academic', 'termStructure', v)}
              options={TERM_STRUCTURE_OPTIONS}
            />
          </SettingsCard>
        </div>
      </SettingsSection>

      {/* Attendance */}
      <SettingsSection
        title="Attendance Settings"
        icon={ClipboardCheck}
        description="Attendance tracking configuration"
      >
        <div className="space-y-4">
          <SettingsCard title="Attendance Policy" description="How attendance is tracked">
            <StyledSelect
              value={displayConfig.attendance.policy}
              onChange={(v) => handleChange('attendance', 'policy', v)}
              options={ATTENDANCE_POLICY_OPTIONS}
            />
          </SettingsCard>

          <SettingsCard title="Tardy Threshold" description="Minutes late to be marked tardy">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={displayConfig.attendance.tardyThresholdMinutes}
                onChange={(e) => handleChange('attendance', 'tardyThresholdMinutes', parseInt(e.target.value) || 0)}
                className="px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50 w-24"
              />
              <span className="text-sm text-[rgb(var(--text-tertiary))]">minutes</span>
            </div>
          </SettingsCard>
        </div>
      </SettingsSection>

      {/* Inheritance Notice */}
      {displayConfig.inheritsFromWorkspace && (
        <motion.div variants={fadeInUp}>
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <AlertTriangle className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-cyan-700 dark:text-cyan-400">
                <strong>Inheriting from Workspace:</strong> Some settings are inherited from your organization's workspace settings.
                Changes here will override the workspace defaults for this school only.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
