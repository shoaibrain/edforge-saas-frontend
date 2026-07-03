/**
 * RecordingDrawer — the recording flow, re-homed into a slide-over.
 *
 * Opens from any Record / Continue / View-edit action. Wraps the EXISTING
 * `AttendanceGrid` unchanged — the marking, mark-all, live tally, reason/note,
 * save/correction, offline resilience, and daily-presence locks are all
 * preserved verbatim; only the container is new. Header mode (recorded / partial
 * / new) drives the pill + note; the grid owns its own save button. Data is
 * fetched per the section passed in (`useSectionRoster` + records + calendar +
 * locks), mirroring the old daily-entry panel exactly.
 */

import { useCallback, useMemo } from 'react'
import { Drawer } from '@edforge/ui'
import { Info, Check, AlertTriangle } from 'lucide-react'
import { useSectionRoster } from '../../../hooks'
import {
  useCalendarDate,
  usePresenceLocks,
} from '../../../hooks/useAttendance'
import {
  useSectionAttendanceRecords,
  useRecordBulkSectionAttendance,
  useUpdateSectionAttendance,
} from '../../../hooks/useSectionAttendance'
import { useOfflineAttendance } from '../../../hooks/useOfflineAttendance'
import { AttendanceGrid } from '../AttendanceGrid'
import { useAcademicsI18n } from '../../../lib/i18n'
import type { AttendanceStatus } from '../../../services/academics.service'
import type { SectionRecordStatus } from './coverage'

interface RecordingDrawerProps {
  open: boolean
  sectionId: string | null
  courseName?: string
  sectionNumber?: string
  recordStatus?: SectionRecordStatus
  recordedCount?: number
  enrolledCount?: number
  schoolId: string
  date: string
  canCreate: boolean
  isDailyPresence: boolean
  onClose: () => void
}

