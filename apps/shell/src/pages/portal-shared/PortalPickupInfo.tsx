/**
 * PortalPickupInfo — Top section indicating Drop-Off, Lunch, Pickup.
 * Derived from UI Prototype.
 */

import { useMemo } from 'react'
import { Sun, Coffee, Moon } from 'lucide-react'
import type { BellSchedule } from '../../hooks/usePortalBellSchedule'

export interface PortalPickupInfoProps {
  bellSchedules?: BellSchedule[]
}

export function PortalPickupInfo({ bellSchedules }: PortalPickupInfoProps) {
  
  const cards = useMemo(() => {
    if (!bellSchedules || bellSchedules.length === 0) return []

    // Use the default schedule
    const schedule = bellSchedules.find((bs) => bs.isDefault && bs.isActive)
      ?? bellSchedules.find((bs) => bs.isActive)
      ?? bellSchedules[0]

    if (!schedule || schedule.classPeriods.length === 0) return []

    const sorted = [...schedule.classPeriods].sort((a, b) => a.periodNumber - b.periodNumber)

    const dropOff = schedule.startTime ?? sorted[0].startTime
    const pickup = schedule.endTime ?? sorted[sorted.length - 1].endTime
    const lunchPeriod = sorted.find((p) => p.periodType === 'lunch')

    const result = [
      { key: 'dropoff', label: 'Drop-off', time: dropOff, icon: Sun, color: 'var(--fp-butter)', bg: 'var(--fp-butter-soft)', desc: "Main gate - Gate B" }
    ]

    if (lunchPeriod) {
      result.push({ key: 'lunch', label: 'Lunch', time: lunchPeriod.startTime, icon: Coffee, color: 'var(--fp-sage)', bg: 'var(--fp-sage-soft)', desc: "Cafeteria - Veg menu today" })
    } else {
      result.push({ key: 'lunch', label: 'Lunch', time: '12:00:00', icon: Coffee, color: 'var(--fp-sage)', bg: 'var(--fp-sage-soft)', desc: "Cafeteria" })
    }

    result.push({ key: 'pickup', label: 'Pickup', time: pickup, icon: Moon, color: 'var(--fp-indigo)', bg: 'var(--fp-indigo-soft)', desc: "Main gate - You're on the list" })

    return result
  }, [bellSchedules])

  if (cards.length === 0) return null

  // Format time util
  const formatTime = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'pm' : 'am'
    const hr = h % 12 || 12
    return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`
  }

  return (
    <div className="fp-pickup-strip">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div key={card.key} className="fp-pickup-card">
            <div className="fp-pickup-icon" style={{ background: card.bg, color: card.color }}>
              <Icon size={20} strokeWidth={2} />
            </div>
            <div>
              <h4>{card.label}</h4>
              <strong>{formatTime(card.time)}</strong>
              <span>{card.desc}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
