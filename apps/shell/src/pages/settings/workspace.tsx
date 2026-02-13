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

import { useState, useEffect, useRef } from 'react'
import { Navigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
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
  SettingsFieldRow,
  SettingsSkeleton,
  UnsavedChangesBar,
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

const INPUT_CLASS = 'w-full px-3.5 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed'

const SELECT_CLASS = 'min-w-[200px] px-3.5 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed'

// ============================================================================
// DEFAULT SETTINGS (fallback when API data unavailable)
// ============================================================================

const DEFAULT_SETTINGS: Omit<WorkspaceSettings, 'tenantId'> = {
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function WorkspaceSettingsPage() {
  // All hooks MUST be called before any conditional returns
  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const queryClient = useQueryClient()

  // Local form state + dirty tracking
  const [formState, setFormState] = useState<WorkspaceSettings | null>(null)
  const originalStateRef = useRef<WorkspaceSettings | null>(null)

  // Fetch workspace settings
  const {
    data: settings,
    isLoading,
  } = useQuery<WorkspaceSettings>({
    queryKey: ['workspaceSettings', user?.tenantId],
    queryFn: () => tenantService.getWorkspaceSettings(user!.tenantId),
    enabled: !!user?.tenantId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  // Update mutation — sends full settings object
  const updateMutation = useMutation({
    mutationFn: (data: Partial<WorkspaceSettings>) =>
      tenantService.updateWorkspaceSettings(user!.tenantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaceSettings', user?.tenantId] })
      originalStateRef.current = formState
      toast.success('Workspace settings saved')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to save settings')
    },
  })

  // Initialize form state from API data
  useEffect(() => {
    if (settings) {
      setFormState(settings)
      originalStateRef.current = settings
    }
  }, [settings])

  // Derive dirty state
  const isDirty = formState !== null
    && originalStateRef.current !== null
    && JSON.stringify(formState) !== JSON.stringify(originalStateRef.current)

  // Update a nested section field in local form state (no API call)
  const updateField = <S extends 'regional' | 'calendar' | 'branding' | 'policies'>(
    section: S,
    key: string,
    value: unknown
  ) => {
    if (formState?.isLocked) return
    setFormState((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value,
        },
      }
    })
  }

  // Save all pending changes
  const handleSave = () => {
    if (!formState) return
    updateMutation.mutate({
      regional: formState.regional,
      calendar: formState.calendar,
      branding: formState.branding,
      policies: formState.policies,
    })
  }

  // Reset to original server state
  const handleReset = () => {
    if (originalStateRef.current) {
      setFormState(originalStateRef.current)
    }
  }

  // Permission check (after all hooks)
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

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <SettingsSkeleton rows={6} showHeader />
      </div>
    )
  }

  // Use form state or fallback defaults
  const displaySettings: WorkspaceSettings = formState || {
    tenantId: user.tenantId,
    ...DEFAULT_SETTINGS,
  }
  const isLocked = displaySettings.isLocked

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 pb-24">
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
        {isLocked && (
          <motion.div variants={fadeInUp}>
            <LockIndicator reason={displaySettings.lockReason} />
          </motion.div>
        )}

        {/* Regional Settings */}
        <SettingsSection
          title="Regional Settings"
          icon={Globe}
          description="Default timezone, language, and date/time formatting"
        >
          <SettingsFieldRow label="Default Timezone" description="Organization's primary timezone for scheduling and timestamps" inline>
            <select
              value={displaySettings.regional.defaultTimezone}
              onChange={(e) => updateField('regional', 'defaultTimezone', e.target.value)}
              disabled={isLocked}
              className={SELECT_CLASS}
            >
              {TIMEZONE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.offset})
                </option>
              ))}
            </select>
          </SettingsFieldRow>

          <SettingsFieldRow label="Default Language" description="Primary language for new users and system communications" inline>
            <select
              value={displaySettings.regional.defaultLocale}
              onChange={(e) => updateField('regional', 'defaultLocale', e.target.value)}
              disabled={isLocked}
              className={SELECT_CLASS}
            >
              {LOCALE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </SettingsFieldRow>

          <SettingsFieldRow label="Date Format" description="How dates are displayed across the platform" inline>
            <select
              value={displaySettings.regional.defaultDateFormat}
              onChange={(e) => updateField('regional', 'defaultDateFormat', e.target.value)}
              disabled={isLocked}
              className={SELECT_CLASS}
            >
              {DATE_FORMAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.example})
                </option>
              ))}
            </select>
          </SettingsFieldRow>

          <SettingsFieldRow label="Time Format" description="12 or 24 hour clock" inline>
            <select
              value={displaySettings.regional.defaultTimeFormat}
              onChange={(e) => updateField('regional', 'defaultTimeFormat', e.target.value)}
              disabled={isLocked}
              className={SELECT_CLASS}
            >
              {TIME_FORMAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.example})
                </option>
              ))}
            </select>
          </SettingsFieldRow>

          <SettingsFieldRow label="Week Starts On" description="First day of the week in calendars" inline>
            <select
              value={displaySettings.regional.defaultWeekStartsOn}
              onChange={(e) => updateField('regional', 'defaultWeekStartsOn', e.target.value)}
              disabled={isLocked}
              className={SELECT_CLASS}
            >
              {WEEK_START_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </SettingsFieldRow>
        </SettingsSection>

        {/* Calendar Settings */}
        <SettingsSection
          title="Academic Calendar"
          icon={Calendar}
          description="Default academic year structure and schedule"
          collapsible
          defaultOpen={false}
        >
          <SettingsFieldRow label="Academic Year Start" description="Default start date (month-day)" inline>
            <input
              type="text"
              value={displaySettings.calendar.defaultAcademicYearStart}
              onChange={(e) => updateField('calendar', 'defaultAcademicYearStart', e.target.value)}
              placeholder="MM-DD (e.g., 08-15)"
              disabled={isLocked}
              className={INPUT_CLASS + ' max-w-[200px]'}
            />
          </SettingsFieldRow>

          <SettingsFieldRow label="Academic Year End" description="Default end date (month-day)" inline>
            <input
              type="text"
              value={displaySettings.calendar.defaultAcademicYearEnd}
              onChange={(e) => updateField('calendar', 'defaultAcademicYearEnd', e.target.value)}
              placeholder="MM-DD (e.g., 06-15)"
              disabled={isLocked}
              className={INPUT_CLASS + ' max-w-[200px]'}
            />
          </SettingsFieldRow>

          <SettingsFieldRow label="Default Term Structure" description="How academic years are divided into grading periods" inline>
            <select
              value={displaySettings.calendar.defaultTermStructure}
              onChange={(e) => updateField('calendar', 'defaultTermStructure', e.target.value)}
              disabled={isLocked}
              className={SELECT_CLASS}
            >
              {TERM_STRUCTURE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </SettingsFieldRow>
        </SettingsSection>

        {/* Branding */}
        <SettingsSection
          title="Organization Branding"
          icon={Palette}
          description="Visual identity across the platform"
          collapsible
          defaultOpen={false}
        >
          <SettingsFieldRow label="Organization Name" description="Display name for your organization">
            <input
              type="text"
              value={displaySettings.branding.organizationName}
              onChange={(e) => updateField('branding', 'organizationName', e.target.value)}
              disabled={isLocked}
              className={INPUT_CLASS}
            />
          </SettingsFieldRow>

          <SettingsFieldRow label="Primary Color" description="Main brand color" inline>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={displaySettings.branding.primaryColor || '#0D9488'}
                onChange={(e) => updateField('branding', 'primaryColor', e.target.value)}
                disabled={isLocked}
                className="w-10 h-10 rounded-lg cursor-pointer border border-[rgb(var(--border-primary))] disabled:opacity-50"
              />
              <input
                type="text"
                value={displaySettings.branding.primaryColor || '#0D9488'}
                onChange={(e) => updateField('branding', 'primaryColor', e.target.value)}
                disabled={isLocked}
                className={INPUT_CLASS + ' max-w-[140px]'}
              />
            </div>
          </SettingsFieldRow>

          <SettingsFieldRow label="Accent Color" description="Secondary highlight color" inline>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={displaySettings.branding.accentColor || '#F59E0B'}
                onChange={(e) => updateField('branding', 'accentColor', e.target.value)}
                disabled={isLocked}
                className="w-10 h-10 rounded-lg cursor-pointer border border-[rgb(var(--border-primary))] disabled:opacity-50"
              />
              <input
                type="text"
                value={displaySettings.branding.accentColor || '#F59E0B'}
                onChange={(e) => updateField('branding', 'accentColor', e.target.value)}
                disabled={isLocked}
                className={INPUT_CLASS + ' max-w-[140px]'}
              />
            </div>
          </SettingsFieldRow>
        </SettingsSection>

        {/* Policy Defaults */}
        <SettingsSection
          title="Policy Defaults"
          icon={Shield}
          description="Default grading and attendance policies for new schools"
          collapsible
          defaultOpen={false}
        >
          <SettingsFieldRow label="Default Grading Scale" description="Standard grading system for schools" inline>
            <select
              value={displaySettings.policies.defaultGradingScale}
              onChange={(e) => updateField('policies', 'defaultGradingScale', e.target.value)}
              disabled={isLocked}
              className={SELECT_CLASS}
            >
              {GRADING_SCALE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </SettingsFieldRow>

          <SettingsFieldRow label="Default Attendance Policy" description="How attendance is tracked by default" inline>
            <select
              value={displaySettings.policies.defaultAttendancePolicy}
              onChange={(e) => updateField('policies', 'defaultAttendancePolicy', e.target.value)}
              disabled={isLocked}
              className={SELECT_CLASS}
            >
              {ATTENDANCE_POLICY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </SettingsFieldRow>
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

      {/* Floating Save Bar */}
      <UnsavedChangesBar
        isDirty={isDirty}
        onReset={handleReset}
        onSave={handleSave}
        isSaving={updateMutation.isPending}
      />
    </div>
  )
}
