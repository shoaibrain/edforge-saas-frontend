/**
 * Student Portal — My Schedule Page (v2)
 *
 * Content pane: view switcher → timetable (day or week) → course cards → quick reference.
 *
 * Inline apiGet migration: removes apiGet('/academics/students/${studentId}/sections')
 * (previously line ~39). Also removes inline ListView, GridView sub-components.
 *
 * Data join logic:
 *   sections (enrolled courses) + bell schedule (period times) → timetable grid
 *   The join maps section.periodId → bell schedule periodNumber to resolve times.
 *   If no bell schedule exists, the timetable degrades to course cards only.
 *
 * ABAC: all endpoints verified accessible to Student role (§1.8a).
 */

import { useState, useMemo } from 'react'
import { useTranslation } from '@edforge/i18n'
import {
  WidgetErrorBoundaryV2,
  ContentSection,
  CourseCard,
  WeekTimetable,
  type TimetableSlot,
  type TimetableClassBlock,
} from '@edforge/ui'
import { useAppStore } from '../../stores/app.store'
import { useShell } from '../../lib/shell-context'
import { useStudentPortal } from './StudentPortalLayout'
import { useStudentSections } from '../../hooks/useStudentSections'
import { usePortalBellSchedule, type BellSchedulePeriod } from '../../hooks/usePortalBellSchedule'
import { TodayTimeline } from '../portal-shared/TodayTimeline'
import { usePortalClassPeriods } from '../../hooks/usePortalClassPeriods'
import { ViewSwitcher, type ScheduleView } from './sections/ViewSwitcher'
import { QuickReferenceTable } from './sections/QuickReferenceTable'

// ============================================================================
// COMPONENT
// ============================================================================

