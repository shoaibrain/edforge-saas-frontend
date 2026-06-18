/**
 * Workspace Settings Page
 *
 * Tenant-level configuration that applies organization-wide.
 * Schools can override these settings at the school level.
 *
 * Sections:
 * - Regional (timezone, locale, date/time format)
 * - Branding (organization identity)
 * - Policies (attendance defaults)
 */

import { useState, useEffect, useRef } from 'react'
import { Navigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Globe,
  Shield,
  ShieldCheck,
  Lock,
  Info,
  AlertTriangle,
  Building2,
  RefreshCw,
  ClipboardCheck,
} from 'lucide-react'
import { Button, FieldLockTooltip, FieldLockIcon, InlineAlert, Select, Switch } from '@edforge/ui'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { can } from '@edforge/abac'
import { tenantService } from '@/services/tenant.service'
import { useTenant } from '@/lib/shell-context'
import { constrainOptionsByArchetype } from './archetype-options'
import { GovernanceProfileCard } from '@/components/settings/GovernanceProfileCard'
import { useFieldLockState } from '@/hooks/useFieldLockState'
import { isWorkspaceFieldLocked } from '@edforge/types'
import type { FieldLockViolation, WorkspaceLockHolder } from '@edforge/types'

// Local type matching backend WorkspaceSettingsResponseDto
interface WorkspaceSettings {
  tenantId: string
  regional: {
    defaultTimezone: string
    defaultLocale: string
    defaultDateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
    defaultTimeFormat: '12h' | '24h'
    defaultWeekStartsOn: 'sunday' | 'monday'
    defaultCurrency: string
    defaultCalendarSystem: 'gregorian' | 'bikram_sambat'
    enableDualDateDisplay: boolean
    defaultNumberFormat: 'south_asian' | 'international'
  }
  branding: {
    organizationName: string
    logoUrl?: string
    primaryColor?: string
    accentColor?: string
  }
  policies: {
    defaultAttendancePolicy: 'daily' | 'period' | 'both'
  }
  isLocked: boolean
  lockReason?: string
  /** Sprint B.8 — populated by backend when isLocked=true. */
  lockHolders?: WorkspaceLockHolder[]
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
  { value: 'Asia/Kathmandu', label: 'Nepal (NST)', offset: 'UTC+5:45' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)', offset: 'UTC+10/+11' },
]

const LOCALE_OPTIONS = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'ne-NP', label: 'Nepali (नेपाली)' },
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

const CURRENCY_OPTIONS = [
  { value: 'NPR', label: 'Nepali Rupee (NPR)' },
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'GBP', label: 'British Pound (GBP)' },
  { value: 'INR', label: 'Indian Rupee (INR)' },
]

const CALENDAR_SYSTEM_OPTIONS = [
  { value: 'gregorian', label: 'Gregorian' },
  { value: 'bikram_sambat', label: 'Bikram Sambat' },
]

const NUMBER_FORMAT_OPTIONS = [
  { value: 'international', label: 'International (100,000)' },
  { value: 'south_asian', label: 'South Asian (1,00,000)' },
]

const ATTENDANCE_POLICY_OPTIONS = [
  { value: 'daily', label: 'Daily roll-call' },
  { value: 'period', label: 'By subject section' },
  { value: 'both', label: 'Both' },
]

type WorkspaceSelectOption = {
  value: string
  label: string
  offset?: string
  example?: string
}

function WorkspaceSelect({
  value,
  onChange,
  disabled,
  options,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  options: WorkspaceSelectOption[]
}) {
  return (
    <Select
      value={value}
      onChange={(nextValue) => nextValue && onChange(nextValue)}
      disabled={disabled}
      buttonClassName="min-w-52"
      options={options.map((option) => ({
        value: option.value,
        label: option.offset
          ? `${option.label} (${option.offset})`
          : option.example
            ? `${option.label} (${option.example})`
            : option.label,
      }))}
    />
  )
}

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
    defaultCurrency: 'USD',
    defaultCalendarSystem: 'gregorian',
    enableDualDateDisplay: false,
    defaultNumberFormat: 'international',
  },
  branding: {
    organizationName: 'My Organization',
    logoUrl: undefined,
    primaryColor: '#0D9488',
    accentColor: '#F59E0B',
  },
  policies: {
    defaultAttendancePolicy: 'daily',
  },
  isLocked: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// ============================================================================
// TENANT INFO CARD — read-only identity fields (archetype, country, tier, created)
// ============================================================================

