/**
 * AttendanceRateHero — Dark-themed hero card with rate + status tiles
 *
 * Left: large attendance %, narrative. Right: StatusTileGrid.
 * Works in both light and dark mode (forced dark surface).
 */

import { useTranslation } from '@edforge/i18n'
import { ContentSection, Skeleton } from '@edforge/ui'
import { useCountUp } from '@edforge/ui'
import { StatusTileGrid } from './StatusTileGrid'

export interface AttendanceRateHeroProps {
  attendanceRate?: number | null
  totalDays?: number
  present?: number
  absent?: number
  late?: number
  excused?: number
  loading?: boolean
  staggerIndex?: number
}

export function AttendanceRateHero({
  attendanceRate,
  totalDays = 0,
  present = 0,
  absent = 0,
  late = 0,
  excused = 0,
  loading,
  staggerIndex = 1,
}: AttendanceRateHeroProps) {
  const { t } = useTranslation('portal')
  const animatedRate = useCountUp(attendanceRate ?? 0, 800, { enabled: !loading && attendanceRate != null })

  if (loading) {
    return (
      <ContentSection staggerIndex={staggerIndex}>
        <div className="rounded-xl p-6" style={{ background: 'var(--v2-bg-elevated)' }}>
          <div className="flex flex-col sm:flex-row gap-6">
            <Skeleton className="h-24 w-32" />
            <div className="flex-1 grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          </div>
        </div>
      </ContentSection>
    )
  }

  const hasData = attendanceRate != null && totalDays > 0
  const displayRate = hasData ? `${Math.round(animatedRate)}%` : '—%'

  return (
    <ContentSection staggerIndex={staggerIndex}>
      {/* Hero gradient card — subtle brand tint for visual prominence */}
      <div
        className="rounded-2xl p-6 sm:p-8 border"
        style={{
          background: 'linear-gradient(135deg, var(--v2-bg-elevated) 0%, color-mix(in srgb, var(--v2-brand-primary) 6%, var(--v2-bg-elevated)) 100%)',
          borderColor: 'var(--v2-border-default)',
        }}
      >
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          {/* Left: rate display */}
          <div className="text-center sm:text-left shrink-0">
            <p
              className="font-display text-5xl font-medium tabular-nums tracking-tight"
              style={{ color: 'var(--v2-text-primary)' }}
            >
              {displayRate}
            </p>
            <p
              className="text-[11px] uppercase tracking-[0.04em] mt-1"
              style={{ color: 'var(--v2-text-muted)' }}
            >
              {t('attendance.yearToDate')}
            </p>
            {hasData && (
              <p
                className="text-[12px] mt-2 max-w-[200px]"
                style={{ color: 'var(--v2-text-secondary)' }}
              >
                {attendanceRate >= 95
                  ? 'Excellent attendance so far.'
                  : attendanceRate >= 90
                    ? 'A good term so far.'
                    : attendanceRate >= 80
                      ? 'Room for improvement.'
                      : 'Attendance needs attention.'}
              </p>
            )}
            {!hasData && (
              <p
                className="text-[12px] mt-2"
                style={{ color: 'var(--v2-text-hint)' }}
              >
                {t('attendance.noRecords')}
              </p>
            )}
          </div>

          {/* Right: status tiles */}
          <div className="flex-1 w-full">
            <StatusTileGrid
              present={present}
              absent={absent}
              late={late}
              excused={excused}
            />
          </div>
        </div>
      </div>
    </ContentSection>
  )
}