export default function StudentSchedulePage() {
  const { t } = useTranslation('portal')
  const { studentId, studentProfile } = useStudentPortal()
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const { activeSchoolYear } = useShell()
  const schoolId = activeSchoolId ?? studentProfile.schoolId

  const [view, setView] = useState<ScheduleView>('week')

  // Data hooks
  const { data: sections, isLoading: sectionsLoading } =
    useStudentSections(studentId, schoolId, { academicYearId: activeSchoolYear?.id })
  const { data: bellSchedules, isLoading: bellLoading } =
    usePortalBellSchedule(schoolId)
  const { data: classPeriods, isLoading: periodsLoading } =
    usePortalClassPeriods(schoolId)

  const loading = sectionsLoading || bellLoading || periodsLoading

  // Resolve the default bell schedule
  const defaultSchedule = useMemo(() => {
    if (!bellSchedules || bellSchedules.length === 0) return null
    return bellSchedules.find((bs) => bs.isDefault && bs.isActive)
      ?? bellSchedules.find((bs) => bs.isActive)
      ?? bellSchedules[0]
  }, [bellSchedules])

  // Build period map for QuickReferenceTable and CourseCard time resolution
  const periodMap = useMemo(() => {
    if (!defaultSchedule) return new Map<string, BellSchedulePeriod>()
    const map = new Map<string, BellSchedulePeriod>()
    for (const p of defaultSchedule.classPeriods) {
      // Map by periodNumber as string (sections reference via periodId)
      map.set(String(p.periodNumber), p)
      map.set(p.classPeriodName, p)
    }
    return map
  }, [defaultSchedule])

  // Build timetable slots (rows) from bell schedule periods
  const timetableSlots: TimetableSlot[] = useMemo(() => {
    if (!defaultSchedule) return []
    return defaultSchedule.classPeriods
      .filter((p) => p.periodType !== 'passing') // skip passing time
      .sort((a, b) => a.periodNumber - b.periodNumber)
      .map((p) => ({
        periodNumber: p.periodNumber,
        periodName: p.classPeriodName,
        startTime: p.startTime,
        endTime: p.endTime,
        periodType: p.periodType,
        isAcademic: p.isAcademic,
      }))
  }, [defaultSchedule])

  // Build class blocks from sections × periods
  // Each section occupies its periodNumber across all weekdays
  // (unless dayOfWeek restriction exists on the bell schedule period)
  const timetableBlocks: TimetableClassBlock[] = useMemo(() => {
    if (!sections || !defaultSchedule) return []

    const blocks: TimetableClassBlock[] = []
    for (const section of sections) {
      // Resolve which period this section occupies
      const period = section.periodId
        ? (periodMap.get(section.periodId) ?? null)
        : null

      if (!period) continue

      // Determine which days this class runs
      const days = period.dayOfWeek && period.dayOfWeek.length > 0
        ? period.dayOfWeek.map(dowToNumber)
        : [1, 2, 3, 4, 5] // Default: all weekdays

      for (const day of days) {
        blocks.push({
          periodNumber: period.periodNumber,
          dayOfWeek: day,
          courseName: section.courseName,
          courseCode: section.courseCode,
          room: section.room,
          teacherName: section.teacherName,
          sectionId: section.sectionId,
        })
      }
    }
    return blocks
  }, [sections, defaultSchedule, periodMap])

  // Week start date (Monday of current week)
  const weekStartDate = useMemo(() => {
    const now = new Date()
    const day = now.getDay()
    const diff = day === 0 ? -6 : 1 - day // Monday
    const monday = new Date(now)
    monday.setDate(now.getDate() + diff)
    return monday.toISOString().slice(0, 10)
  }, [])

  return (
    <div className="p-6 space-y-6" data-v2>
      {/* Header + view switcher */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1
          className="text-xl font-semibold"
          style={{ color: 'var(--v2-text-primary)' }}
        >
          {t('pages.mySchedule')}
        </h1>
        <ViewSwitcher activeView={view} onChange={setView} />
      </div>

      {/* Timetable or day view */}
      <WidgetErrorBoundaryV2>
        {view === 'week' ? (
          <ContentSection staggerIndex={1}>
            {timetableSlots.length > 0 ? (
              <WeekTimetable
                periods={timetableSlots}
                blocks={timetableBlocks}
                weekStartDate={weekStartDate}
              />
            ) : (
              <EmptySchedule loading={loading} message={t('schedule.noSections')} />
            )}
          </ContentSection>
        ) : (
          <TodayTimeline
            sections={sections}
            bellSchedules={bellSchedules}
            classPeriods={classPeriods}
            loading={loading}
            heading={t('schedule.today')}
            staggerIndex={1}
          />
        )}
      </WidgetErrorBoundaryV2>

      {/* Course cards grid */}
      <WidgetErrorBoundaryV2>
        <CourseCardsSection
          sections={sections}
          periodMap={periodMap}
          loading={loading}
        />
      </WidgetErrorBoundaryV2>

      {/* Quick reference table */}
      <WidgetErrorBoundaryV2>
        <QuickReferenceTable
          sections={sections}
          periodMap={periodMap}
          loading={loading}
          staggerIndex={3}
        />
      </WidgetErrorBoundaryV2>
    </div>
  )
}

// ============================================================================
// COURSE CARDS SECTION
// ============================================================================

function CourseCardsSection({
  sections,
  periodMap,
  loading,
}: {
  sections?: Array<{
    sectionId: string
    courseName: string
    courseCode?: string
    teacherName?: string
    room?: string
    periodId?: string
  }>
  periodMap: Map<string, BellSchedulePeriod>
  loading: boolean
}) {
  const { t } = useTranslation('portal')

  if (loading) {
    return (
      <ContentSection heading={t('schedule.coursesAndTeachers')} staggerIndex={2}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-36 rounded-xl v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
          ))}
        </div>
      </ContentSection>
    )
  }

  if (!sections || sections.length === 0) return null

  return (
    <ContentSection heading={t('schedule.coursesAndTeachers')} staggerIndex={2}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        {sections.map((section) => {
          const period = section.periodId ? periodMap.get(section.periodId) : undefined

          return (
            <CourseCard
              key={section.sectionId}
              courseName={section.courseName}
              courseCode={section.courseCode}
              teacherName={section.teacherName}
              // Schedule context: show time/room info instead of grades
              categories={period ? [{
                name: `${period.startTime}–${period.endTime}`,
                weight: 0,
                percentage: 0,
              }] : undefined}
            />
          )
        })}
      </div>
    </ContentSection>
  )
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptySchedule({ loading, message }: { loading: boolean; message: string }) {
  if (loading) {
    return <div className="h-64 rounded-xl v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
  }
  return (
    <div className="py-12 text-center">
      <p className="text-sm" style={{ color: 'var(--v2-text-muted)' }}>
        {message}
      </p>
    </div>
  )
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Convert day-of-week string to ISO number (1=Mon, 5=Fri).
 * Bell schedule uses lowercase day names from the periodTypeSchema.
 */
function dowToNumber(day: string): number {
  const map: Record<string, number> = {
    monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5,
    saturday: 6, sunday: 7,
  }
  return map[day.toLowerCase()] ?? 1
}
