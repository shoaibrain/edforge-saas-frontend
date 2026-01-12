/**
 * Workspace Settings Page
 * 
 * Tenant-level configuration that applies organization-wide.
 * Schools can override these settings at the school level.
 * 
 * Sections:
 * - Regional (timezone, locale, date/time format)
 * - Calendar (academic year defaults)
 * - Branding (organization identity)
 * - Policies (grading, attendance defaults)
 */

import { useState } from 'react'
import { Navigate } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Globe,
  Calendar,
  Palette,
  Shield,
  Lock,
  AlertTriangle,
  Building2,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { can } from '@edforge/abac'
import { tenantService } from '@/services/tenant.service'
// Local type for WorkspaceSettings (until @edforge/types is rebuilt)
interface WorkspaceSettings {
  tenantId: string
  regional: {
    defaultTimezone: string
    defaultLocale: string
    defaultDateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
    defaultTimeFormat: '12h' | '24h'
    defaultWeekStartsOn: 'sunday' | 'monday'
  }
  calendar: {
    defaultAcademicYearStart: string
    defaultAcademicYearEnd: string
    defaultTermStructure: 'semester' | 'trimester' | 'quarter'
  }
  branding: {
    organizationName: string
    logoUrl?: string
    primaryColor?: string
    accentColor?: string
  }
  policies: {
    defaultGradingScale: 'letter' | 'percentage' | 'points' | 'custom'
    defaultAttendancePolicy: 'daily' | 'period' | 'both'
  }
  isLocked: boolean
  lockReason?: string
  createdAt: string
  updatedAt: string
}
import {
  SettingsPageHeader,
  SettingsSection,
  SettingsCard,
  SettingsAlert,
  SettingsSkeleton,
  staggerChildren,
  fadeInUp,
} from '@/components/settings/SettingsShared'

// ============================================================================
// CONSTANTS
// ============================================================================

const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: 'UTC-5' },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: 'UTC-6' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: 'UTC-7' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: 'UTC-8' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)', offset: 'UTC-9' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)', offset: 'UTC-10' },
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)', offset: 'UTC+0' },
  { value: 'Europe/London', label: 'London (GMT/BST)', offset: 'UTC+0/+1' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)', offset: 'UTC+1/+2' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: 'UTC+9' },
  { value: 'Asia/Kolkata', label: 'India (IST)', offset: 'UTC+5:30' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)', offset: 'UTC+10/+11' },
]

const LOCALE_OPTIONS = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'zh-CN', label: '简体中文' },
  { value: 'ja', label: '日本語' },
]

const DATE_FORMAT_OPTIONS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '01/15/2026' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '15/01/2026' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2026-01-15' },
]

const TIME_FORMAT_OPTIONS = [
  { value: '12h', label: '12-hour', example: '2:30 PM' },
  { value: '24h', label: '24-hour', example: '14:30' },
]

const WEEK_START_OPTIONS = [
  { value: 'sunday', label: 'Sunday' },
  { value: 'monday', label: 'Monday' },
]

const TERM_STRUCTURE_OPTIONS = [
  { value: 'semester', label: 'Semester (2 terms)' },
  { value: 'trimester', label: 'Trimester (3 terms)' },
  { value: 'quarter', label: 'Quarter (4 terms)' },
]

const GRADING_SCALE_OPTIONS = [
  { value: 'letter', label: 'Letter Grades (A-F)' },
  { value: 'percentage', label: 'Percentage (0-100%)' },
  { value: 'points', label: 'Points-based' },
  { value: 'custom', label: 'Custom Scale' },
]

const ATTENDANCE_POLICY_OPTIONS = [
  { value: 'daily', label: 'Daily Attendance' },
  { value: 'period', label: 'Period-by-Period' },
  { value: 'both', label: 'Both Daily & Period' },
]

// ============================================================================
// STYLED SELECT
// ============================================================================

interface StyledSelectProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string; [key: string]: string }[]
  showExtra?: string
  disabled?: boolean
}

