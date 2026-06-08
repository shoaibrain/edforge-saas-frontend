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
        <div className="h-32 rounded bg-[var(--v2-bg-elevated)] v2-skeleton-pulse mt-3" />
      </ContentSection>
    )
  }

  if (!sections || sections.length === 0) return null

  return (
    <ContentSection heading={t('schedule.quickReference')} staggerIndex={staggerIndex}>
      <div
        className="rounded-xl border mt-3 overflow-x-auto"
        style={{
          background: 'var(--v2-bg-surface)',
          borderColor: 'var(--v2-border-default)',
        }}
      >
        <table className="w-full text-xs">
          <thead>
            <tr
              className="border-b"
              style={{ borderColor: 'var(--v2-border-default)' }}
            >
              {['Course', 'Section', 'Teacher', 'Period', 'Time', 'Room'].map((h) => (
                <th
                  key={h}
                  className="text-left px-3 py-2.5 font-medium uppercase tracking-[0.04em]"
                  style={{ color: 'var(--v2-text-hint)' }}
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
                  style={{ borderColor: 'var(--v2-border-default)' }}
                >
                  <td
                    className="px-3 py-2.5 font-medium"
                    style={{ color: 'var(--v2-text-primary)' }}
                  >
                    {section.courseName}
                  </td>
                  <td style={{ color: 'var(--v2-text-secondary)' }} className="px-3 py-2.5">
                    {section.sectionName ?? '—'}
                  </td>
                  <td style={{ color: 'var(--v2-text-secondary)' }} className="px-3 py-2.5">
                    {section.teacherName ?? '—'}
                  </td>
                  <td
                    className="px-3 py-2.5 font-mono tabular-nums"
                    style={{ color: 'var(--v2-text-secondary)' }}
                  >
                    {period?.classPeriodName ?? '—'}
                  </td>
                  <td
                    className="px-3 py-2.5 font-mono tabular-nums"
                    style={{ color: 'var(--v2-text-secondary)' }}
                  >
                    {period
                      ? `${period.startTime}–${period.endTime}`
                      : '—'}
                  </td>
                  <td style={{ color: 'var(--v2-text-secondary)' }} className="px-3 py-2.5">
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
