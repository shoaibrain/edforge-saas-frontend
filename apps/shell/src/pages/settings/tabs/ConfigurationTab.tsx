/**
 * Configuration Tab — V2
 *
 * 3 section-card sections:
 * 1. School Identity
 * 2. Location & Contact
 * 3. Schedule & Operations
 *
 * Per-section save buttons (no global floating save).
 * Removed: Enabled Features, Notifications, Attendance Settings, Academic Settings.
 */

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tenantService } from '@/services/tenant.service'
import type { School } from '@edforge/types'
import type { UpdateSchoolDto, UpdateSchoolConfigDto } from '@aibrains/shared-types'
import { useLocaleDefaults } from '@/hooks/useLocaleDefaults'
import { type DayOfWeek, dayToIndex } from '@/utils/localeDefaults'
import { useOrganizationHierarchy } from '@/hooks/useEducationOrgs'
import { useCalendarStats, useGenerateCalendar, useLocaleHolidays } from '@/hooks/useCalendar'

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

const DAY_LABELS: { key: DayOfWeek; short: string }[] = [
  { key: 'sunday', short: 'S' },
  { key: 'monday', short: 'M' },
  { key: 'tuesday', short: 'T' },
  { key: 'wednesday', short: 'W' },
  { key: 'thursday', short: 'T' },
  { key: 'friday', short: 'F' },
  { key: 'saturday', short: 'S' },
]

// ============================================================================
// SECTION CARD
// ============================================================================

interface SectionCardProps {
  icon: string
  iconBg?: string
  title: string
  subtitle: string
  children: React.ReactNode
  footer?: React.ReactNode
}