function StyledSelect({ value, onChange, options, showExtra, disabled }: StyledSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`
        px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] 
        bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] 
        focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 
        min-w-[200px] transition-all
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}{showExtra && opt[showExtra] ? ` (${opt[showExtra]})` : ''}
        </option>
      ))}
    </select>
  )
}

// ============================================================================
// LOCK INDICATOR
// ============================================================================

function LockIndicator({ reason }: { reason?: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-golden-500/10 border border-golden-500/20">
      <Lock className="w-4 h-4 text-golden-600" />
      <span className="text-sm text-golden-700 dark:text-golden-400">
        {reason || 'Settings locked during active academic year'}
      </span>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function WorkspaceSettingsPage() {
  const user = useAuthStore((s) => s.user)
  const { activeSchoolId } = useAppStore.getState()
  const queryClient = useQueryClient()
  
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Check permissions
  if (!user) {
    return <Navigate to="/login" />
  }

  const hasPermission = can(user, {
    action: 'view',
    resource: 'settings:tenant',
    schoolId: activeSchoolId ?? undefined,
  })

  if (!hasPermission) {
    return <AccessDenied message="You don't have permission to view workspace settings." />
  }

  // Fetch workspace settings
  const {
    data: settings,
    isLoading,
  } = useQuery<WorkspaceSettings>({
    queryKey: ['workspaceSettings', user.tenantId],
    queryFn: () => tenantService.getWorkspaceSettings(user.tenantId),
    enabled: !!user.tenantId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<WorkspaceSettings>) =>
      tenantService.updateWorkspaceSettings(user.tenantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaceSettings', user.tenantId] })
      setSaveSuccess(true)
      setSaveError(null)
      setTimeout(() => setSaveSuccess(false), 3000)
    },
    onError: (err: Error) => {
      setSaveError(err.message || 'Failed to save settings')
      setSaveSuccess(false)
    },
  })

  // Handle setting change
  const handleChange = <K extends keyof WorkspaceSettings>(
    section: K,
    key: string,
    value: unknown
  ) => {
    if (settings?.isLocked) return
    
    const sectionData = settings?.[section]
    if (typeof sectionData === 'object' && sectionData !== null) {
      updateMutation.mutate({
        [section]: {
          ...sectionData,
          [key]: value,
        },
      } as Partial<WorkspaceSettings>)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <SettingsSkeleton rows={6} showHeader />
      </div>
    )
  }

  // Error state - show default UI with mock data
  const displaySettings: WorkspaceSettings = settings || {
    tenantId: user.tenantId,
    regional: {
      defaultTimezone: 'America/New_York',
      defaultLocale: 'en-US',
      defaultDateFormat: 'MM/DD/YYYY',
      defaultTimeFormat: '12h',
      defaultWeekStartsOn: 'monday',
    },
    calendar: {
      defaultAcademicYearStart: '08-15',
      defaultAcademicYearEnd: '06-15',
      defaultTermStructure: 'semester',
    },
    branding: {
      organizationName: 'Demo School District',
      logoUrl: undefined,
      primaryColor: '#0D9488',
      accentColor: '#F59E0B',
    },
    policies: {
      defaultGradingScale: 'letter',
      defaultAttendancePolicy: 'daily',
    },
    isLocked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
        className="space-y-8"
      >
        {/* Header */}
        <SettingsPageHeader
          title="Workspace Settings"
          description="Organization-wide configuration that applies to all schools"
          icon={Building2}
        />

        {/* Lock Warning */}
        {displaySettings.isLocked && (
          <motion.div variants={fadeInUp}>
            <LockIndicator reason={displaySettings.lockReason} />
          </motion.div>
        )}

        {/* Alerts */}
        <AnimatePresence>
          {saveSuccess && (
            <SettingsAlert
              type="success"
              message="Settings saved"
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

        {/* Regional Settings */}
        <SettingsSection
          title="Regional Settings"
          icon={Globe}
          description="Default timezone, language, and date/time formatting"
        >
          <div className="space-y-4">
            <SettingsCard
              title="Default Timezone"
              description="Organization's primary timezone for scheduling and timestamps"
            >
              <StyledSelect
                value={displaySettings.regional.defaultTimezone}
                onChange={(v) => handleChange('regional', 'defaultTimezone', v)}
                options={TIMEZONE_OPTIONS}
                showExtra="offset"
                disabled={displaySettings.isLocked}
              />
            </SettingsCard>

            <SettingsCard
              title="Default Language"
              description="Primary language for new users and system communications"
            >
              <StyledSelect
                value={displaySettings.regional.defaultLocale}
                onChange={(v) => handleChange('regional', 'defaultLocale', v)}
                options={LOCALE_OPTIONS}
                disabled={displaySettings.isLocked}
              />
            </SettingsCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SettingsCard title="Date Format" description="How dates are displayed">
                <StyledSelect
                  value={displaySettings.regional.defaultDateFormat}
                  onChange={(v) => handleChange('regional', 'defaultDateFormat', v)}
                  options={DATE_FORMAT_OPTIONS}
                  showExtra="example"
                  disabled={displaySettings.isLocked}
                />
              </SettingsCard>

              <SettingsCard title="Time Format" description="12 or 24 hour clock">
                <StyledSelect
                  value={displaySettings.regional.defaultTimeFormat}
                  onChange={(v) => handleChange('regional', 'defaultTimeFormat', v)}
                  options={TIME_FORMAT_OPTIONS}
                  showExtra="example"
                  disabled={displaySettings.isLocked}
                />
              </SettingsCard>
            </div>

            <SettingsCard
              title="Week Starts On"
              description="First day of the week in calendars"
            >
              <StyledSelect
                value={displaySettings.regional.defaultWeekStartsOn}
                onChange={(v) => handleChange('regional', 'defaultWeekStartsOn', v)}
                options={WEEK_START_OPTIONS}
                disabled={displaySettings.isLocked}
              />
            </SettingsCard>
          </div>
        </SettingsSection>

        {/* Calendar Settings */}
        <SettingsSection
          title="Academic Calendar"
          icon={Calendar}
          description="Default academic year structure and schedule"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SettingsCard
                title="Academic Year Start"
                description="Default start date (month-day)"
              >
                <input
                  type="text"
                  value={displaySettings.calendar.defaultAcademicYearStart}
                  onChange={(e) => handleChange('calendar', 'defaultAcademicYearStart', e.target.value)}
                  placeholder="MM-DD (e.g., 08-15)"
                  disabled={displaySettings.isLocked}
                  className="px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 w-full disabled:opacity-50"
                />
              </SettingsCard>

              <SettingsCard
                title="Academic Year End"
                description="Default end date (month-day)"
              >
                <input
                  type="text"
                  value={displaySettings.calendar.defaultAcademicYearEnd}
                  onChange={(e) => handleChange('calendar', 'defaultAcademicYearEnd', e.target.value)}
                  placeholder="MM-DD (e.g., 06-15)"
                  disabled={displaySettings.isLocked}
                  className="px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 w-full disabled:opacity-50"
                />
              </SettingsCard>
            </div>

            <SettingsCard
              title="Default Term Structure"
              description="How academic years are divided into grading periods"
            >
              <StyledSelect
                value={displaySettings.calendar.defaultTermStructure}
                onChange={(v) => handleChange('calendar', 'defaultTermStructure', v)}
                options={TERM_STRUCTURE_OPTIONS}
                disabled={displaySettings.isLocked}
              />
            </SettingsCard>
          </div>
        </SettingsSection>

        {/* Branding */}
        <SettingsSection
          title="Organization Branding"
          icon={Palette}
          description="Visual identity across the platform"
        >
          <div className="space-y-4">
            <SettingsCard
              title="Organization Name"
              description="Display name for your organization"
            >
              <input
                type="text"
                value={displaySettings.branding.organizationName}
                onChange={(e) => handleChange('branding', 'organizationName', e.target.value)}
                disabled={displaySettings.isLocked}
                className="px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 w-full disabled:opacity-50"
              />
            </SettingsCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SettingsCard title="Primary Color" description="Main brand color">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={displaySettings.branding.primaryColor || '#0D9488'}
                    onChange={(e) => handleChange('branding', 'primaryColor', e.target.value)}
                    disabled={displaySettings.isLocked}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-[rgb(var(--border-primary))]"
                  />
                  <input
                    type="text"
                    value={displaySettings.branding.primaryColor || '#0D9488'}
                    onChange={(e) => handleChange('branding', 'primaryColor', e.target.value)}
                    disabled={displaySettings.isLocked}
                    className="px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 flex-1 disabled:opacity-50"
                  />
                </div>
              </SettingsCard>

              <SettingsCard title="Accent Color" description="Secondary highlight color">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={displaySettings.branding.accentColor || '#F59E0B'}
                    onChange={(e) => handleChange('branding', 'accentColor', e.target.value)}
                    disabled={displaySettings.isLocked}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-[rgb(var(--border-primary))]"
                  />
                  <input
                    type="text"
                    value={displaySettings.branding.accentColor || '#F59E0B'}
                    onChange={(e) => handleChange('branding', 'accentColor', e.target.value)}
                    disabled={displaySettings.isLocked}
                    className="px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 flex-1 disabled:opacity-50"
                  />
                </div>
              </SettingsCard>
            </div>
          </div>
        </SettingsSection>

        {/* Policy Defaults */}
        <SettingsSection
          title="Policy Defaults"
          icon={Shield}
          description="Default grading and attendance policies for new schools"
        >
          <div className="space-y-4">
            <SettingsCard
              title="Default Grading Scale"
              description="Standard grading system for schools"
            >
              <StyledSelect
                value={displaySettings.policies.defaultGradingScale}
                onChange={(v) => handleChange('policies', 'defaultGradingScale', v)}
                options={GRADING_SCALE_OPTIONS}
                disabled={displaySettings.isLocked}
              />
            </SettingsCard>

            <SettingsCard
              title="Default Attendance Policy"
              description="How attendance is tracked by default"
            >
              <StyledSelect
                value={displaySettings.policies.defaultAttendancePolicy}
                onChange={(v) => handleChange('policies', 'defaultAttendancePolicy', v)}
                options={ATTENDANCE_POLICY_OPTIONS}
                disabled={displaySettings.isLocked}
              />
            </SettingsCard>
          </div>
        </SettingsSection>

        {/* Info Note */}
        <motion.div variants={fadeInUp}>
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))]">
            <AlertTriangle className="w-5 h-5 text-golden-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-[rgb(var(--text-secondary))]">
                <strong>Important:</strong> These settings define organization-wide defaults.
                Individual schools can override these settings in their School Configuration.
                Some settings become locked when an academic year is active.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

// ============================================================================
// ACCESS DENIED COMPONENT
// ============================================================================

function AccessDenied({ message }: { message: string }) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="p-4 rounded-full bg-rust-500/10 inline-flex mb-4">
          <Shield className="w-8 h-8 text-rust-500" />
        </div>
        <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-2">Access Denied</h2>
        <p className="text-[rgb(var(--text-tertiary))]">{message}</p>
      </motion.div>
    </div>
  )
}
