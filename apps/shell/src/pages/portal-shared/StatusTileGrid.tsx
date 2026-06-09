/**
 * StatusTileGrid — 2x2 grid of attendance status tiles
 *
 * Present, Absent, Late, Excused counts with icons and semantic colors.
 */

import { useTranslation } from '@edforge/i18n'
import { CalendarCheck, CalendarX2, Clock, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface StatusTileGridProps {
  present: number
  absent: number
  late: number
  excused: number
}

const TILES: Array<{
  key: keyof StatusTileGridProps
  i18nKey: string
  icon: LucideIcon
  color: string
  bg: string
}> = [
  { key: 'present', i18nKey: 'stats.presentDays', icon: CalendarCheck, color: 'rgb(var(--state-success-fg))', bg: 'rgb(var(--state-success-bg))' },
  { key: 'absent', i18nKey: 'stats.absentDays', icon: CalendarX2, color: 'rgb(var(--state-danger-fg))', bg: 'rgb(var(--state-danger-bg))' },
  { key: 'late', i18nKey: 'stats.lateDays', icon: Clock, color: 'rgb(var(--state-warning-fg))', bg: 'rgb(var(--state-warning-bg))' },
  { key: 'excused', i18nKey: 'stats.excusedDays', icon: ShieldCheck, color: 'rgb(var(--state-info-fg))', bg: 'rgb(var(--state-info-bg))' },
]

export function StatusTileGrid(props: StatusTileGridProps) {
  const { t } = useTranslation('portal')

  return (
    <div className="grid grid-cols-2 gap-2">
      {TILES.map(({ key, i18nKey, icon: Icon, color, bg }) => (
        <div
          key={key}
          className="rounded-lg p-3 flex items-center gap-2.5"
          style={{ background: bg }}
          role="status"
          aria-label={`${t(i18nKey)}: ${props[key]} days`}
        >
          <Icon className="w-4 h-4 shrink-0" style={{ color }} />
          <div>
            <p
              className="text-base font-semibold tabular-nums leading-none"
              style={{ color }}
            >
              {props[key]}
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: 'rgb(var(--text-tertiary))' }}
            >
              {t(i18nKey)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