export function RecordingDrawer({
  open,
  sectionId,
  courseName,
  sectionNumber,
  recordStatus = 'not-started',
  recordedCount = 0,
  enrolledCount = 0,
  schoolId,
  date,
  canCreate,
  isDailyPresence,
  onClose,
}: RecordingDrawerProps) {
  const { t, formatDate, formatNumber } = useAcademicsI18n()
  const active = open && !!sectionId
  const sid = sectionId || ''

  const { data: roster, isLoading: rosterLoading } = useSectionRoster({
    sectionId: sid,
    schoolId,
    enabled: active && !!schoolId,
  })

  const { data: sectionRecords } = useSectionAttendanceRecords({
    sectionId: sid,
    schoolId,
    date,
    enabled: active && !!schoolId,
  })

  const existingRecords = useMemo(() => {
    if (!sectionRecords) return []
    return sectionRecords.map((r) => ({
      studentId: r.studentId,
      status: r.status as AttendanceStatus,
      notes: r.notes,
      excuseReason: r.excuseReason,
    }))
  }, [sectionRecords])

  const { data: calendarDate } = useCalendarDate({
    schoolId,
    date,
    enabled: active && !!schoolId,
  })
  const isNonInstructional = calendarDate != null && !calendarDate.isInstructionalDay

  const bulkMutation = useRecordBulkSectionAttendance()
  const updateMutation = useUpdateSectionAttendance()

  const { data: presenceLockData } = usePresenceLocks(
    isDailyPresence && active ? schoolId : undefined,
    isDailyPresence && active ? date : undefined,
  )
  const lockedStudents = useMemo(() => {
    const map = new Map<string, string>()
    if (!isDailyPresence || !presenceLockData?.locks || !sectionId) return map
    for (const lock of presenceLockData.locks) {
      if (lock.lockedBySectionId !== sectionId) {
        const where = lock.lockedBySectionName ? ` in ${lock.lockedBySectionName}` : ''
        map.set(lock.studentId, `Already ${lock.status}${where}`)
      }
    }
    return map
  }, [isDailyPresence, presenceLockData, sectionId])

  const offlineState = useOfflineAttendance({
    schoolId,
    sectionId: sid,
    date,
    onSave: async (records) => {
      if (!schoolId || !sectionId) return
      await bulkMutation.mutateAsync({ date, schoolId, sectionId, records })
    },
  })

  const handleSave = useCallback(
    (records: Array<{ studentId: string; status: AttendanceStatus; notes?: string; excuseReason?: string }>) => {
      if (!schoolId || !sectionId) return
      offlineState.persistLocally(
        records.map((r) => ({ studentId: r.studentId, status: r.status, notes: r.notes ?? '', excuseReason: r.excuseReason })),
      )
      offlineState.save()
    },
    [schoolId, sectionId, offlineState],
  )

  const handleCorrection = useCallback(
    (record: { studentId: string; status: AttendanceStatus; notes?: string; excuseType?: string }) => {
      if (!schoolId || !sectionId) return
      const hasExisting = sectionRecords?.some((r) => r.studentId === record.studentId)
      if (hasExisting) {
        updateMutation.mutate({
          date,
          sectionId,
          studentId: record.studentId,
          status: record.status,
          notes: record.notes,
          excuseReason: record.excuseType,
          schoolId,
        })
      } else {
        bulkMutation.mutate({
          date,
          schoolId,
          sectionId,
          records: [{ studentId: record.studentId, status: record.status, notes: record.notes, excuseReason: record.excuseType }],
        })
      }
    },
    [schoolId, sectionId, date, sectionRecords, updateMutation, bulkMutation],
  )

  const dateLabel = formatDate(date + 'T00:00:00', { month: 'short', day: 'numeric', year: 'numeric' })
  const mode = recordStatus === 'recorded' ? 'recorded' : recordStatus === 'partial' ? 'partial' : 'new'
  const title = `${courseName ?? t('attendance.dashboard.drawer.section')} — ${sectionNumber ?? ''}`.trim()
  const description =
    mode === 'recorded'
      ? t('attendance.dashboard.drawer.subRecorded', { date: dateLabel, count: formatNumber(recordedCount) })
      : mode === 'partial'
        ? t('attendance.dashboard.drawer.subPartial', { date: dateLabel, done: formatNumber(recordedCount), total: formatNumber(enrolledCount) })
        : t('attendance.dashboard.drawer.subNew', { date: dateLabel, count: formatNumber(enrolledCount) })

  return (
    <Drawer open={open} onClose={onClose} title={title} description={description} size="xl">
      {/* Mode note */}
      {mode === 'recorded' ? (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-[rgb(var(--state-info-fg)/0.2)] bg-[rgb(var(--state-info-bg)/0.12)] px-3 py-2 text-xs text-[rgb(var(--state-info-fg))]">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{t('attendance.dashboard.drawer.editNote')}</span>
        </div>
      ) : isDailyPresence ? (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-tertiary)/0.5)] px-3 py-2 text-xs text-[rgb(var(--text-secondary))]">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[rgb(var(--state-success-fg))]" aria-hidden="true" />
          <span>{t('attendance.policy.dailyPresenceDescription')}</span>
        </div>
      ) : null}

      {/* Non-instructional day */}
      {isNonInstructional && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-[rgb(var(--state-warning-fg)/0.2)] bg-[rgb(var(--state-warning-bg)/0.12)] px-3 py-2 text-xs text-[rgb(var(--state-warning-fg))]">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            {t('attendance.calendar.cannotSubmit', {
              description:
                calendarDate?.calendarEvents?.[0]?.description ||
                t('attendance.calendar.nonInstructionalFallback', {
                  eventType: calendarDate?.calendarEvents?.[0]?.eventType || 'non-instructional',
                }),
            })}
          </span>
        </div>
      )}

      {!active ? null : rosterLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-[rgb(var(--background-tertiary))]" />
          ))}
        </div>
      ) : (
        <AttendanceGrid
          key={`${sid}-${date}`}
          compact
          students={roster?.students ?? []}
          date={date}
          existingRecords={existingRecords}
          onSave={handleSave}
          isSaving={bulkMutation.isPending || offlineState.saveStatus === 'saving'}
          disabled={isNonInstructional || !canCreate}
          saveStatus={offlineState.saveStatus}
          onCorrection={handleCorrection}
          lockedStudents={lockedStudents}
        />
      )}
    </Drawer>
  )
}
