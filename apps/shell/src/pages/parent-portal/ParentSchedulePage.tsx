/**
 * Parent Portal — Child's Schedule Page (v2)
 *
 * Content pane: pickup info strip → week timetable → course cards.
 * No view switcher (week view only). No quick reference table.
 *
 * Inline apiGet migration: removes apiGet('/academics/students/${studentId}/sections')
 * (previously line ~35).
 *
 * ABAC: all endpoints verified accessible to Parent role (§1.8a).
 */

import { useMemo } from 'react'
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
import { useParentPortal } from './ParentPortalLayout'
import { useStudentSections } from '../../hooks/useStudentSections'
import { usePortalBellSchedule, type BellSchedulePeriod } from '../../hooks/usePortalBellSchedule'
import { NoActiveChild } from '../portal-shared/NoActiveChild'
import { PickupInfoStrip } from './sections/PickupInfoStrip'

// ============================================================================
// COMPONENT
// ============================================================================

export default function ParentSchedulePage() {
  const { activeChild } = useParentPortal()
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const { activeSchoolYear } = useShell()

  if (!activeChild) return <NoActiveChild />

  const studentId = activeChild.studentId
  const schoolId = activeSchoolId ?? activeChild.schoolId

  return (
    <ParentScheduleContent
      studentId={studentId}
      schoolId={schoolId}
      childName={activeChild.firstName}
      academicYearId={activeSchoolYear?.id}
    />
  )
}

function ParentScheduleContent({
  studentId,
  schoolId,
  childName,
  academicYearId,
}: {
  studentId: string
  schoolId: string
  childName: string
  academicYearId?: string
}) {
  const { t } = useTranslation('portal')

  // Data hooks
  const { data: sections, isLoading: sectionsLoading } =
    useStudentSections(studentId, schoolId, { academicYearId })
  const { data: bellSchedules, isLoading: bellLoading } =
    usePortalBellSchedule(schoolId)

  const loading = sectionsLoading || bellLoading

  // Resolve the default bell schedule
  const defaultSchedule = useMemo(() => {
    if (!bellSchedules || bellSchedules.length === 0) return null
    return bellSchedules.find((bs) => bs.isDefault && bs.isActive)
      ?? bellSchedules.find((bs) => bs.isActive)
      ?? bellSchedules[0]
  }, [bellSchedules])

  // Period map for time resolution
  const periodMap = useMemo(() => {
    if (!defaultSchedule) return new Map<string, BellSchedulePeriod>()
    const map = new Map<string, BellSchedulePeriod>()
    for (const p of defaultSchedule.classPeriods) {
      map.set(String(p.periodNumber), p)
      map.set(p.classPeriodName, p)
    }
    return map
  }, [defaultSchedule])

  // Timetable slots (rows)
  const timetableSlots: TimetableSlot[] = useMemo(() => {
    if (!defaultSchedule) return []
    return defaultSchedule.classPeriods
      .filter((p) => p.periodType !== 'passing')
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

  // Class blocks
  const timetableBlocks: TimetableClassBlock[] = useMemo(() => {
    if (!sections || !defaultSchedule) return []
    const blocks: TimetableClassBlock[] = []
    for (const section of sections) {
      const period = section.periodId ? (periodMap.get(section.periodId) ?? null) : null
      if (!period) continue
      const days = period.dayOfWeek && period.dayOfWeek.length > 0
        ? period.dayOfWeek.map(dowToNumber)
        : [1, 2, 3, 4, 5]
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

  // Week start (Monday)
  const weekStartDate = useMemo(() => {
    const now = new Date()
    const day = now.getDay()
    const diff = day === 0 ? -6 : 1 - day
    const monday = new Date(now)
    monday.setDate(now.getDate() + diff)
    return monday.toISOString().slice(0, 10)
  }, [])

  return (
    <div className="p-6 space-y-6" data-v2>
      <ContentSection
        heading={t('pages.childSchedule', { name: childName })}
        staggerIndex={0}
      />

      {/* Pickup info strip — conditionally rendered based on bell schedule */}
      <WidgetErrorBoundaryV2>
        <PickupInfoStrip bellSchedules={bellSchedules} staggerIndex={1} />
      </WidgetErrorBoundaryV2>

      {/* Week timetable */}
      <WidgetErrorBoundaryV2>
        <ContentSection staggerIndex={2}>
          {timetableSlots.length > 0 ? (
            <WeekTimetable
              periods={timetableSlots}
              blocks={timetableBlocks}
              weekStartDate={weekStartDate}
            />
          ) : loading ? (
            <div className="h-64 rounded-xl v2-skeleton-pulse" style={{ background: 'var(--v2-bg-elevated)' }} />
          ) : (
            <p className="text-sm py-8 text-center" style={{ color: 'var(--v2-text-muted)' }}>
              {t('schedule.noSections')}
            </p>
          )}
        </ContentSection>
      </WidgetErrorBoundaryV2>

      {/* Course cards */}
      <WidgetErrorBoundaryV2>
        <CourseCardsGrid sections={sections} periodMap={periodMap} loading={loading} />
      </WidgetErrorBoundaryV2>
    </div>
  )
}

// ============================================================================
// COURSE CARDS GRID
// ============================================================================

function CourseCardsGrid({
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
      <ContentSection heading={t('schedule.coursesAndTeachers')} staggerIndex={3}>
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
    <ContentSection heading={t('schedule.coursesAndTeachers')} staggerIndex={3}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        {sections.map((section) => {
          const period = section.periodId ? periodMap.get(section.periodId) : undefined
          return (
            <CourseCard
              key={section.sectionId}
              courseName={section.courseName}
              courseCode={section.courseCode}
              teacherName={section.teacherName}
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
// HELPERS
// ============================================================================

function dowToNumber(day: string): number {
  const map: Record<string, number> = {
    monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5,
    saturday: 6, sunday: 7,
  }
  return map[day.toLowerCase()] ?? 1
}