interface TenantInfoCardProps {
  tenantName: string | null
  archetype: string | null
  country: string | null
  tier: string | null
  createdAt: string | null
}

function TenantInfoField({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[rgb(var(--border-tertiary))] last:border-b-0">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wide">
          {label}
        </span>
        <FieldLockTooltip />
      </div>
      <span className="text-sm font-semibold text-[rgb(var(--text-primary))]">
        {value}
      </span>
    </div>
  )
}

function TenantInfoCard({
  tenantName,
  archetype,
  country,
  tier,
  createdAt,
}: TenantInfoCardProps) {
  const createdAtDisplay = createdAt
    ? new Date(createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null

  return (
    <motion.div variants={fadeInUp}>
      <div
        data-testid="tenant-info-card"
        className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] p-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-[rgb(var(--background-tertiary))]">
            <Building2 className="w-4 h-4 text-[rgb(var(--action-secondary-fg))] " />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
              Tenant Info
            </h2>
            <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
              Read-only. These fields are set at provisioning and cannot be changed.
            </p>
          </div>
        </div>
        <div className="space-y-0">
          {tenantName && <TenantInfoField label="Name" value={tenantName} />}
          {archetype && <TenantInfoField label="Archetype" value={archetype} />}
          {country && <TenantInfoField label="Country" value={country} />}
          {tier && <TenantInfoField label="Tier" value={tier} />}
          {createdAtDisplay && (
            <TenantInfoField label="Created" value={createdAtDisplay} />
          )}
        </div>
      </div>
    </motion.div>
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

/**
 * Compose a tooltip detail string from the lockHolders list. Used by each
 * locked field's tooltip so the admin learns which school+year to close.
 */
function formatLockHoldersDetail(heldBy: WorkspaceLockHolder[]): string | undefined {
  if (!heldBy.length) return undefined
  if (heldBy.length === 1) {
    return `${heldBy[0].schoolName} · ${heldBy[0].yearName}`
  }
  return `${heldBy.length} active academic years across schools`
}

export default function WorkspaceSettingsPage() {
  // All hooks MUST be called before any conditional returns
  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const queryClient = useQueryClient()
  const { tenantName, archetype, country, tenantTier, createdAt } = useTenant()

  // Per-field lock states. Call order must stay stable across renders.
  const lkTimezone = useFieldLockState('regional.defaultTimezone')
  const lkLocale = useFieldLockState('regional.defaultLocale')
  const lkDateFormat = useFieldLockState('regional.defaultDateFormat')
  const lkTimeFormat = useFieldLockState('regional.defaultTimeFormat')
  const lkWeekStartsOn = useFieldLockState('regional.defaultWeekStartsOn')
  const lkCurrency = useFieldLockState('regional.defaultCurrency')
  const lkCalendarSystem = useFieldLockState('regional.defaultCalendarSystem')
  const lkDualDate = useFieldLockState('regional.enableDualDateDisplay')
  const lkNumberFormat = useFieldLockState('regional.defaultNumberFormat')

  // Local form state + dirty tracking
  const [formState, setFormState] = useState<WorkspaceSettings | null>(null)
  const originalStateRef = useRef<WorkspaceSettings | null>(null)

  // Fetch workspace settings
  const {
    data: settings,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<WorkspaceSettings>({
    queryKey: ['workspaceSettings', user?.tenantId],
    queryFn: () => tenantService.getWorkspaceSettings(user!.tenantId),
    enabled: !!user?.tenantId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  // Update mutation — sends partial settings object. Lock violations come
  // back as structured 400s that we route to per-field toasts so the admin
  // can see exactly which input needs their attention.
  const updateMutation = useMutation({
    mutationFn: (data: Partial<WorkspaceSettings>) =>
      tenantService.updateWorkspaceSettings(user!.tenantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaceSettings', user?.tenantId] })
      originalStateRef.current = formState
      toast.success('Workspace settings saved')
    },
    onError: (err: Error & { response?: { data?: unknown } }) => {
      // Backend (Sprint B.5) returns 403
      //   { message: "Field lock violation",
      //     details: { violations: [{field, reason, class, heldBy?}] } }
      // wrapped by axios as err.response.data. `details` is the envelope
      // the global exception filter whitelists; top-level extra keys get
      // stripped, so `violations` lives inside `details`.
      const payload = err.response?.data as
        | { message?: string; details?: { violations?: FieldLockViolation[] } }
        | undefined
      const violations = payload?.details?.violations
      if (violations?.length) {
        for (const v of violations) {
          const fieldLabel = v.field.replace(/^[a-z]+\./, '').replace(/([A-Z])/g, ' $1').trim()
          const holder = v.heldBy?.[0]
          const detail = holder ? ` (${holder.schoolName} · ${holder.yearName})` : ''
          toast.error(`${fieldLabel}: ${v.reason}${detail}`)
        }
        return
      }
      toast.error(payload?.message || err.message || 'Failed to save settings')
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

  /**
   * Per-field local-state update. Guards per-field with the shared governance
   * map so a locked input can't silently accept edits even if the `disabled`
   * attribute were bypassed (defensive). Unknown paths always pass through —
   * the server is the authoritative gate.
   */
  const updateField = <S extends 'regional' | 'branding' | 'policies'>(
    section: S,
    key: string,
    value: unknown
  ) => {
    const path = `${section}.${key}`
    const lock = isWorkspaceFieldLocked(path, formState?.isLocked ?? false)
    if (lock.locked) return
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

  /**
   * Save only the fields that actually changed since last load/save.
   *
   * Sprint B fix — the prior implementation round-tripped the full
   * regional/branding/policies objects on every save, which tripped the
   * backend's per-field lock check on every PATCH against a locked tenant
   * (even when the user edited a display-only field). Sending a sparse
   * diff keeps governance enforcement correct: the classifier only sees
   * fields the user intended to change.
   *
   * Backend defense-in-depth (`computeEffectiveDiff` on the service) also
   * guards against misbehaving clients — this is the client-side half.
   */
  const handleSave = () => {
    if (!formState || !originalStateRef.current) return
    const orig = originalStateRef.current

    const diffSection = <K extends 'regional' | 'branding' | 'policies'>(
      section: K,
    ): Record<string, unknown> | undefined => {
      const d: Record<string, unknown> = {}
      const proposed = formState[section] as Record<string, unknown>
      const baseline = orig[section] as Record<string, unknown>
      for (const [key, val] of Object.entries(proposed)) {
        if (val !== baseline[key]) d[key] = val
      }
      return Object.keys(d).length ? d : undefined
    }

    const payload: Partial<WorkspaceSettings> = {}
    const r = diffSection('regional')
    if (r) payload.regional = r as WorkspaceSettings['regional']
    const b = diffSection('branding')
    if (b) payload.branding = b as WorkspaceSettings['branding']
    const p = diffSection('policies')
    if (p) payload.policies = p as WorkspaceSettings['policies']

    if (Object.keys(payload).length === 0) return
    updateMutation.mutate(payload)
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

  // Error state
  if (isError && !formState) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <SettingsPageHeader
          title="Workspace Settings"
          description="Organization-wide configuration that applies to all schools"
          icon={Building2}
        />
        <div className="mt-8 flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 rounded-full bg-[rgb(var(--state-danger-bg)/0.18)] flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-[rgb(var(--state-danger-fg))]" />
          </div>
          <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-2">
            Failed to Load Settings
          </h2>
          <p className="text-sm text-[rgb(var(--text-tertiary))] text-center mb-6 max-w-sm">
            {error instanceof Error ? error.message : 'Unable to load workspace settings. Please try again.'}
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  // Use form state or fallback defaults
  const displaySettings: WorkspaceSettings = formState || {
    tenantId: user.tenantId,
    ...DEFAULT_SETTINGS,
  }
  const isLocked = displaySettings.isLocked
  const lockHolders: WorkspaceLockHolder[] = displaySettings.lockHolders ?? []

  /**
   * Render a field label with an inline FieldLockIcon when that specific
   * field is locked. Keeps the labels calm when the workspace is editable
   * and becomes loud only for the rows that are frozen.
   */
  const renderLabel = (
    text: string,
    lock: { locked: boolean; reason?: string; heldBy: WorkspaceLockHolder[] },
  ) => {
    if (!lock.locked) return text
    return (
      <span className="inline-flex items-center gap-2">
        {text}
        <FieldLockIcon
          reason={lock.reason ?? 'Locked'}
          detail={formatLockHoldersDetail(lock.heldBy)}
        />
      </span>
    )
  }

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

        {/* Tenant Info Card — read-only identity fields (immutable at provisioning) */}
        <TenantInfoCard
          tenantName={tenantName}
          archetype={archetype}
          country={country}
          tier={tenantTier}
          createdAt={createdAt}
        />

        {/* Governance Profile (GF3.4) — read-only resolved archetype + the
            regional defaults the governance body locks. Sits directly above
            Regional Settings so the constrained dropdowns below (GF3.2) have a
            visible "why". */}
        <GovernanceProfileCard archetype={archetype} country={country} />

        {/* Note: lock status is now surfaced inside Regional Settings (section-scoped),
            because Regional is the only subtree that actually locks — Tenant Info is
            permanently locked, and Branding/Policies are always editable. */}

        {/* Regional Settings */}
        <SettingsSection
          title="Regional Settings"
          icon={Globe}
          description="Default timezone, language, and date/time formatting"
        >
          {/* Forewarning banner.
              - Unlocked: muted heads-up that these fields WILL lock.
              - Locked: amber notice with specific lockHolders so a multi-school
                admin learns exactly which school+year to close to unlock.
              Display-only fields (locale, date/time/number format,
              enableDualDateDisplay) remain editable in either state. */}
          <InlineAlert
            variant={isLocked ? 'warning' : 'info'}
            icon={<Lock className="w-3.5 h-3.5" />}
            className="mb-2 text-xs"
          >
            {isLocked ? (
              <>
                <p>
                  <strong className="font-semibold">Locked.</strong>{' '}
                  {displaySettings.lockReason ||
                    'Regional settings that affect stored data are frozen while an academic year is active.'}{' '}
                  Display-only fields (language, date/time format, number grouping) remain editable.
                </p>
                {lockHolders.length > 0 && (
                  <ul className="mt-2 space-y-0.5 text-xs opacity-90">
                    {lockHolders.map((h) => (
                      <li key={`${h.schoolId}#${h.yearId}`}>
                        Blocked by <strong className="font-semibold">{h.schoolName}</strong>
                        {' · '}
                        <span>{h.yearName}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <p>
                <strong className="font-semibold">Heads up —</strong> fields that
                affect stored data (currency, calendar system, timezone, week start)
                become read-only when an academic year is active, to preserve
                consistency across reports, invoices, and audit trails. Display-only
                fields remain editable throughout.
              </p>
            )}
          </InlineAlert>

          <SettingsFieldRow label={renderLabel('Default Timezone', lkTimezone)} description="Organization's primary timezone for scheduling and timestamps" inline>
            <WorkspaceSelect
              value={displaySettings.regional.defaultTimezone}
              onChange={(value) => updateField('regional', 'defaultTimezone', value)}
              disabled={lkTimezone.locked}
              options={constrainOptionsByArchetype(TIMEZONE_OPTIONS, 'timezone', { archetype, country, current: displaySettings.regional.defaultTimezone })}
            />
          </SettingsFieldRow>

          <SettingsFieldRow label={renderLabel('Default Language', lkLocale)} description="Primary language for new users and system communications" inline>
            <WorkspaceSelect
              value={displaySettings.regional.defaultLocale}
              onChange={(value) => updateField('regional', 'defaultLocale', value)}
              disabled={lkLocale.locked}
              options={LOCALE_OPTIONS}
            />
          </SettingsFieldRow>

          <SettingsFieldRow label={renderLabel('Date Format', lkDateFormat)} description="How dates are displayed across the platform" inline>
            <WorkspaceSelect
              value={displaySettings.regional.defaultDateFormat}
              onChange={(value) => updateField('regional', 'defaultDateFormat', value)}
              disabled={lkDateFormat.locked}
              options={DATE_FORMAT_OPTIONS}
            />
          </SettingsFieldRow>

          <SettingsFieldRow label={renderLabel('Time Format', lkTimeFormat)} description="12 or 24 hour clock" inline>
            <WorkspaceSelect
              value={displaySettings.regional.defaultTimeFormat}
              onChange={(value) => updateField('regional', 'defaultTimeFormat', value)}
              disabled={lkTimeFormat.locked}
              options={TIME_FORMAT_OPTIONS}
            />
          </SettingsFieldRow>

          <SettingsFieldRow label={renderLabel('Week Starts On', lkWeekStartsOn)} description="First day of the week in calendars" inline>
            <WorkspaceSelect
              value={displaySettings.regional.defaultWeekStartsOn}
              onChange={(value) => updateField('regional', 'defaultWeekStartsOn', value)}
              disabled={lkWeekStartsOn.locked}
              options={WEEK_START_OPTIONS}
            />
          </SettingsFieldRow>

          <SettingsFieldRow label={renderLabel('Default Currency', lkCurrency)} description="Currency used for invoices, payments, and financial reports" inline>
            <WorkspaceSelect
              value={displaySettings.regional.defaultCurrency}
              onChange={(value) => updateField('regional', 'defaultCurrency', value)}
              disabled={lkCurrency.locked}
              options={constrainOptionsByArchetype(CURRENCY_OPTIONS, 'currency', { archetype, country, current: displaySettings.regional.defaultCurrency })}
            />
          </SettingsFieldRow>

          <SettingsFieldRow label={renderLabel('Calendar System', lkCalendarSystem)} description="Primary calendar system for date display" inline>
            <WorkspaceSelect
              value={displaySettings.regional.defaultCalendarSystem}
              onChange={(value) => updateField('regional', 'defaultCalendarSystem', value)}
              disabled={lkCalendarSystem.locked}
              options={constrainOptionsByArchetype(CALENDAR_SYSTEM_OPTIONS, 'calendarSystem', { archetype, country, current: displaySettings.regional.defaultCalendarSystem })}
            />
          </SettingsFieldRow>

          {displaySettings.regional.defaultCalendarSystem === 'bikram_sambat' && (
            <SettingsFieldRow label={renderLabel('Show Bikram Sambat Dates', lkDualDate)} description="Display BS dates alongside Gregorian dates in finance and academic modules" inline>
              <Switch
                checked={displaySettings.regional.enableDualDateDisplay}
                onChange={(checked) => updateField('regional', 'enableDualDateDisplay', checked)}
                disabled={lkDualDate.locked}
              />
            </SettingsFieldRow>
          )}

          <SettingsFieldRow label={renderLabel('Number Format', lkNumberFormat)} description="How numbers are grouped in financial displays" inline>
            <WorkspaceSelect
              value={displaySettings.regional.defaultNumberFormat}
              onChange={(value) => updateField('regional', 'defaultNumberFormat', value)}
              disabled={lkNumberFormat.locked}
              options={NUMBER_FORMAT_OPTIONS}
            />
          </SettingsFieldRow>
        </SettingsSection>

        {/* COMING SOON — Organization Branding section (re-enable when branding customization ships) */}

        {/* Attendance Defaults */}
        <SettingsSection
          title="Attendance Defaults"
          icon={ClipboardCheck}
          description="Default attendance mode applied to schools that don't set their own"
        >
          <SettingsFieldRow
            label="Attendance Mode"
            description="Schools inherit this unless they override it in their School Configuration"
            inline
          >
            <WorkspaceSelect
              value={displaySettings.policies.defaultAttendancePolicy}
              onChange={(value) => updateField('policies', 'defaultAttendancePolicy', value)}
              options={ATTENDANCE_POLICY_OPTIONS}
            />
          </SettingsFieldRow>
        </SettingsSection>

        {/* Lock taxonomy + permissions hint — replaces the older single "Important" note */}
        <motion.div variants={fadeInUp} className="space-y-3">
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-primary))]">
            <Info className="w-4 h-4 text-[rgb(var(--text-tertiary))] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))] mb-1.5">
                How locking works
              </p>
              <ul className="space-y-1 text-sm text-[rgb(var(--text-secondary))]">
                <li>
                  <strong className="font-medium text-[rgb(var(--text-primary))]">
                    Tenant Info
                  </strong>{' '}
                  fields above are permanently locked — set once at provisioning.
                </li>
                <li>
                  <strong className="font-medium text-[rgb(var(--text-primary))]">
                    Regional Settings — data-integrity fields
                  </strong>{' '}
                  (currency, calendar system, timezone, week start) lock automatically when any academic year is active.
                </li>
                <li>
                  <strong className="font-medium text-[rgb(var(--text-primary))]">
                    Regional Settings — display-only fields
                  </strong>{' '}
                  (language, date/time format, number format, Bikram Sambat toggle) stay editable throughout — changing them re-renders without touching stored data.
                </li>
                <li>
                  <strong className="font-medium text-[rgb(var(--text-primary))]">
                    Attendance Defaults
                  </strong>{' '}
                  (and Branding, coming soon) remain editable at any time, independent of academic-year state.
                </li>
              </ul>
              <p className="text-xs text-[rgb(var(--text-tertiary))] mt-2">
                Schools can override these defaults in their individual School Configuration.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-primary))]">
            <ShieldCheck className="w-4 h-4 text-[rgb(var(--text-tertiary))] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))] mb-1.5">
                Permissions
              </p>
              <p className="text-sm text-[rgb(var(--text-secondary))]">
                Only users with the <strong className="font-medium text-[rgb(var(--text-primary))]">Tenant Admin</strong> role can modify these
                settings. Every change is audit-logged with your user ID and a timestamp.
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
