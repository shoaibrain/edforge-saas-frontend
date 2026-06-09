/**
 * QuickReferenceTable — Student-only tabular list of enrolled sections
 *
 * Simple table: Course, Section, Teacher, Period, Time, Room.
 * Period/Time populated from bell schedule join.
 */

import { useTranslation } from '@edforge/i18n'
import { ContentSection } from '@edforge/ui'
import type { StudentSection } from '../../../hooks/useStudentSections'
import type { BellSchedulePeriod } from '../../../hooks/usePortalBellSchedule'

export interface QuickReferenceTableProps {
  sections?: StudentSection[]
  /** Map of periodId → bell schedule period for time resolution */
  periodMap?: Map<string, BellSchedulePeriod>
  loading?: boolean
  staggerIndex?: number
}

export function QuickReferenceTable({
  sections,
  periodMap,
  loading,
  staggerIndex = 4,
}: QuickReferenceTableProps) {
  const { t } = useTranslation('portal')

  if (loading) {
    return (
      <ContentSection heading={t('schedule.quickReference')} staggerIndex={staggerIndex}>
        <div className="h-32 rounded bg-[rgb(var(--background-tertiary))] v2-skeleton-pulse mt-3" />
      </ContentSection>
    )
  }

  if (!sections || sections.length === 0) return null

  return (
    <ContentSection heading={t('schedule.quickReference')} staggerIndex={staggerIndex}>
      <div
        className="rounded-xl border mt-3 overflow-x-auto"
        style={{
          background: 'rgb(var(--background-secondary))',
          borderColor: 'rgb(var(--border-primary) / 0.35)',
        }}
      >
        <table className="w-full text-xs">
          <thead>
            <tr
              className="border-b"
              style={{ borderColor: 'rgb(var(--border-primary) / 0.35)' }}
            >
              {['Course', 'Section', 'Teacher', 'Period', 'Time', 'Room'].map((h) => (
                <th
                  key={h}
                  className="text-left px-3 py-2.5 font-medium uppercase tracking-[0.04em]"
                  style={{ color: 'rgb(var(--text-tertiary))' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => {
              const period = section.periodId
                ? periodMap?.get(section.periodId)
                : undefined

              return (
                <tr
                  key={section.sectionId}
                  className="border-b last:border-b-0"
                  style={{ borderColor: 'rgb(var(--border-primary) / 0.35)' }}
                >
                  <td
                    className="px-3 py-2.5 font-medium"
                    style={{ color: 'rgb(var(--text-primary))' }}
                  >
                    {section.courseName}
                  </td>
                  <td style={{ color: 'rgb(var(--text-secondary))' }} className="px-3 py-2.5">
                    {section.sectionName ?? '—'}
                  </td>
                  <td style={{ color: 'rgb(var(--text-secondary))' }} className="px-3 py-2.5">
                    {section.teacherName ?? '—'}
                  </td>
                  <td
                    className="px-3 py-2.5 font-mono tabular-nums"
                    style={{ color: 'rgb(var(--text-secondary))' }}
                  >
                    {period?.classPeriodName ?? '—'}
                  </td>
                  <td
                    className="px-3 py-2.5 font-mono tabular-nums"
                    style={{ color: 'rgb(var(--text-secondary))' }}
                  >
                    {period
                      ? `${period.startTime}–${period.endTime}`
                      : '—'}
                  </td>
                  <td style={{ color: 'rgb(var(--text-secondary))' }} className="px-3 py-2.5">
                    {section.room ?? '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </ContentSection>
  )
}
