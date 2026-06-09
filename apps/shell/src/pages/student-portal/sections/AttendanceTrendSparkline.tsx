/**
 * AttendanceTrendSparkline — Monthly attendance rate sparkline (student-only)
 *
 * Derives monthly aggregates client-side from attendance records.
 * Uses Recharts (already in dependency tree).
 */

import { useMemo } from 'react'
import { useTranslation } from '@edforge/i18n'
import { ContentSection } from '@edforge/ui'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import type { AttendanceRecord } from '../../../hooks/usePortalStudentAttendance'

export interface AttendanceTrendSparklineProps {
  records?: AttendanceRecord[]
  loading?: boolean
  staggerIndex?: number
}

interface MonthPoint {
  month: string
  rate: number
}

function aggregateByMonth(records: AttendanceRecord[]): MonthPoint[] {
  const months = new Map<string, { present: number; total: number }>()

  for (const rec of records) {
    const ym = rec.date.slice(0, 7) // YYYY-MM
    const entry = months.get(ym) ?? { present: 0, total: 0 }
    entry.total++
    if (rec.status === 'present' || rec.status === 'late') entry.present++
    months.set(ym, entry)
  }

  return Array.from(months.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { present, total }]) => ({
      month: new Date(month + '-01').toLocaleDateString(undefined, { month: 'short' }),
      rate: total > 0 ? Math.round((present / total) * 100) : 0,
    }))
}

export function AttendanceTrendSparkline({
  records,
  loading,
  staggerIndex = 3,
}: AttendanceTrendSparklineProps) {
  const { t } = useTranslation('portal')

  const data = useMemo(() => {
    if (!records || records.length === 0) return []
    return aggregateByMonth(records)
  }, [records])

  if (loading) {
    return (
      <ContentSection heading={t('attendance.monthlyTrend')} staggerIndex={staggerIndex}>
        <div className="h-32 rounded bg-[rgb(var(--background-tertiary))] v2-skeleton-pulse mt-3" />
      </ContentSection>
    )
  }

  if (data.length < 2) {
    return (
      <ContentSection heading={t('attendance.monthlyTrend')} staggerIndex={staggerIndex}>
        <p className="text-sm py-4" style={{ color: 'rgb(var(--text-tertiary))' }}>
          {t('attendance.noDataToGraph')}
        </p>
      </ContentSection>
    )
  }

  return (
    <ContentSection heading={t('attendance.monthlyTrend')} staggerIndex={staggerIndex}>
      <div className="h-32 mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#1D9E75" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: 'rgb(var(--text-tertiary))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis domain={[0, 100]} hide />
            <Tooltip
              contentStyle={{
                background: 'rgb(var(--background-tertiary))',
                border: '1px solid rgb(var(--border-primary) / 0.35)',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: 'rgb(var(--text-primary))' }}
              formatter={(value) => [`${value}%`, 'Rate']}
            />
            <Area
              type="monotone"
              dataKey="rate"
              stroke="#1D9E75"
              strokeWidth={2}
              fill="url(#rateGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ContentSection>
  )
}
