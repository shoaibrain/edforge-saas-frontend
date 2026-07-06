/**
 * School Calendar Page
 *
 * Full calendar management page using FullCalendar:
 * - Month + list views with built-in navigation
 * - Click-to-edit via drawer with auto-populated form fields
 * - Stats cards with academic year progress, instructional days, holidays
 * - Calendar generation
 * - SessionManager (academic sessions/terms)
 * - Bikram Sambat dual-calendar for Nepal schools
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  CalendarDays,
  Wand2,
  Save,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button, Drawer, DrawerFooter, Dropdown, Select } from '@edforge/ui'
import type { DropdownOption } from '@edforge/ui'
import type { CalendarDateResponseDto } from '@aibrains/shared-types'
import { tenantService } from '@/services/tenant.service'
import {
  useCalendarStats,
  useUpdateCalendarDate,
  useGenerateCalendar,
} from '@/hooks/useCalendar'
import { useBellSchedules } from '@/hooks/useBellSchedules'
import { SchoolFullCalendar } from '@/components/calendar/SchoolFullCalendar'
import { SessionManager } from '@/components/calendar/SessionManager'
import { LEGEND_ITEMS, ALL_EVENT_TYPES, getEventTypeLabel } from '@/components/calendar/fullcalendar-utils'
import { OPERATOR_SELECTABLE_TYPES, EVENT_TYPE_LABELS } from '@/components/calendar/event-types'
// Sprint C4-FE §3.7 — curated single-day dropdown (audit Q2). This file is
// the legacy dormant calendar page (not currently routed); the retrofit
// exercises the curated mapper from both call sites (it + the active
// CalendarStep DateEditPanel in AcademicSetupTab.tsx) so they stay in sync
// if/when this page gets re-routed. Audit follow-up #2.
import {
  CURATED_OPTIONS_FOR_DROPDOWN,
  decodeCalendarEvent,
  encodeCuratedOption,
  getCuratedMeta,
  type CuratedSingleDayKey,
  type CalendarEventInput,
} from '@/components/calendar/single-day-curated-options'
import type { CalendarEventDescriptor } from '@aibrains/shared-types'
import { adToBS, BS_MONTH_NAMES_EN, BS_MONTH_NAMES_NE, DAY_NAMES_NE } from '@edforge/date-utils'
import {
  SettingsAlert,
} from '@/components/settings/SettingsShared'

// ============================================================================
// CONSTANTS
// ============================================================================

// Sprint S2.8 — derived from event-types.ts single source of truth.
// Sprint S2.5 — uses OPERATOR_SELECTABLE_TYPES so server-managed types
// (e.g. exam_window) don't appear in the operator dropdown.
const EVENT_TYPE_OPTIONS = OPERATOR_SELECTABLE_TYPES.map(t => ({
  value: t,
  label: EVENT_TYPE_LABELS[t],
}))

// ============================================================================
// HELPERS
// ============================================================================

const DAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function getDrawerTitle(
  cd: CalendarDateResponseDto | null,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (!cd) return t('schoolCalendar.labels.calendarDate')
  if (cd.isWeekend) return t('schoolCalendar.labels.weekend')
  const evt = cd.calendarEvents?.[0]
  if (evt?.description) return evt.description
  if (cd.isHoliday) return t('schoolCalendar.labels.holiday')
  if (cd.isInstructionalDay) return t('schoolCalendar.labels.instructionalDay')
  const evtType = evt?.eventType
  if (evtType) return getEventTypeLabel(evtType)
  return t('schoolCalendar.labels.calendarDate')
}

function formatDrawerDate(dateStr: string, calendarSystem: string, locale: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const isNepali = locale === 'ne'
  const dayNames = isNepali ? DAY_NAMES_NE : DAY_NAMES_EN
  const dayOfWeek = dayNames[date.getDay()]
  const bsMonthNames = isNepali ? BS_MONTH_NAMES_NE : BS_MONTH_NAMES_EN

  if (calendarSystem === 'bikram_sambat') {
    try {
      const bs = adToBS(date)
      const bsMonth = bsMonthNames[bs.month - 1] || ''
      const bsPrimary = `${dayOfWeek}, ${bsMonth} ${bs.day}, ${bs.year} BS`
      const adSecondary = date.toLocaleDateString(isNepali ? 'ne-NP' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      return `${bsPrimary} — ${adSecondary}`
    } catch { /* ignore conversion errors */ }
  }

  const formatted = date.toLocaleDateString(isNepali ? 'ne-NP' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  return `${dayOfWeek}, ${formatted}`
}

