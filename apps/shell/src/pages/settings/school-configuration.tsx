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

import { useState, useMemo, useEffect } from 'react'
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
import type { SchoolConfiguration, School } from '@edforge/types'
import type { UpdateSchoolDto, UpdateSchoolConfigDto } from '@edforge/shared-types'
import {
  SettingsSection,
  SettingsCard,
  SettingsAlert,
  staggerChildren,
  fadeInUp,
} from '@/components/settings/SettingsShared'

// Local types removed - imported from @edforge/types

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

const GRADING_SCALE_OPTIONS = [
  { value: 'letter', label: 'Letter Grades (A-F)' },
  { value: 'percentage', label: 'Percentage (0-100%)' },
  { value: 'points', label: 'Points-based' },
  { value: 'custom', label: 'Custom Scale' },
]

const TERM_STRUCTURE_OPTIONS = [
  { value: 'semester', label: 'Semester (2 terms)' },
  { value: 'trimester', label: 'Trimester (3 terms)' },
  { value: 'quarter', label: 'Quarter (4 terms)' },
  { value: 'custom', label: 'Custom' },
]

const GRADE_LEVEL_OPTIONS = [
  'Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
]

// ============================================================================
// CHANGE DETECTION HELPERS
// ============================================================================

/**
 * Determines if school identity/entity fields have changed.
 * These fields are updated via PATCH /schools/{id} endpoint.
 */
function hasIdentityChanges(
  current: SchoolConfiguration | null,
  original: SchoolConfiguration | null
): boolean {
  if (!current || !original) return false
  return (
    current.identity.displayName !== original.identity.displayName ||
    current.identity.schoolType !== original.identity.schoolType ||
    current.identity.website !== original.identity.website ||
    current.location.phone !== original.location.phone ||
    current.location.email !== original.location.email ||
    JSON.stringify(current.location.address) !== JSON.stringify(original.location.address)
  )
}

/**
 * Determines if configuration/settings fields have changed.
 * These fields are updated via PATCH /schools/{id}/configuration endpoint.
 */
function hasConfigChanges(
  current: SchoolConfiguration | null,
  original: SchoolConfiguration | null
): boolean {
  if (!current || !original) return false
  return (
    JSON.stringify(current.academic) !== JSON.stringify(original.academic) ||
    JSON.stringify(current.attendance) !== JSON.stringify(original.attendance) ||
    JSON.stringify(current.operations) !== JSON.stringify(original.operations)
  )
}

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
  school?: School
}

