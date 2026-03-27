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
    <div className="bg-[rgb(var(--surface-primary))] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.05)] flex items-center gap-2.5">
        <div className={`w-[26px] h-[26px] rounded-lg ${iconBg} flex items-center justify-center text-[13px]`}>
          {icon}
        </div>
        <div>
          <h3 className="text-xs font-semibold text-[rgb(var(--text-primary))]">{title}</h3>
          <p className="text-[10px] text-[rgb(var(--text-tertiary))] mt-px">{subtitle}</p>
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
const labelClass = "text-[11px] font-medium text-[rgb(var(--text-tertiary))] flex items-center gap-1"

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
          <div key={i} className="h-40 bg-[rgb(var(--surface-secondary))] rounded-xl" />
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
              className="px-3 py-1.5 text-[11px] font-medium rounded-lg border border-[rgba(255,255,255,0.08)] text-[rgb(var(--text-tertiary))] hover:bg-[rgba(255,255,255,0.04)] disabled:opacity-40 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={saveIdentity}
              disabled={!identityDirty || updateSchoolMutation.isPending}
              className="px-3 py-1.5 text-[11px] font-medium rounded-lg bg-[#1D9E75] text-white hover:opacity-90 disabled:opacity-40 transition-all"
            >
              Save Identity
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3 p-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Display Name <span className="text-red-500">*</span></label>
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
            <label className={labelClass}>School Type <span className="text-red-500">*</span></label>
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
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[rgba(55,138,221,0.08)] text-[#378ADD] font-medium">Ed-Fi</span>
            </label>
            <div className={`${inputClass} bg-[rgba(255,255,255,0.02)] opacity-70 cursor-not-allowed`}>
              {parentLea ? parentLea.name : 'Not assigned'}
            </div>
            <p className="text-[10px] text-[rgb(var(--text-tertiary))]">
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
              className="px-3 py-1.5 text-[11px] font-medium rounded-lg border border-[rgba(255,255,255,0.08)] text-[rgb(var(--text-tertiary))] hover:bg-[rgba(255,255,255,0.04)] disabled:opacity-40 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={saveLocation}
              disabled={!locationDirty || updateSchoolMutation.isPending}
              className="px-3 py-1.5 text-[11px] font-medium rounded-lg bg-[#1D9E75] text-white hover:opacity-90 disabled:opacity-40 transition-all"
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
              className="px-3 py-1.5 text-[11px] font-medium rounded-lg border border-[rgba(255,255,255,0.08)] text-[rgb(var(--text-tertiary))] hover:bg-[rgba(255,255,255,0.04)] disabled:opacity-40 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={saveSchedule}
              disabled={!scheduleDirty || updateConfigMutation.isPending}
              className="px-3 py-1.5 text-[11px] font-medium rounded-lg bg-[#1D9E75] text-white hover:opacity-90 disabled:opacity-40 transition-all"
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
              School Days <span className="text-[10px] text-[rgb(var(--text-tertiary))] ml-1">— tap to toggle</span>
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
                      w-8 h-8 rounded-lg border text-[11px] font-semibold
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
            <p className="text-[10px] text-[rgb(var(--text-tertiary))]">
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
      <div className="flex items-start gap-2 bg-[rgba(55,138,221,0.05)] border border-[rgba(55,138,221,0.12)] rounded-lg px-3 py-2.5 text-[11px] text-[#378ADD]">
        <span className="flex-shrink-0">ℹ️</span>
        <span>
          <strong>Inheriting from Workspace:</strong> Some settings are inherited from your organization's workspace settings. Changes here will override the workspace defaults for this school only.
        </span>
      </div>
    </div>
  )
}