// ============================================================================
// PROPS
// ============================================================================

interface SchoolCalendarPageProps {
  schoolId: string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SchoolCalendarPage({ schoolId }: SchoolCalendarPageProps) {
  const { t, i18n } = useTranslation('settings')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showGenerator, setShowGenerator] = useState(false)
  const [showSessions, setShowSessions] = useState(false)
  const [editEventType, setEditEventType] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editIsInstructional, setEditIsInstructional] = useState(true)
  // Sprint C4-FE §3.7 — curated dropdown state. `editEventType` is preserved
  // as the underlying raw event type (computed from `editCuratedKey` on
  // non-"other" selections, set directly when "Other" is picked). Save flow
  // routes everything through `encodeCuratedOption`.
  const [editCuratedKey, setEditCuratedKey] = useState<CuratedSingleDayKey>('other')
  const [editBellScheduleId, setEditBellScheduleId] = useState<string | null>(null)
  const [editCalendarDate, setEditCalendarDate] = useState<CalendarDateResponseDto | null>(null)

  // Filter state — all types active by default (including weekend pseudo-type)
  const [activeTypes, setActiveTypes] = useState<Set<string>>(
    () => new Set([...ALL_EVENT_TYPES, '__weekend__'])
  )
  const allTypesActive = activeTypes.size === ALL_EVENT_TYPES.length + 1

  const toggleType = (type: string) => {
    setActiveTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  const toggleAllTypes = () => {
    if (allTypesActive) {
      setActiveTypes(new Set())
    } else {
      setActiveTypes(new Set([...ALL_EVENT_TYPES, '__weekend__']))
    }
  }

  // ── Fetch school (for calendarSystem) ──
  const { data: school } = useQuery({
    queryKey: ['school', schoolId],
    queryFn: () => tenantService.getSchool(schoolId),
    enabled: !!schoolId,
    staleTime: 10 * 60 * 1000,
  })
  const calendarSystem = (school as any)?.calendarSystem || 'gregorian'
  const schoolTimezone = (school as any)?.timezone || undefined
  const schoolFirstDay = (school as any)?.defaultWeekStartsOn ?? 0

  // Map user's language preference (not school locale) to FullCalendar locale code
  const fcLocaleCode = i18n.language === 'ne' ? 'ne' : undefined

  // ── Fetch academic years ──
  const { data: academicYears } = useQuery({
    queryKey: ['academic-years', schoolId],
    queryFn: () => tenantService.getAcademicYears(schoolId),
    staleTime: 5 * 60 * 1000,
  })

  const activeYear = useMemo(() => {
    if (!academicYears?.length) return null
    return academicYears.find((y: any) => y.status === 'active') || academicYears[0]
  }, [academicYears])

  const academicYearId = activeYear?.id || ''

  // ── Mutations ──
  const updateDate = useUpdateCalendarDate(schoolId)
  const generateCalendar = useGenerateCalendar(schoolId)

  // ── Bell Schedules ──
  const { data: schedulesData } = useBellSchedules(schoolId)
  const bellScheduleOptions: DropdownOption[] = useMemo(() => {
    const items = schedulesData?.items || []
    return [
      { id: '__none__', label: t('schoolCalendar.noSchedule.label'), description: t('schoolCalendar.noSchedule.description') },
      ...items
        .filter((s: any) => s.isActive)
        .map((s: any) => ({
          id: s.bellScheduleId,
          label: s.bellScheduleName,
          description: s.dayType.replace(/_/g, ' '),
        })),
    ]
  }, [schedulesData, t])

  const getScheduleName = (id: string | null): string | undefined => {
    if (!id || id === '__none__') return undefined
    const items = schedulesData?.items || []
    return items.find((s: any) => s.bellScheduleId === id)?.bellScheduleName
  }

  // ── Stats ──
  const { data: stats } = useCalendarStats(schoolId, academicYearId, !!academicYearId)

  // ── Date click → open single edit drawer with pre-populated data ──
  const handleDateClick = (date: string, calendarDate?: CalendarDateResponseDto) => {
    if (date === selectedDate) {
      setSelectedDate(null)
      return
    }
    setSelectedDate(date)
    setEditCalendarDate(calendarDate || null)

    // Pre-populate edit form from existing calendar date data
    if (calendarDate) {
      const evt = calendarDate.calendarEvents?.[0] as CalendarEventInput | undefined
      if (evt) {
        setEditEventType(evt.eventType)
        setEditDescription(evt.description || '')
        // Sprint C4-FE §3.7 — decode the stored event into a curated key so
        // the dropdown shows the right operator-facing label on edit-open.
        // Pre-seeded PABSON holidays decode cleanly to 'holiday' rather
        // than falling through to 'other'.
        setEditCuratedKey(decodeCalendarEvent(evt))
      } else if (calendarDate.isInstructionalDay) {
        setEditEventType('instructional_day')
        setEditDescription('')
        setEditCuratedKey('other')
      } else {
        setEditEventType('non_instructional_day')
        setEditDescription('')
        setEditCuratedKey('other')
      }
      setEditIsInstructional(calendarDate.isInstructionalDay)
      setEditBellScheduleId(calendarDate.bellScheduleId || null)
    } else {
      // No data for this date — reset form
      setEditEventType('')
      setEditDescription('')
      setEditIsInstructional(true)
      setEditBellScheduleId(null)
      setEditCuratedKey('other')
    }
  }

  // ── Save single date edit ──
  const handleSaveDate = () => {
    if (!selectedDate || !editEventType) return
    const bellScheduleId = editBellScheduleId && editBellScheduleId !== '__none__' ? editBellScheduleId : undefined
    const bellScheduleName = getScheduleName(editBellScheduleId)
    // Sprint C4-FE §3.7 — encode the curated dropdown selection into the
    // full CalendarEvent triple (eventType + optional audience + category).
    // When the operator picked "Other", `editEventType` carries the raw
    // override they selected from the secondary dropdown. For every other
    // curated key, the eventType is derived from `getCuratedMeta(key)`.
    const encodedEvent = encodeCuratedOption(
      editCuratedKey,
      editDescription,
      editCuratedKey === 'other' ? (editEventType as CalendarEventDescriptor) : undefined,
    )
    updateDate.mutate(
      {
        date: selectedDate,
        data: {
          calendarEvents: [encodedEvent as any],
          isInstructionalDay: editIsInstructional,
          bellScheduleId,
          bellScheduleName,
        },
      },
      {
        onSuccess: () => {
          toast.success(`Updated ${selectedDate}`)
          setSelectedDate(null)
          setEditBellScheduleId(null)
        },
      }
    )
  }

  // ── Generate calendar ──
  const handleGenerate = () => {
    if (!activeYear) return
    generateCalendar.mutate(
      {
        yearId: academicYearId,
        data: {
          academicYearId,
          startDate: activeYear.startDate,
          endDate: activeYear.endDate,
          schoolDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          mode: 'replace',
          includeWeekends: false,
        },
      },
      {
        onSuccess: (result) => {
          toast.success(t('schoolCalendar.toasts.generated', { totalDays: result.totalDays, instructionalDays: result.instructionalDays }))
          setShowGenerator(false)
        },
      }
    )
  }

  if (!academicYearId) {
    return (
      <SettingsAlert type="info" message={t('schoolCalendar.noAcademicYear')} />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[rgb(var(--state-info-bg)/0.14)] to-[rgb(var(--state-info-bg)/0.14)] border border-[rgb(var(--border-focus)/0.35)]">
            <CalendarDays className="w-5 h-5 text-[rgb(var(--action-secondary-fg))]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">{t('schoolCalendar.title')}</h2>
            <p className="text-sm text-[rgb(var(--text-tertiary))]">
              {t('schoolCalendar.subtitle', { year: activeYear?.name || t('schoolCalendar.academicYearFallback') })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSessions(!showSessions)}
          >
            <Layers className="w-4 h-4 me-1.5" />
            {t('schoolCalendar.actions.sessions')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGenerator(true)}
          >
            <Wand2 className="w-4 h-4 me-1.5" />
            {t('schoolCalendar.actions.generate')}
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {/* Academic Year Progress */}
          <div className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] px-4 py-3 border-s-4 border-s-teal-500">
            <div className="text-sm font-semibold text-[rgb(var(--text-primary))] truncate">{activeYear?.name || t('schoolCalendar.academicYearFallback')}</div>
            {stats.progressPercentage != null ? (
              <>
                <div className="mt-1.5 w-full h-1.5 rounded-full bg-[rgb(var(--border-primary))]">
                  <div className="h-full rounded-full bg-[rgb(var(--action-primary-bg))] transition-all" style={{ width: `${Math.min(stats.progressPercentage, 100)}%` }} />
                </div>
                <div className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
                  {t('schoolCalendar.stats.daysElapsed', { passed: stats.daysPassed ?? 0, total: stats.totalDays ?? 0 })}
                </div>
              </>
            ) : (
              <div className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
                {t('schoolCalendar.stats.totalDays', { count: stats.totalDays ?? 0 })}
              </div>
            )}
          </div>

          {/* Instructional Days */}
          <div className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] px-4 py-3 border-s-4 border-s-emerald-500">
            <div className="text-2xl font-bold text-[rgb(var(--state-success-fg))] ">{stats.instructionalDays ?? 0}</div>
            <div className="text-xs font-medium text-[rgb(var(--text-secondary))]">{t('schoolCalendar.stats.instructionalDays')}</div>
            {stats.instructionalDaysRemaining != null && (
              <div className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
                {t('schoolCalendar.stats.instructionalProgress', { completed: stats.instructionalDaysPassed ?? 0, remaining: stats.instructionalDaysRemaining })}
              </div>
            )}
          </div>

          {/* Holidays */}
          <div className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] px-4 py-3 border-s-4 border-s-red-500">
            <div className="text-2xl font-bold text-[rgb(var(--state-danger-fg))] dark:text-[rgb(var(--state-danger-fg))]">{stats.holidays ?? 0}</div>
            <div className="text-xs font-medium text-[rgb(var(--text-secondary))]">{t('schoolCalendar.stats.holidays')}</div>
            <div className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
              {(stats.holidays ?? 0) === 0 ? t('schoolCalendar.stats.noHolidays') : t('schoolCalendar.stats.scheduledHolidays')}
            </div>
          </div>

          {/* Non-Instructional */}
          <div className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] px-4 py-3 border-s-4 border-s-slate-400">
            <div className="text-2xl font-bold text-[rgb(var(--text-secondary))]">{stats.nonInstructionalDays ?? 0}</div>
            <div className="text-xs font-medium text-[rgb(var(--text-secondary))]">{t('schoolCalendar.stats.nonInstructional')}</div>
            {(stats.teacherOnlyDays ?? 0) > 0 && (
              <div className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
                {t('schoolCalendar.stats.teacherOnlyDays', { count: stats.teacherOnlyDays })}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* FullCalendar Grid */}
      <SchoolFullCalendar
        schoolId={schoolId}
        academicYearId={academicYearId}
        onDateClick={handleDateClick}
        focusedDate={selectedDate}
        isEditable
        calendarSystem={calendarSystem}
        locale={fcLocaleCode}
        timeZone={schoolTimezone}
        firstDay={schoolFirstDay}
        activeTypes={allTypesActive ? undefined : activeTypes}
        onGenerate={() => setShowGenerator(true)}
      />

      {/* Single Date Edit Drawer */}
      <Drawer
        open={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        title={getDrawerTitle(editCalendarDate, t)}
        description={selectedDate ? formatDrawerDate(selectedDate, calendarSystem, i18n.language) : ''}
        size="sm"
      >
        <div className="space-y-5">
          {/* Date Info Card */}
          {selectedDate && editCalendarDate && (() => {
            const evt = editCalendarDate.calendarEvents?.[0]
            const holidayName = evt?.description
            const isWeekendWithHoliday = editCalendarDate.isWeekend && evt?.eventType === 'holiday'

            return (
              <div className={`rounded-xl px-4 py-3 border ${
                isWeekendWithHoliday
                  ? 'bg-[rgb(var(--background-tertiary))]0/5 border-[rgb(var(--border-secondary))]'
                  : editCalendarDate.isWeekend
                    ? 'bg-[rgb(var(--background-tertiary))]0/5 border-[rgb(var(--border-secondary))]'
                    : editCalendarDate.isHoliday || evt?.eventType === 'holiday'
                      ? 'bg-[rgb(var(--state-danger-bg)/0.18)]0/5 border-[rgb(var(--state-danger-border))]/30'
                      : editCalendarDate.isInstructionalDay
                        ? 'bg-[rgb(var(--state-success-fg))]/5 border-[rgb(var(--state-success-border)/0.35)]'
                        : 'bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary))]'
              }`}>
                {/* Primary badge */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                    isWeekendWithHoliday
                      ? 'bg-[rgb(var(--background-tertiary))]0/10 text-[rgb(var(--text-secondary))] dark:text-[rgb(var(--text-tertiary))]'
                      : editCalendarDate.isWeekend
                        ? 'bg-[rgb(var(--background-tertiary))]0/10 text-[rgb(var(--text-secondary))] dark:text-[rgb(var(--text-tertiary))]'
                        : editCalendarDate.isHoliday || evt?.eventType === 'holiday'
                          ? 'bg-[rgb(var(--state-danger-bg)/0.18)]0/10 text-[rgb(var(--state-danger-fg))] dark:text-[rgb(var(--state-danger-fg))]'
                          : editCalendarDate.isInstructionalDay
                            ? 'bg-[rgb(var(--state-success-bg)/0.18)] text-[rgb(var(--state-success-fg))] '
                            : 'bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-secondary))]'
                  }`}>
                    {isWeekendWithHoliday
                      ? t('schoolCalendar.labels.weekend')
                      : editCalendarDate.isWeekend
                        ? t('schoolCalendar.labels.weekend')
                        : evt?.eventType
                          ? getEventTypeLabel(evt.eventType)
                          : editCalendarDate.isInstructionalDay
                            ? t('schoolCalendar.labels.instructionalDay')
                            : t('schoolCalendar.labels.nonInstructional')}
                  </span>
                </div>

                {/* Holiday name (when it's a proper holiday, not weekend-override) */}
                {!editCalendarDate.isWeekend && holidayName && evt?.eventType === 'holiday' && (
                  <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{holidayName}</p>
                )}

                {/* Weekend + Holiday overlap explanation */}
                {isWeekendWithHoliday && holidayName && (
                  <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
                    {t('schoolCalendar.drawer.weekendHolidayOverlap', { holiday: holidayName, day: editCalendarDate.dayOfWeek })}
                  </p>
                )}

                {/* Day numbers for instructional days */}
                {editCalendarDate.isInstructionalDay && !editCalendarDate.isWeekend && (
                  <div className="flex items-center gap-3 text-xs text-[rgb(var(--text-tertiary))] mt-1.5">
                    {editCalendarDate.dayNumber != null && (
                      <span>{t('schoolCalendar.drawer.dayNumber', { day: editCalendarDate.dayNumber })}</span>
                    )}
                    {editCalendarDate.instructionalDayNumber != null && (
                      <span>{t('schoolCalendar.drawer.instructionalDayNumber', { day: editCalendarDate.instructionalDayNumber })}</span>
                    )}
                  </div>
                )}

                {/* Bell schedule */}
                {editCalendarDate.bellScheduleName && (
                  <div className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
                    {t('schoolCalendar.drawer.bellScheduleValue', { schedule: editCalendarDate.bellScheduleName })}
                  </div>
                )}
              </div>
            )
          })()}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[rgb(var(--border-primary))]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 text-xs font-medium uppercase tracking-wider text-[rgb(var(--text-tertiary))] bg-[rgb(var(--background-primary))]">
                {t('common.edit')}
              </span>
            </div>
          </div>

          <div>
            {/* Sprint C4-FE §3.7 — curated dropdown (operator-friendly labels).
                Mirrors the active DateEditPanel in AcademicSetupTab.tsx.
                "Other" reveals the raw eventType picker as an escape hatch. */}
            <Select
              label={t('schoolCalendar.drawer.eventType')}
              value={editCuratedKey}
              onChange={(v) => {
                const newKey = (v ?? '') as CuratedSingleDayKey
                setEditCuratedKey(newKey)
                // Update underlying editEventType for state-consistency +
                // the save-button-enabled check (`editEventType` is the
                // truth flag for "is something selected").
                if (newKey !== 'other') {
                  const meta = getCuratedMeta(newKey)
                  setEditEventType(meta.eventType)
                  setEditIsInstructional(meta.autoInstructional)
                }
              }}
              options={[
                ...CURATED_OPTIONS_FOR_DROPDOWN.map(opt => ({ value: opt.key, label: opt.label })),
                { value: 'other', label: t('schoolCalendar.drawer.otherAdvanced') },
              ]}
            />
            {editCuratedKey !== 'other' && (
              <p className="mt-1 text-xs text-[rgb(var(--text-tertiary))] leading-tight">
                {getCuratedMeta(editCuratedKey).description}
              </p>
            )}
          </div>

          {/* "Other" escape hatch — raw eventType dropdown when the curated
              options don't fit. */}
          {editCuratedKey === 'other' && (
            <div>
              <Select
                label={t('schoolCalendar.drawer.rawEventType')}
                placeholder={t('schoolCalendar.drawer.selectPlaceholder')}
                value={editEventType || null}
                onChange={(v) => {
                  setEditEventType(v ?? '')
                  setEditIsInstructional((v ?? '') === 'instructional_day')
                }}
                options={EVENT_TYPE_OPTIONS}
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">{t('schoolCalendar.drawer.description')}</label>
            <input
              type="text"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder={t('schoolCalendar.drawer.descriptionPlaceholder')}
              className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-primary))] px-3 py-2.5"
            />
          </div>

          {/* Instructional toggle */}
          <div className="flex items-center justify-between rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] px-3 py-2.5">
            <span className="text-sm text-[rgb(var(--text-secondary))]">{t('schoolCalendar.labels.instructionalDay')}</span>
            <button
              type="button"
              role="switch"
              aria-checked={editIsInstructional}
              onClick={() => setEditIsInstructional(!editIsInstructional)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                editIsInstructional ? 'bg-[rgb(var(--action-primary-bg))]' : 'bg-[rgb(var(--border-primary))]'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-[rgb(var(--background-secondary))] shadow transition-transform ${
                  editIsInstructional ? 'translate-x-4.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Bell Schedule */}
          {bellScheduleOptions.length > 1 && (
            <div>
              <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">{t('schoolCalendar.drawer.bellSchedule')}</label>
              <Dropdown
                options={bellScheduleOptions}
                value={editBellScheduleId}
                onChange={(id) => setEditBellScheduleId(id)}
                placeholder={t('schoolCalendar.drawer.assignBellSchedule')}
                buttonClassName="rounded-xl py-2.5"
              />
            </div>
          )}

          <DrawerFooter>
            <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)}>{t('common.cancel')}</Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveDate}
              disabled={!editEventType || updateDate.isPending}
              isLoading={updateDate.isPending}
            >
              <Save className="w-4 h-4 me-1.5" />
              {t('common.save')}
            </Button>
          </DrawerFooter>
        </div>
      </Drawer>

      {/* Generate Calendar Modal */}
      <AnimatePresence>
        {showGenerator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-[rgb(var(--background-overlay)/0.50)] backdrop-blur-sm" onClick={() => setShowGenerator(false)} />
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative w-full max-w-md bg-[rgb(var(--background-primary))] rounded-2xl shadow-xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[rgb(var(--action-primary-bg))]/10">
                  <Wand2 className="w-5 h-5 text-[rgb(var(--action-secondary-fg))]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[rgb(var(--text-primary))]">{t('schoolCalendar.generate.title')}</h3>
                  <p className="text-sm text-[rgb(var(--text-tertiary))]">
                    {t('schoolCalendar.generate.subtitle', { year: activeYear?.name })}
                  </p>
                </div>
              </div>

              <div className="text-sm text-[rgb(var(--text-secondary))] space-y-2">
                <p>{t('schoolCalendar.generate.dateRangePrefix')} <strong>{activeYear?.startDate}</strong> {t('schoolCalendar.generate.dateRangeMiddle')} <strong>{activeYear?.endDate}</strong>.</p>
                <p>{t('schoolCalendar.generate.instructionalNote')}</p>
                <p className="text-amber-600 dark:text-amber-400">{t('schoolCalendar.generate.replaceWarning')}</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowGenerator(false)}>{t('common.cancel')}</Button>
                <Button
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={generateCalendar.isPending}
                  isLoading={generateCalendar.isPending}
                >
                  <Wand2 className="w-4 h-4 me-1.5" />
                  {t('schoolCalendar.generate.title')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Academic Sessions Drawer */}
      <Drawer
        open={showSessions && !!activeYear}
        onClose={() => setShowSessions(false)}
        title={t('schoolCalendar.sessions.title')}
        description={t('schoolCalendar.sessions.description', { year: activeYear?.name || t('schoolCalendar.sessions.thisYear') })}
        size="lg"
      >
        {activeYear && (
          <SessionManager
            schoolId={schoolId}
            academicYearId={academicYearId}
            academicYearStartDate={activeYear.startDate}
            academicYearEndDate={activeYear.endDate}
          />
        )}
      </Drawer>

      {/* Interactive Legend / Filter */}
      <div className="flex flex-wrap items-center gap-2 px-1 py-3">
        <button
          onClick={toggleAllTypes}
          className={`text-xs font-medium px-2 py-1 rounded-full border transition-colors ${
            allTypesActive
              ? 'border-[rgb(var(--border-focus)/0.35)] bg-[rgb(var(--action-primary-bg))]/10 text-[rgb(var(--state-info-fg))] '
              : 'border-[rgb(var(--border-primary))] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]'
          }`}
        >
          {allTypesActive ? t('schoolCalendar.filters.all') : t('schoolCalendar.filters.none')}
        </button>
        {LEGEND_ITEMS.map(item => {
          const isActive = activeTypes.has(item.type)
          return (
            <button
              key={item.type}
              onClick={() => toggleType(item.type)}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${
                isActive
                  ? 'border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-secondary))]'
                  : 'border-transparent bg-transparent text-[rgb(var(--text-tertiary))] opacity-40 hover:opacity-70'
              }`}
            >
              <span className={`fc-legend-dot fc-legend-dot--${item.type}`} />
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
