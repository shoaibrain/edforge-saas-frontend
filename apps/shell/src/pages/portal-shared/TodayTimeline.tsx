/**
 * TodayTimeline — Shared schedule timeline for portal home pages
 *
 * Shows today's classes in chronological order with done/now/upcoming status.
 * Derives schedule from sections + bell schedule + class periods join.
 */

import { useMemo } from 'react'
import { useTranslation } from '@edforge/i18n'
import { ContentSection, DashedDivider, Skeleton } from '@edforge/ui'
import type { StudentSection } from '../../hooks/useStudentSections'
import type { BellSchedule } from '../../hooks/usePortalBellSchedule'
import type { ClassPeriod } from '../../hooks/usePortalClassPeriods'

export interface TodayTimelineProps {
  sections?: StudentSection[]
  bellSchedules?: BellSchedule[]
  classPeriods?: ClassPeriod[]
  isHoliday?: boolean
  loading?: boolean
  staggerIndex?: number
  /** Label above the timeline (e.g., "Today for Blessed") */
  heading?: string
}

interface TimelineEntry {
  sectionId: string
  courseName: string
  courseCode?: string
  room?: string
  startTime: string
  endTime: string
  status: 'done' | 'now' | 'upcoming'
}

function getTimeStatus(startTime: string, endTime: string): 'done' | 'now' | 'upcoming' {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const start = new Date(`${today}T${startTime}`)
  const end = new Date(`${today}T${endTime}`)

  if (now > end) return 'done'
  if (now >= start && now <= end) return 'now'
  return 'upcoming'
}

function buildTimeline(
  sections: StudentSection[],
  bellSchedules: BellSchedule[],
  classPeriods: ClassPeriod[]
): TimelineEntry[] {
  const defaultSchedule = bellSchedules.find((bs) => bs.isDefault && bs.isActive)
    ?? bellSchedules.find((bs) => bs.isActive)
    ?? bellSchedules[0]
  if (!defaultSchedule) return []

  // Build period time lookup from bell schedule embedded classPeriods
  const periodTimeMap = new Map<string, { start: string; end: string }>()
  for (const period of defaultSchedule.classPeriods) {
    // Map by periodNumber (string) since sections reference via periodId
    periodTimeMap.set(String(period.periodNumber), {
      start: period.startTime,
      end: period.endTime,
    })
    periodTimeMap.set(period.classPeriodName, {
      start: period.startTime,
      end: period.endTime,
    })
  }
  // Also add from standalone class periods (fallback)
  for (const cp of classPeriods) {
    if (cp.startTime && cp.endTime && !periodTimeMap.has(cp.periodId)) {
      periodTimeMap.set(cp.periodId, { start: cp.startTime, end: cp.endTime })
    }
  }

  const entries: TimelineEntry[] = []
  for (const section of sections) {
    const times = section.periodId ? periodTimeMap.get(section.periodId) : null
    if (!times) continue

    entries.push({
      sectionId: section.sectionId,
      courseName: section.courseName,
      courseCode: section.courseCode,
      room: section.room,
      startTime: times.start,
      endTime: times.end,
      status: getTimeStatus(times.start, times.end),
    })
  }

  return entries.sort((a, b) => a.startTime.localeCompare(b.startTime))
}

const STATUS_COLORS: Record<string, string> = {
  done: 'var(--v2-text-hint)',
  now: 'var(--v2-brand-primary)',
  upcoming: 'var(--v2-text-primary)',
}

export function TodayTimeline({
  sections,
  bellSchedules,
  classPeriods,
  isHoliday,
  loading,
  staggerIndex = 2,
  heading,
}: TodayTimelineProps) {
  const { t } = useTranslation('portal')

  const entries = useMemo(() => {
    if (!sections || !bellSchedules || !classPeriods) return []
    return buildTimeline(sections, bellSchedules, classPeriods)
  }, [sections, bellSchedules, classPeriods])

  if (loading) {
    return (
      <ContentSection staggerIndex={staggerIndex}>
        <Skeleton className="h-5 w-40 mb-3" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      </ContentSection>
    )
  }

  if (isHoliday || entries.length === 0) {
    return (
      <ContentSection
        heading={heading ?? t('schedule.today')}
        staggerIndex={staggerIndex}
      >
        <p
          className="text-sm py-6"
          style={{ color: 'var(--v2-text-muted)' }}
        >
          {t('schedule.noClassesToday')}
        </p>
      </ContentSection>
    )
  }

  return (
    <ContentSection
      heading={heading ?? t('schedule.today')}
      staggerIndex={staggerIndex}
    >
      <div
        className="rounded-xl border mt-3 overflow-hidden"
        style={{
          background: 'var(--v2-bg-surface)',
          borderColor: 'var(--v2-border-default)',
        }}
      >
        {entries.map((entry, i) => (
          <div key={entry.sectionId}>
            {i > 0 && <DashedDivider className="mx-4 my-0" />}
            <div
              className="flex items-center gap-3 px-4 py-3 transition-opacity"
              style={{ opacity: entry.status === 'done' ? 0.5 : 1 }}
            >
              {/* Time */}
              <div className="w-16 shrink-0 text-right">
                <span
                  className="text-[12px] font-mono tabular-nums"
                  style={{ color: STATUS_COLORS[entry.status] }}
                >
                  {entry.startTime.slice(0, 5)}
                </span>
              </div>

              {/* Color stripe */}
              <div
                className="w-1 self-stretch rounded-full shrink-0"
                style={{
                  background: entry.status === 'now'
                    ? 'var(--v2-brand-primary)'
                    : 'var(--v2-border-strong)',
                }}
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: STATUS_COLORS[entry.status] }}
                >
                  {entry.courseName}
                  {entry.status === 'now' && (
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full ml-2 align-middle"
                      style={{ background: 'var(--v2-brand-primary)' }}
                    />
                  )}
                </p>
                {entry.room && (
                  <p
                    className="text-[11px]"
                    style={{ color: 'var(--v2-text-hint)' }}
                  >
                    {entry.room}
                  </p>
                )}
              </div>

              {/* End time */}
              <span
                className="text-[11px] font-mono tabular-nums shrink-0"
                style={{ color: 'var(--v2-text-hint)' }}
              >
                {entry.endTime.slice(0, 5)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </ContentSection>
  )
}
