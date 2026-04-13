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
  /** Humanized empty-state message (line1 = headline, line2 = subtext) */
  emptyMessage?: { line1: string; line2?: string }
}

interface TimelineEntry {
  sectionId: string
  courseName: string
  courseCode?: string
  room?: string
  teacherName?: string
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
      teacherName: section.teacherName,
      startTime: times.start,
      endTime: times.end,
      status: getTimeStatus(times.start, times.end),
    })
  }

  return entries.sort((a, b) => a.startTime.localeCompare(b.startTime))
}

export function TodayTimeline({
  sections,
  bellSchedules,
  classPeriods,
  isHoliday,
  loading,
  staggerIndex = 2,
  heading,
  emptyMessage,
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
        {/* Humanized empty state — context-aware (weekend / evening / weekday) */}
        <div
          className="border mt-4"
          style={{
            background: 'var(--v2-bg-surface)',
            borderColor: 'var(--v2-border-default)',
            borderRadius: 22,
            padding: '40px 30px',
            boxShadow: 'var(--v2-shadow-card, 0 1px 3px rgba(0,0,0,0.06))',
            textAlign: 'center',
          }}
        >
          <p
            className="font-display italic"
            style={{
              fontSize: 18,
              fontWeight: 400,
              color: 'var(--v2-text-secondary)',
              marginBottom: 6,
            }}
          >
            {emptyMessage?.line1 ?? t('schedule.noClassesToday')}
          </p>
          {emptyMessage?.line2 && (
            <p style={{ fontSize: 13, color: 'var(--v2-text-muted)' }}>
              {emptyMessage.line2}
            </p>
          )}
        </div>
      </ContentSection>
    )
  }

  return (
    <ContentSection
      heading={heading ?? t('schedule.today')}
      staggerIndex={staggerIndex}
    >
      {/* Today card — white card with warm shadow, editorial timeline layout.
           Prototype: 28px 30px padding, 22px radius, 3-column grid per row:
           time(110px) | dot+name+teacher(1fr) | actions(auto) */}
      <div
        className="border mt-4"
        style={{
          background: 'var(--v2-bg-surface)',
          borderColor: 'var(--v2-border-default)',
          borderRadius: 22,
          padding: '28px 30px',
          boxShadow: 'var(--v2-shadow-card, 0 1px 3px rgba(0,0,0,0.06))',
        }}
      >
        {entries.map((entry, i) => (
          <div key={entry.sectionId}>
            {i > 0 && <DashedDivider className="my-0" />}
            <div
              className="grid items-center transition-opacity"
              style={{
                gridTemplateColumns: '100px 1fr auto',
                gap: 18,
                padding: '18px 0',
                opacity: entry.status === 'done' ? 0.5 : 1,
                borderBottom: i < entries.length - 1 ? 'none' : 'none',
              }}
            >
              {/* Time column — monospace, start–end range */}
              <div>
                <span
                  className="font-mono tabular-nums"
                  style={{
                    fontSize: 12,
                    letterSpacing: '0.02em',
                    color: 'var(--v2-text-muted)',
                  }}
                >
                  {entry.startTime.slice(0, 5)} – {entry.endTime.slice(0, 5)}
                </span>
              </div>

              {/* Class info — colored dot + serif name + teacher */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    background: entry.status === 'now'
                      ? 'var(--v2-brand-primary)'
                      : 'var(--v2-text-muted)',
                    boxShadow: entry.status === 'now'
                      ? '0 0 0 3px var(--v2-success-bg)'
                      : 'none',
                  }}
                />
                <div className="min-w-0">
                  <p
                    className="font-display truncate"
                    style={{
                      fontSize: 20,
                      fontWeight: 500,
                      letterSpacing: '-0.01em',
                      color: 'var(--v2-text-primary)',
                    }}
                  >
                    {entry.courseName}
                  </p>
                  {(entry.teacherName || entry.room) && (
                    <p
                      style={{ fontSize: 12, color: 'var(--v2-text-muted)', marginTop: 2 }}
                    >
                      {entry.teacherName}
                      {entry.teacherName && entry.room ? ' · ' : ''}
                      {entry.room}
                    </p>
                  )}
                </div>
              </div>

              {/* Status badge */}
              <div>
                {entry.status === 'now' && (
                  <span
                    className="inline-flex items-center gap-1.5 font-mono uppercase"
                    style={{
                      padding: '5px 10px',
                      background: 'var(--v2-bg-elevated)',
                      color: 'var(--v2-brand-primary)',
                      borderRadius: 999,
                      fontSize: 10,
                      letterSpacing: '0.1em',
                      fontWeight: 500,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ background: 'var(--v2-brand-primary)' }}
                    />
                    Now
                  </span>
                )}
                {entry.status === 'done' && (
                  <span
                    className="font-mono uppercase"
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.1em',
                      color: 'var(--v2-text-hint)',
                    }}
                  >
                    Done
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ContentSection>
  )
}
