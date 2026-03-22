/**
 * OverdueAlertBanner — V2
 *
 * Critical alert banner shown when overdue invoices exist.
 */

import { useNavigate } from '@tanstack/react-router'
import { AlertTriangle } from 'lucide-react'
import { V2AlertItem } from '@edforge/ui'
import { useCurrency } from '@edforge/types/use-currency'
import { useFinanceSettings } from '../../layouts/FinanceLayout'

interface OverdueAlertBannerProps {
  overdue: number
  overdueCount: number
  collectionRate: number
  draftCount: number
  agingReport: Array<{ label: string; count: number }>
}

export function OverdueAlertBanner({
  overdue,
  overdueCount,
  collectionRate,
  draftCount,
  agingReport,
}: OverdueAlertBannerProps) {
  const settings = useFinanceSettings()
  const { formatShort } = useCurrency(settings)
  const navigate = useNavigate()

  if (overdue <= 0) return null

  // Dynamic aging label from the largest non-zero bucket
  const largestBucket = agingReport
    .filter((b) => b.count > 0)
    .sort((a, b) => b.count - a.count)[0]
  const agingLabel = largestBucket
    ? `${largestBucket.count} invoices in ${largestBucket.label} bucket`
    : ''

  const subtitle = [
    `Collection rate is ${collectionRate.toFixed(1)}%`,
    agingLabel,
    draftCount > 0 ? `${draftCount} additional drafts need to be issued` : '',
  ]
    .filter(Boolean)
    .join('. ') + '.'

  return (
    <V2AlertItem
      severity="critical"
      title={`${overdueCount} invoices overdue — ${formatShort(overdue)} uncollected`}
      subtitle={subtitle}
      icon={<AlertTriangle className="w-3.5 h-3.5" />}
      cta={{
        label: 'Review billing',
        onClick: () => navigate({ to: '/invoices', search: { status: 'overdue' } as any }),
      }}
    />
  )
}
