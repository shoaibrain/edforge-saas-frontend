/**
 * DashboardLayout — the canonical dashboard assembly.
 *
 * PageHeader → AlertLane → StatBand → WidgetCard grid. Home and every module
 * Overview render this exact structure and differ ONLY by config (header mode +
 * alerts/metrics/widgets), so the surfaces can never drift apart.
 */
import type { ReactNode } from 'react'
import { cn } from '../../utils'
import { PageHeader, type PageHeaderProps } from '../layout/PageHeader'
import { StatBand, type StatMetric } from '../StatBand'
import { AlertLane, type DashboardAlert } from './AlertLane'
import { WidgetCard, WidgetGrid, type WidgetCardProps } from './WidgetCard'

export interface DashboardLayoutProps {
  header: PageHeaderProps
  alerts?: DashboardAlert[]
  /** Passed to AlertLane — change it (e.g. to the active role) to reset the lane's session state. */
  alertResetKey?: string | number
  metrics: StatMetric[]
  statBandAriaLabel?: string
  widgets: WidgetCardProps[]
  /** Extra content rendered after the widget grid (optional). */
  children?: ReactNode
  className?: string
}

export function DashboardLayout({
  header,
  alerts,
  alertResetKey,
  metrics,
  statBandAriaLabel,
  widgets,
  children,
  className,
}: DashboardLayoutProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <PageHeader {...header} />
      {alerts ? <AlertLane alerts={alerts} resetKey={alertResetKey} /> : null}
      <StatBand metrics={metrics} ariaLabel={statBandAriaLabel} />
      <WidgetGrid>
        {widgets.map((w, i) => (
          <WidgetCard key={`${w.title}-${i}`} {...w} />
        ))}
      </WidgetGrid>
      {children}
    </div>
  )
}