export default function SchoolConfigurationPage({ schoolId, school }: SchoolConfigurationPageProps) {
  useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  // Fetch configuration
  const { data: config, isLoading } = useQuery({
    queryKey: ['schoolConfiguration', schoolId],
    queryFn: () => tenantService.getSchoolConfiguration(schoolId),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  })

  // Local form state
  const [formState, setFormState] = useState<SchoolConfiguration | null>(null)

  // Original state for change detection (to determine which API endpoints to call)
  const [originalState, setOriginalState] = useState<SchoolConfiguration | null>(null)

  // Track dirty state
  const [isDirty, setIsDirty] = useState(false)

  // Initialize form state when config loads
  const defaultConfig: SchoolConfiguration = useMemo(() => ({
    schoolId,
    identity: {
      displayName: school?.name || '',
      shortCode: school?.code || '',
      schoolType: school?.type || 'other',
      website: '',
    },
    location: {
      address: {
        street1: school?.address?.street1 || '',
        city: school?.address?.city || '',
        state: school?.address?.state || '',
        postalCode: school?.address?.postalCode || '',
        country: school?.address?.country || '',
      },
      phone: school?.phone || '',
      email: school?.email || '',
    },
    operations: {
      operatingHours: [],
      gradeLevels: [],
    },
    academic: {
      gradingScale: 'letter',
      termStructure: 'semester',
    },
    attendance: {
      attendanceRequired: true,
    },
    inheritsFromWorkspace: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }), [school, schoolId])

  useEffect(() => {
    if (config) {
      // Merge config with default structure to ensure all fields exist
      const mergedState: SchoolConfiguration = {
        ...defaultConfig,
        ...config,
        identity: { ...defaultConfig.identity, ...config.identity },
        location: {
          ...defaultConfig.location,
          ...config.location,
          address: { ...defaultConfig.location.address, ...config.location?.address }
        },
        operations: { ...defaultConfig.operations, ...config.operations },
        academic: { ...defaultConfig.academic, ...config.academic },
        attendance: { ...defaultConfig.attendance, ...config.attendance },
      }
      setFormState(mergedState)
      // Save original state for change detection
      setOriginalState(mergedState)
    } else if (!isLoading) {
      setFormState(defaultConfig)
      setOriginalState(defaultConfig)
    }
  }, [config, defaultConfig, isLoading])


  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Mutation for updating school ENTITY (identity fields)
  // Uses PATCH /schools/{id} endpoint per FRONTEND_INTEGRATION_GUIDE.md
  const updateSchoolMutation = useMutation({
    mutationFn: (data: UpdateSchoolDto) => tenantService.updateSchool(schoolId, data),
    onSuccess: (updatedSchool) => {
      // Update both school and schools list caches
      queryClient.setQueryData(['school', schoolId], updatedSchool)
      queryClient.invalidateQueries({ queryKey: ['schools'] })
    },
  })

  // Mutation for updating school CONFIGURATION (settings fields)
  // Uses PATCH /schools/{id}/configuration endpoint
  // Backend expects FLAT structure per FRONTEND_INTEGRATION_GUIDE.md
  const updateConfigMutation = useMutation({
    mutationFn: (data: UpdateSchoolConfigDto) => {
      return tenantService.updateSchoolConfiguration(schoolId, data as any)
    },
    onSuccess: (updatedConfig) => {
      queryClient.setQueryData(['schoolConfiguration', schoolId], updatedConfig)
    },
  })

  /**
   * Handles saving changes by calling the appropriate API endpoints:
   * - School entity updates (name, type, address, etc.) → PATCH /schools/{id}
   * - Configuration updates (grading, attendance, etc.) → PATCH /schools/{id}/configuration
   * 
   * Per FRONTEND_INTEGRATION_GUIDE.md, school code (schoolCode) cannot be changed after creation.
   */
  const handleSave = async () => {
    if (!formState) return

    // Determine which fields changed
    const identityChanged = hasIdentityChanges(formState, originalState)
    const configChanged = hasConfigChanges(formState, originalState)

    // If nothing changed, do nothing
    if (!identityChanged && !configChanged) {
      setIsDirty(false)
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      // 1. Update school entity (identity fields) if changed
      if (identityChanged) {
        const schoolUpdateData: UpdateSchoolDto = {
          name: formState.identity.displayName,
          schoolType: formState.identity.schoolType as UpdateSchoolDto['schoolType'],
          website: formState.identity.website || undefined,
          phone: formState.location.phone || undefined,
          email: formState.location.email || undefined,
          address: {
            street1: formState.location.address.street1,
            street2: formState.location.address.street2,
            city: formState.location.address.city,
            state: formState.location.address.state,
            // IMPORTANT: Map frontend postalCode → backend zipCode
            zipCode: formState.location.address.postalCode,
            country: formState.location.address.country,
          },
        }
        await updateSchoolMutation.mutateAsync(schoolUpdateData)
      }

      // 2. Update configuration (settings fields) if changed
      // Backend expects FLAT structure per FRONTEND_INTEGRATION_GUIDE.md
      if (configChanged) {
        const configUpdateData: UpdateSchoolConfigDto = {
          // Map nested academic settings to flat backend structure
          academicCalendarType: formState.academic.termStructure as 'semester' | 'quarter' | 'trimester',
          gradingScale: {
            type: formState.academic.gradingScale as 'letter' | 'percentage' | 'points' | 'custom',
            passingGrade: 60, // Default, should be configurable in future
            scale: [
              { letter: 'A', minScore: 90, maxScore: 100, gpa: 4.0 },
              { letter: 'B', minScore: 80, maxScore: 89, gpa: 3.0 },
              { letter: 'C', minScore: 70, maxScore: 79, gpa: 2.0 },
              { letter: 'D', minScore: 60, maxScore: 69, gpa: 1.0 },
              { letter: 'F', minScore: 0, maxScore: 59, gpa: 0.0 },
            ],
          },
          // Map nested attendance settings to flat backend structure
          attendanceRequired: formState.attendance.attendanceRequired,
        }
        await updateConfigMutation.mutateAsync(configUpdateData)
      }

      // Update original state to match current state after successful save
      setOriginalState(formState)
      setSaveSuccess(true)
      setIsDirty(false)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save changes')
      setSaveSuccess(false)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle changes
  const handleChange = <K extends keyof SchoolConfiguration>(
    section: K,
    key: string,
    value: unknown
  ) => {
    if (!formState) return

    setFormState((prev) => {
      if (!prev) return prev
      const sectionData = prev[section]
      if (typeof sectionData === 'object' && sectionData !== null) {
        return {
          ...prev,
          [section]: {
            ...sectionData,
            [key]: value
          }
        }
      }
      return prev
    })
    setIsDirty(true)
  }

  // Use formState for rendering, fall back to defaultConfig if null (loading)
  const displayConfig = formState || defaultConfig

  if (isLoading && !formState) {
    return <div className="p-8 text-center text-gray-400">Loading configuration...</div>
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerChildren}
      className="space-y-6 pb-20"
    >
      {/* Alerts */}
      <AnimatePresence>
        {saveSuccess && (
          <SettingsAlert
            type="success"
            message="Configuration saved successfully"
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

      {/* Floating Save Bar */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700"
          >
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
              You have unsaved changes
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  // Reset to original (server) state
                  if (originalState) {
                    setFormState(originalState)
                  }
                  setIsDirty(false)
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
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
            <SettingsCard title="School Code" description="Short identifier (cannot be changed)">
              <input
                type="text"
                value={displayConfig.identity.shortCode}
                disabled
                className="px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-tertiary))] text-sm text-[rgb(var(--text-secondary))] cursor-not-allowed w-full"
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
          <SettingsCard title="Grade Levels" description="Grades served by this school">
            <GradeLevelSelector
              selected={displayConfig.operations.gradeLevels}
              onChange={(levels) => handleChange('operations', 'gradeLevels', levels)}
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
          <SettingsCard title="Grading Scale" description="How grades are calculated">
            <StyledSelect
              value={displayConfig.academic.gradingScale || 'letter'}
              onChange={(v) => handleChange('academic', 'gradingScale', v)}
              options={GRADING_SCALE_OPTIONS}
            />
          </SettingsCard>

          <SettingsCard title="Term Structure" description="How the year is divided">
            <StyledSelect
              value={displayConfig.academic.termStructure || 'semester'}
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
          <SettingsCard title="Attendance Required" description="Is attendance mandatory?">
            <button
              onClick={() => handleChange('attendance', 'attendanceRequired', !displayConfig.attendance.attendanceRequired)}
              className={`
                    w-12 h-6 rounded-full transition-colors relative cursor-pointer
                    ${displayConfig.attendance.attendanceRequired ? 'bg-teal-500' : 'bg-gray-200'}
                    `}
            >
              <span
                className={`
                        absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform
                        ${displayConfig.attendance.attendanceRequired ? 'translate-x-6' : 'translate-x-0'}
                    `}
              />
            </button>
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