function SectionCard({ icon, iconBg = 'bg-[rgba(55,138,221,0.1)]', title, subtitle, children, footer }: SectionCardProps) {
  return (
    <div className="bg-[rgb(var(--background-primary))] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.05)] flex items-center gap-2.5">
        <div className={`w-6 h-6 rounded-lg ${iconBg} flex items-center justify-center text-sm`}>
          {icon}
        </div>
        <div>
          <h3 className="text-xs font-semibold text-[rgb(var(--text-primary))]">{title}</h3>
          <p className="text-xs text-[rgb(var(--text-tertiary))] mt-px">{subtitle}</p>
        </div>
      </div>
      {children}
      {footer && (
        <div className="px-4 py-2.5 border-t border-[rgba(255,255,255,0.05)] flex justify-end gap-2">
          {footer}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// FORM INPUT STYLES
// ============================================================================

const inputClass = "w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-xs text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:border-[rgba(55,138,221,0.45)] transition-colors font-[inherit]"
const selectClass = inputClass
const labelClass = "text-xs font-medium text-[rgb(var(--text-tertiary))] flex items-center gap-1"

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface ConfigurationTabProps {
  schoolId: string
  school?: School
}

export default function ConfigurationTab({ schoolId, school }: ConfigurationTabProps) {
  const queryClient = useQueryClient()
  const localeDefaults = useLocaleDefaults()

  // Ed-Fi hierarchy — resolve parent LEA name
  const { data: hierarchy } = useOrganizationHierarchy()
  const parentLea = useMemo(() => {
    const leaId = (school as any)?.localEducationAgencyId
    if (!leaId || !hierarchy?.sea?.children) return null
    // LEA nodes are direct children of SEA
    return hierarchy.sea.children.find((node: any) => node.id === leaId) || null
  }, [school, hierarchy])

  // Fetch configuration from API
  const { data: apiConfig, isLoading } = useQuery({
    queryKey: ['schoolConfiguration', schoolId],
    queryFn: () => tenantService.getSchoolConfiguration(schoolId),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  })

  // ── Identity form state ──
  const [identity, setIdentity] = useState({
    displayName: '',
    schoolType: '',
    website: '',
    code: '',
  })
  const [identityOriginal, setIdentityOriginal] = useState(identity)

  // ── Location form state ──
  const [location, setLocation] = useState({
    street1: '',
    municipality: '',
    wardNumber: '',
    district: '',
    province: '',
    phone: '',
    email: '',
  })
  const [locationOriginal, setLocationOriginal] = useState(location)

  // ── Schedule form state ──
  const [schedule, setSchedule] = useState({
    schoolDays: [] as number[],
    startTime: '10:00',
    endTime: '16:00',
    periodDuration: 45,
  })
  const [scheduleOriginal, setScheduleOriginal] = useState(schedule)

  // Initialize from API data
  useEffect(() => {
    if (school && apiConfig) {
      const id = {
        displayName: school.name || '',
        schoolType: school.type || 'k12',
        website: (apiConfig as any).identity?.website || '',
        code: school.code || '',
      }
      setIdentity(id)
      setIdentityOriginal(id)

      const loc = {
        street1: school.address?.street1 || '',
        municipality: school.address?.municipality || school.address?.city || '',
        wardNumber: school.address?.wardNumber || '',
        district: school.address?.district || '',
        province: school.address?.province || school.address?.state || '',
        phone: school.phone || '',
        email: school.email || '',
      }
      setLocation(loc)
      setLocationOriginal(loc)

      const existingDays = (apiConfig as any).schoolDays
      const sched = {
        schoolDays: existingDays && existingDays.length > 0
          ? existingDays
          : localeDefaults.schoolDayIndices,
        startTime: (apiConfig as any).startTime || '10:00',
        endTime: (apiConfig as any).endTime || '16:00',
        periodDuration: (apiConfig as any).periodDuration || 45,
      }
      setSchedule(sched)
      setScheduleOriginal(sched)
    }
  }, [school, apiConfig, localeDefaults.schoolDayIndices])

  // Mutations
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

  // Section save handlers
  const saveIdentity = async () => {
    try {
      await updateSchoolMutation.mutateAsync({
        name: identity.displayName,
        schoolType: identity.schoolType as any,
        website: identity.website || undefined,
      })
      setIdentityOriginal(identity)
      toast.success('School identity saved')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save identity')
    }
  }

  const saveLocation = async () => {
    try {
      await updateSchoolMutation.mutateAsync({
        name: school?.name || identity.displayName,
        phone: location.phone || undefined,
        email: location.email || undefined,
        address: {
          street1: location.street1,
          city: location.municipality,
          state: location.province,
          zipCode: '',
          country: school?.address?.country || 'NPL',
          wardNumber: location.wardNumber || undefined,
          municipality: location.municipality || undefined,
          district: location.district || undefined,
          province: location.province || undefined,
        },
      })
      setLocationOriginal(location)
      toast.success('Location saved')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save location')
    }
  }

  const saveSchedule = async () => {
    try {
      await updateConfigMutation.mutateAsync({
        schoolDays: schedule.schoolDays,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        periodDuration: schedule.periodDuration,
      } as any)
      setScheduleOriginal(schedule)
      toast.success('Schedule saved')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save schedule')
    }
  }

  const identityDirty = JSON.stringify(identity) !== JSON.stringify(identityOriginal)
  const locationDirty = JSON.stringify(location) !== JSON.stringify(locationOriginal)
  const scheduleDirty = JSON.stringify(schedule) !== JSON.stringify(scheduleOriginal)

  const toggleDay = (dayIndex: number) => {
    setSchedule(prev => ({
      ...prev,
      schoolDays: prev.schoolDays.includes(dayIndex)
        ? prev.schoolDays.filter(d => d !== dayIndex)
        : [...prev.schoolDays, dayIndex].sort(),
    }))
  }

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-40 bg-[rgb(var(--background-secondary))] rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">

      {/* ── Section 1: School Identity ── */}
      <SectionCard
        icon="🏫"
        title="School Identity"
        subtitle="Basic school information and classification"
        footer={
          <>
            <button
              onClick={() => setIdentity(identityOriginal)}
              disabled={!identityDirty}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[rgba(255,255,255,0.08)] text-[rgb(var(--text-tertiary))] hover:bg-[rgba(255,255,255,0.04)] disabled:opacity-40 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={saveIdentity}
              disabled={!identityDirty || updateSchoolMutation.isPending}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#1D9E75] text-[rgb(var(--action-primary-fg))] hover:opacity-90 disabled:opacity-40 transition-all"
            >
              Save Identity
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3 p-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Display Name <span className="text-[rgb(var(--state-danger-fg))]">*</span></label>
            <input
              className={inputClass}
              type="text"
              value={identity.displayName}
              onChange={e => setIdentity(prev => ({ ...prev, displayName: e.target.value }))}
              placeholder="Full name of the school"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Short Code</label>
            <input
              className={inputClass}
              type="text"
              value={identity.code}
              disabled
              placeholder="2-4 letter abbreviation"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>School Type <span className="text-[rgb(var(--state-danger-fg))]">*</span></label>
            <select
              className={selectClass}
              value={identity.schoolType}
              onChange={e => setIdentity(prev => ({ ...prev, schoolType: e.target.value }))}
            >
              {SCHOOL_TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Website</label>
            <input
              className={inputClass}
              type="text"
              value={identity.website}
              onChange={e => setIdentity(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://www.school.edu"
            />
          </div>
          {/* Ed-Fi: Parent LEA (read-only) */}
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className={labelClass}>
              Parent LEA (District)
              <span className="text-xs px-1.5 py-0.5 rounded bg-[rgba(55,138,221,0.08)] text-[#378ADD] font-medium">Ed-Fi</span>
            </label>
            <div className={`${inputClass} bg-[rgba(255,255,255,0.02)] opacity-70 cursor-not-allowed`}>
              {parentLea ? parentLea.name : 'Not assigned'}
            </div>
            <p className="text-xs text-[rgb(var(--text-tertiary))]">
              Managed from Organization settings. Schools are assigned to LEAs in the education organization hierarchy.
            </p>
          </div>
        </div>
      </SectionCard>

      {/* ── Section 2: Location & Contact ── */}
      <SectionCard
        icon="📍"
        iconBg="bg-[rgba(29,158,117,0.1)]"
        title="Location & Contact"
        subtitle="Physical address and contact information"
        footer={
          <>
            <button
              onClick={() => setLocation(locationOriginal)}
              disabled={!locationDirty}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[rgba(255,255,255,0.08)] text-[rgb(var(--text-tertiary))] hover:bg-[rgba(255,255,255,0.04)] disabled:opacity-40 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={saveLocation}
              disabled={!locationDirty || updateSchoolMutation.isPending}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#1D9E75] text-[rgb(var(--action-primary-fg))] hover:opacity-90 disabled:opacity-40 transition-all"
            >
              Save Location
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3 p-4">
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className={labelClass}>Street / Tole</label>
            <input
              className={inputClass}
              type="text"
              value={location.street1}
              onChange={e => setLocation(prev => ({ ...prev, street1: e.target.value }))}
              placeholder="Street address"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Municipality / VDC</label>
            <input
              className={inputClass}
              type="text"
              value={location.municipality}
              onChange={e => setLocation(prev => ({ ...prev, municipality: e.target.value }))}
              placeholder="Municipality"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Ward No.</label>
            <input
              className={inputClass}
              type="text"
              value={location.wardNumber}
              onChange={e => setLocation(prev => ({ ...prev, wardNumber: e.target.value }))}
              placeholder="Ward number"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>District</label>
            <input
              className={inputClass}
              type="text"
              value={location.district}
              onChange={e => setLocation(prev => ({ ...prev, district: e.target.value }))}
              placeholder="District"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Province</label>
            <input
              className={inputClass}
              type="text"
              value={location.province}
              onChange={e => setLocation(prev => ({ ...prev, province: e.target.value }))}
              placeholder="Province"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Phone</label>
            <input
              className={inputClass}
              type="tel"
              value={location.phone}
              onChange={e => setLocation(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+977-"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Email</label>
            <input
              className={inputClass}
              type="email"
              value={location.email}
              onChange={e => setLocation(prev => ({ ...prev, email: e.target.value }))}
              placeholder="school@email.com"
            />
          </div>
        </div>
      </SectionCard>

      {/* ── Section 3: Schedule & Operations ── */}
      <SectionCard
        icon="🕐"
        iconBg="bg-[rgba(239,159,39,0.1)]"
        title="Schedule & Operations"
        subtitle="School days, hours, and class period duration"
        footer={
          <>
            <button
              onClick={() => setSchedule(scheduleOriginal)}
              disabled={!scheduleDirty}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[rgba(255,255,255,0.08)] text-[rgb(var(--text-tertiary))] hover:bg-[rgba(255,255,255,0.04)] disabled:opacity-40 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={saveSchedule}
              disabled={!scheduleDirty || updateConfigMutation.isPending}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#1D9E75] text-[rgb(var(--action-primary-fg))] hover:opacity-90 disabled:opacity-40 transition-all"
            >
              Save Schedule
            </button>
          </>
        }
      >
        <div className="p-4 space-y-4">
          {/* School Days picker */}
          <div className="space-y-1.5">
            <label className={labelClass}>
              School Days <span className="text-xs text-[rgb(var(--text-tertiary))] ml-1">— tap to toggle</span>
            </label>
            <div className="flex gap-1.5">
              {DAY_LABELS.map((day, i) => {
                const dayIndex = dayToIndex(day.key)
                const isActive = schedule.schoolDays.includes(dayIndex)
                return (
                  <button
                    key={`${day.key}-${i}`}
                    onClick={() => toggleDay(dayIndex)}
                    className={`
                      w-8 h-8 rounded-lg border text-xs font-semibold
                      flex items-center justify-center transition-all
                      ${isActive
                        ? 'bg-[rgba(55,138,221,0.15)] border-[rgba(55,138,221,0.3)] text-[#378ADD]'
                        : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)] text-[rgb(var(--text-tertiary))]'
                      }
                    `}
                  >
                    {day.short}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-[rgb(var(--text-tertiary))]">
              {localeDefaults.weekendHint}
            </p>
          </div>

          {/* Time inputs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>School Start Time</label>
              <input
                className={inputClass}
                type="time"
                value={schedule.startTime}
                onChange={e => setSchedule(prev => ({ ...prev, startTime: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>School End Time</label>
              <input
                className={inputClass}
                type="time"
                value={schedule.endTime}
                onChange={e => setSchedule(prev => ({ ...prev, endTime: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Period Duration (min)</label>
              <input
                className={inputClass}
                type="number"
                value={schedule.periodDuration}
                onChange={e => setSchedule(prev => ({ ...prev, periodDuration: parseInt(e.target.value) || 45 }))}
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── Inherit from Workspace banner ── */}
      <div className="flex items-start gap-2 bg-[rgba(55,138,221,0.05)] border border-[rgba(55,138,221,0.12)] rounded-lg px-3 py-2.5 text-xs text-[#378ADD]">
        <span className="flex-shrink-0">ℹ️</span>
        <span>
          <strong>Inheriting from Workspace:</strong> Some settings are inherited from your organization's workspace settings. Changes here will override the workspace defaults for this school only.
        </span>
      </div>

      {/* ── Danger Zone (Sprint S2.2a) ──
          Destructive operations that used to live inside the academic-setup wizard,
          one click away from data loss. Each action requires typed confirmation
          and emits a severity=high audit row. Operators are not expected to use
          this section during normal operation. */}
      <CalendarDangerZoneSection schoolId={schoolId} />
    </div>
  )
}

// ============================================================================
// CALENDAR DANGER ZONE (Sprint S2.2a)
// ============================================================================

/**
 * Destructive admin-only actions for the school's calendar. Currently only
 * exposes Reset & Regenerate Calendar; future scoped operations (S3) will
 * eliminate the need for full-wipe regeneration entirely.
 *
 * Why this section exists:
 *   V1 validation surfaced that "Regenerate Calendar" lived as a primary
 *   action in the academic-setup wizard. One operator click + one
 *   confirmation could wipe all 364 calendar dates including operator
 *   overrides (teacher-only days, early releases, holiday adjustments).
 *
 * Safeguards:
 *   1. Located on the Configuration tab — operator does NOT pass through
 *      this surface during normal setup.
 *   2. Red-bordered section with explicit "Danger Zone" branding.
 *   3. Typed confirmation: the destructive button is disabled until the
 *      operator types the literal phrase RESET-CALENDAR.
 *   4. Impact preview lists what will be lost (calendar dates total,
 *      breakdown of overrides if available).
 *   5. The backend generate-calendar already emits a CALENDAR.create audit
 *      row with severity='high' (Sprint S2.3). That row IS the post-hoc
 *      record of what was lost.
 */
function CalendarDangerZoneSection({ schoolId }: { schoolId: string }) {
  const localeDefaults = useLocaleDefaults()

  // Find the current/active AY — same pattern AcademicSetupTab uses.
  const { data: academicYears } = useQuery({
    queryKey: ['academic-years', schoolId],
    queryFn: () => tenantService.getAcademicYears(schoolId),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  })
  const years = Array.isArray(academicYears) ? academicYears : (academicYears as any)?.data ?? []
  const activeYear = years.find((y: any) => y.status === 'active') || years[0]
  const activeYearId: string = activeYear?.yearId || activeYear?.id || ''
  const yearLabel: string = activeYear?.name || activeYear?.shortName || 'this year'

  const { data: calendarStats } = useCalendarStats(schoolId, activeYearId, !!activeYearId)
  const totalDays: number = (calendarStats as any)?.totalDays ?? 0
  const holidays: number = (calendarStats as any)?.holidays ?? 0
  const instructionalDays: number = (calendarStats as any)?.instructionalDays ?? 0

  // Fetch the locale holidays the regen will re-apply. Mirrors what the
  // initial generate-calendar flow does.
  const { data: localeHolidayList } = useLocaleHolidays(
    schoolId,
    localeDefaults.isNepal ? 'np' : 'us',
    activeYear?.startDate || '',
    activeYear?.endDate || '',
    !!activeYearId,
  )
  const localeHolidays = Array.isArray(localeHolidayList) ? localeHolidayList : []

  const generateCalendar = useGenerateCalendar(schoolId)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [typedConfirm, setTypedConfirm] = useState('')
  const CONFIRM_PHRASE = 'RESET-CALENDAR'
  const canConfirm = typedConfirm === CONFIRM_PHRASE && !generateCalendar.isPending

  const closeModal = () => {
    if (generateCalendar.isPending) return
    setConfirmOpen(false)
    setTypedConfirm('')
  }

  const handleReset = () => {
    if (!canConfirm || !activeYearId || !activeYear) return
    generateCalendar.mutate(
      {
        yearId: activeYearId,
        data: {
          academicYearId: activeYearId,
          startDate: activeYear.startDate,
          endDate: activeYear.endDate,
          includeWeekends: false,
          schoolDays: localeDefaults.schoolDays as any,
          holidays: localeHolidays.map((h: any) => ({
            date: h.date,
            name: h.name,
            eventType: 'holiday' as const,
          })),
        } as any,
      },
      {
        onSuccess: () => closeModal(),
      },
    )
  }

  // If there's no active AY or no calendar yet, the destructive action is
  // not meaningful — render a passive disabled state instead of an enabled
  // red button.
  const isActionable = !!activeYearId && totalDays > 0

  return (
    <div className="bg-[rgb(var(--background-primary))] border border-[rgba(239,68,68,0.25)] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[rgba(239,68,68,0.18)] bg-[rgba(239,68,68,0.04)] flex items-center gap-2">
        <span aria-hidden className="text-base">⚠️</span>
        <div>
          <h3 className="text-xs font-semibold text-[#EF4444]">Danger Zone</h3>
          <p className="text-xs text-[rgb(var(--text-tertiary))]">
            Destructive admin actions. These cannot be undone.
          </p>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-xs font-semibold text-[rgb(var(--text-primary))] mb-1">
              Reset Calendar
            </p>
            <p className="text-xs text-[rgb(var(--text-tertiary))] leading-relaxed">
              Deletes the current calendar and regenerates it from locale defaults
              (Saturday weekend, {localeHolidays.length || '~30'} public holidays).
              Any manual overrides (teacher in-service days, early releases,
              custom holidays) will be <strong className="text-[#EF4444]">permanently lost</strong>.
              Auto-synced exam windows on terms will be re-created the next time
              a term is saved.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={!isActionable || generateCalendar.isPending}
            className="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg text-[#EF4444] border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.06)] hover:bg-[rgba(239,68,68,0.12)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset Calendar
          </button>
        </div>
        {!isActionable && (
          <p className="text-xs text-[rgb(var(--text-tertiary))] mt-2 italic">
            Disabled because there is no generated calendar to reset for {yearLabel}.
          </p>
        )}
      </div>

      {/* Typed-confirmation modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-[rgb(var(--background-overlay)/0.05)]5 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-md bg-[rgb(var(--background-primary))] border border-[rgba(239,68,68,0.35)] rounded-2xl shadow-xl p-5">
            <div className="flex items-start gap-2 mb-3">
              <span aria-hidden className="text-lg">⚠️</span>
              <div>
                <h3 className="text-sm font-bold text-[rgb(var(--text-primary))]">
                  Reset Calendar — are you absolutely sure?
                </h3>
                <p className="text-xs text-[#EF4444] font-medium mt-1">
                  This is a destructive action and cannot be undone.
                </p>
              </div>
            </div>

            <div className="bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.15)] rounded-lg p-3 mb-3 text-xs text-[rgb(var(--text-secondary))] leading-relaxed">
              <p className="mb-2">
                This will <strong className="text-[#EF4444]">delete the current calendar</strong> for{' '}
                <strong>{yearLabel}</strong> and regenerate from scratch.
              </p>
              <ul className="space-y-1 list-disc list-inside text-[10.5px]">
                <li>
                  <strong>{totalDays}</strong> calendar dates will be deleted
                </li>
                <li>
                  <strong>{instructionalDays}</strong> instructional days, <strong>{holidays}</strong> holidays — and any manual overrides on those rows — will be lost
                </li>
                <li>
                  Auto-synced exam_window events on terms will be recreated only when each term is next saved
                </li>
                <li>
                  A <strong>severity-high audit row</strong> is recorded automatically
                </li>
              </ul>
            </div>

            <label className="block text-xs font-medium text-[rgb(var(--text-tertiary))] mb-1">
              Type <code className="text-[10.5px] font-mono text-[#EF4444] bg-[rgba(239,68,68,0.08)] px-1 py-0.5 rounded">{CONFIRM_PHRASE}</code> to confirm:
            </label>
            <input
              type="text"
              autoFocus
              autoComplete="off"
              value={typedConfirm}
              onChange={e => setTypedConfirm(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(239,68,68,0.25)] rounded-lg px-3 py-2 text-xs text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:border-[rgba(239,68,68,0.55)] mb-4 font-mono"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={generateCalendar.isPending}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[rgba(255,255,255,0.08)] text-[rgb(var(--text-tertiary))] hover:bg-[rgba(255,255,255,0.04)] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={!canConfirm}
                className="px-3 py-1.5 text-xs font-medium rounded-lg text-[rgb(var(--action-primary-fg))] bg-[#EF4444] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {generateCalendar.isPending ? 'Resetting…' : 'Delete & Regenerate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
