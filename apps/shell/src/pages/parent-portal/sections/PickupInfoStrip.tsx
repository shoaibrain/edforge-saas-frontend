/**
 * PickupInfoStrip — Parent-only strip showing drop-off / lunch / pickup times
 *
 * Derives times from the default bell schedule:
 *   - Drop-off: startTime of first period (or overall schedule startTime)
 *   - Lunch:    startTime of the period with periodType === 'lunch'
 *   - Pickup:   endTime of last period (or overall schedule endTime)
 *
 * Returns null if no bell schedule data exists.
 * Lunch card individually omitted if no lunch period is identifiable.
 */

import { useMemo } from 'react'
import { useTranslation } from '@edforge/i18n'
import { ContentSection } from '@edforge/ui'
import { ArrowDownToLine, UtensilsCrossed, ArrowUpFromLine } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { BellSchedule } from '../../../hooks/usePortalBellSchedule'

export interface PickupInfoStripProps {
  bellSchedules?: BellSchedule[]
  staggerIndex?: number
}

interface InfoCard {
  key: string
  label: string
  time: string
  icon: LucideIcon
}

export function PickupInfoStrip({ bellSchedules, staggerIndex = 0 }: PickupInfoStripProps) {
  const { t } = useTranslation('portal')

  const cards = useMemo((): InfoCard[] => {
    if (!bellSchedules || bellSchedules.length === 0) return []

    // Use the default schedule, falling back to the first active one
    const schedule = bellSchedules.find((bs) => bs.isDefault && bs.isActive)
      ?? bellSchedules.find((bs) => bs.isActive)
      ?? bellSchedules[0]

    if (!schedule || schedule.classPeriods.length === 0) return []

    const sorted = [...schedule.classPeriods].sort((a, b) => a.periodNumber - b.periodNumber)

    // Drop-off: earliest period start or overall schedule start
    const dropOff = schedule.startTime ?? sorted[0].startTime
    // Pickup: latest period end or overall schedule end
    const pickup = schedule.endTime ?? sorted[sorted.length - 1].endTime

    const result: InfoCard[] = [
      { key: 'dropoff', label: t('schedule.dropOff'), time: dropOff, icon: ArrowDownToLine },
    ]

    // Lunch: find the lunch-type period (if any)
    const lunchPeriod = sorted.find((p) => p.periodType === 'lunch')
    if (lunchPeriod) {
      result.push({ key: 'lunch', label: t('schedule.lunch'), time: lunchPeriod.startTime, icon: UtensilsCrossed })
    }

    result.push({ key: 'pickup', label: t('schedule.pickup'), time: pickup, icon: ArrowUpFromLine })

    return result
  }, [bellSchedules, t])

  if (cards.length === 0) return null

  return (
    <ContentSection staggerIndex={staggerIndex}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.key}
              className="rounded-xl border p-4 flex items-center gap-3 transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-md"
              style={{
                background: 'var(--v2-bg-surface)',
                borderColor: 'var(--v2-border-default)',
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'var(--v2-surface-interactive)' }}
              >
                <Icon className="w-4 h-4" style={{ color: 'var(--v2-text-muted)' }} />
              </div>
              <div>
                <p
                  className="text-xs uppercase tracking-[0.04em]"
                  style={{ color: 'var(--v2-text-hint)' }}
                >
                  {card.label}
                </p>
                <p
                  className="text-base font-semibold font-mono tabular-nums"
                  style={{ color: 'var(--v2-text-primary)' }}
                >
                  {card.time}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </ContentSection>
  )
}
